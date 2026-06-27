import os from "os";
import { mkdtemp, writeFile } from "fs/promises";
import { join } from "path";
import { kafkaTopics } from "@finboard/contracts";
import { isKafkaEnabled } from "@finboard/kafka";
import { KycApplication } from "../models/kyc-application.model.js";
import {
  lookupIdentity,
  processDocumentOcr,
  verifyKycWithAi,
  notifyUser,
  audit,
  updateProfileKycStatus,
  getUsersByIds,
  getUserById
} from "@finboard/contracts";
import {
  buildKycDocument,
  enrichDocumentUrls,
  publishKycEvent
} from "../services/document-storage.service.js";

const ADMIN_REVIEWABLE_STATUS = "pending_admin_review";
const RESUBMITTABLE_STATUSES = new Set(["rejected", "failed", "reupload_requested"]);

function canUserSubmitNewKyc(application) {
  if (!application) {
    return true;
  }

  return RESUBMITTABLE_STATUSES.has(application.status);
}

async function finalizeAdminReview(id, update, res, actionLabel) {
  const application = await KycApplication.findOneAndUpdate(
    { _id: id, status: ADMIN_REVIEWABLE_STATUS },
    update,
    { new: true }
  );

  if (application) {
    return application;
  }

  const existing = await KycApplication.findById(id).select("status");
  if (!existing) {
    res.status(404).json({ message: "KYC application not found" });
    return null;
  }

  res.status(409).json({
    message: `This KYC application is already ${existing.status.replaceAll("_", " ")} and cannot be ${actionLabel} again.`
  });
  return null;
}

async function resolveOcrFilePath(file) {
  if (file.path) {
    return file.path;
  }

  const dir = await mkdtemp(join(os.tmpdir(), "kyc-ocr-"));
  const tempPath = join(dir, file.originalname.replace(/[^a-zA-Z0-9.-]/g, "_"));
  await writeFile(tempPath, file.buffer);
  return tempPath;
}

function normalizeName(value) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function documentSummary(document) {
  return {
    type: document.type,
    originalName: document.originalName,
    url: document.url,
    extractionSource: document.extractionSource,
    extracted: document.extracted,
    match: document.match,
    ocrText: document.ocrText || "",
    ocrPreview: document.ocrText ? document.ocrText.slice(0, 500) : ""
  };
}

function applySeededDemoFallback(processed, type, identity) {
  if (!identity || processed.ocrText || processed.extracted?.panNumber || processed.extracted?.aadhaarNumber) {
    return processed;
  }

  const extracted =
    type === "pan"
      ? { name: identity.name, panNumber: identity.panNumber }
      : { name: identity.name, aadhaarNumber: identity.aadhaarNumber };

  return {
    ...processed,
    ocrText: `Demo OCR fallback from seeded identity dataset.\nName: ${identity.name}\n${type === "pan" ? `PAN: ${identity.panNumber}` : `Aadhaar: ${identity.aadhaarNumber}`}`,
    extracted,
    extractionSource: "seeded_demo_fallback"
  };
}

export async function submitKyc(req, res, next) {
  try {
    const panFile = req.files?.pan?.[0];
    const aadhaarFile = req.files?.aadhaar?.[0];

    if (!panFile || !aadhaarFile) {
      return res.status(400).json({ message: "PAN and Aadhaar files are required" });
    }

    const activeApplication = await KycApplication.findOne({ userId: req.user._id }).sort({ createdAt: -1 });
    if (activeApplication && !canUserSubmitNewKyc(activeApplication)) {
      const message =
        activeApplication.status === "approved"
          ? "Your KYC is already approved. You cannot submit another application."
          : "Your KYC is under admin review. Please wait for approval before submitting again.";

      return res.status(409).json({ message, application: activeApplication });
    }

    const payload = {
      name: req.body.name,
      panNumber: req.body.panNumber?.toUpperCase(),
      aadhaarNumber: req.body.aadhaarNumber
    };

    const identity = await lookupIdentity({
      panNumber: payload.panNumber,
      aadhaarNumber: payload.aadhaarNumber
    });

    const [panOcrPath, aadhaarOcrPath] = await Promise.all([
      resolveOcrFilePath(panFile),
      resolveOcrFilePath(aadhaarFile)
    ]);

    let [panProcessed, aadhaarProcessed] = await Promise.all([
      processDocumentOcr(panOcrPath, "pan"),
      processDocumentOcr(aadhaarOcrPath, "aadhaar")
    ]);

    panProcessed = applySeededDemoFallback(panProcessed, "pan", identity);
    aadhaarProcessed = applySeededDemoFallback(aadhaarProcessed, "aadhaar", identity);

    const userId = req.user._id.toString();
    const panDoc = await buildKycDocument(panFile, "pan", panProcessed, userId);
    const aadhaarDoc = await buildKycDocument(aadhaarFile, "aadhaar", aadhaarProcessed, userId);

    panDoc.match = panDoc.extracted?.panNumber?.toUpperCase?.() === payload.panNumber;
    aadhaarDoc.match = String(aadhaarDoc.extracted?.aadhaarNumber || "") === payload.aadhaarNumber;

    const aiVerification = await verifyKycWithAi({
      userEntered: payload,
      identity,
      ocrExtracted: {
        pan: panDoc.extracted || {},
        aadhaar: aadhaarDoc.extracted || {}
      },
      panFilePath: panOcrPath,
      aadhaarFilePath: aadhaarOcrPath
    });

    const checks = {
      identityExists: Boolean(identity),
      nameMatchesDataset: Boolean(identity && normalizeName(identity.name) === normalizeName(payload.name)),
      panMatchesDataset: Boolean(identity && identity.panNumber === payload.panNumber),
      aadhaarMatchesDataset: Boolean(identity && identity.aadhaarNumber === payload.aadhaarNumber),
      panOcrMatches: panDoc.match,
      aadhaarOcrMatches: aadhaarDoc.match
    };

    const canReview = Boolean(identity);

    const application = await KycApplication.create({
      userId: req.user._id,
      ...payload,
      dummyIdentityId: identity?._id,
      status: canReview ? "pending_admin_review" : "failed",
      failureReason: canReview ? "" : "Name, PAN, or Aadhaar does not match the seeded identity database.",
      checks,
      aiVerification,
      documents: [panDoc, aadhaarDoc],
      submittedAt: new Date()
    });

    await updateProfileKycStatus(req.user._id, {
      pan: payload.panNumber,
      kycStatus: canReview ? "pending_review" : "rejected"
    });

    if (!isKafkaEnabled()) {
      await notifyUser(
        req.user._id,
        canReview ? "KYC Submitted" : "KYC Failed",
        canReview
          ? "Your KYC passed automatic checks and is pending admin review."
          : "Your name, PAN, or Aadhaar did not match our dummy identity records.",
        "kyc"
      );
      await audit(req, "KYC_SUBMITTED", "kyc", application._id.toString(), { status: application.status, checks, aiVerification });
    }
    await publishKycEvent(kafkaTopics.kycSubmitted, application, "KYC_SUBMITTED", { checks, aiVerification }, req.log);

    const responseApplication = {
      ...application.toObject(),
      documents: await enrichDocumentUrls(application.documents)
    };

    return res.status(201).json({ application: responseApplication });
  } catch (error) {
    next(error);
  }
}

export async function getMyKyc(req, res, next) {
  try {
    const application = await KycApplication.findOne({ userId: req.user._id }).sort({ createdAt: -1 }).lean();
    if (!application) {
      return res.json({ application: null, canSubmit: true });
    }

    application.documents = await enrichDocumentUrls(application.documents);
    res.json({
      application,
      canSubmit: canUserSubmitNewKyc(application)
    });
  } catch (error) {
    next(error);
  }
}

export async function listKycAdmin(req, res, next) {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const skip = (page - 1) * limit;

    // status filter (optional)
    const filter = req.query.status ? { status: req.query.status } : {};

    const [applications, total] = await Promise.all([
      KycApplication.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      KycApplication.countDocuments(filter)
    ]);

    const userIds = applications.map((app) => app.userId);
    const users = userIds.length ? await getUsersByIds(userIds) : [];
    const userMap = new Map(users.map((user) => [user.id || user._id?.toString(), user]));

    res.json({
      applications: await Promise.all(
        applications.map(async (app) => ({
          ...app,
          documents: await enrichDocumentUrls(app.documents?.map(documentSummary) || []),
          user: userMap.get(app.userId.toString())
        }))
      ),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: page * limit < total
      }
    });
  } catch (error) {
    next(error);
  }
}

export async function getKycAdmin(req, res, next) {
  try {
    const application = await KycApplication.findById(req.params.id).lean();
    if (!application) {
      return res.status(404).json({ message: "KYC application not found" });
    }
    const user = await getUserById(application.userId);
    const identity = application.dummyIdentityId
      ? await lookupIdentity({ panNumber: application.panNumber, aadhaarNumber: application.aadhaarNumber })
      : null;
    const adminReview = {
      entered: {
        name: application.name,
        panNumber: application.panNumber,
        aadhaarNumber: application.aadhaarNumber
      },
      seeded: identity
        ? {
            name: identity.name,
            panNumber: identity.panNumber,
            aadhaarNumber: identity.aadhaarNumber
          }
        : null,
      documents: await enrichDocumentUrls(application.documents?.map(documentSummary) || []),
      checks: application.checks,
      aiVerification: application.aiVerification
    };
    res.json({ application, user, identity, adminReview });
  } catch (error) {
    next(error);
  }
}

export async function approveKyc(req, res, next) {
  try {
    const application = await finalizeAdminReview(
      req.params.id,
      {
        status: "approved",
        adminRemarks: req.body.remarks || "",
        reviewedBy: req.user._id,
        reviewedAt: new Date()
      },
      res,
      "approved"
    );
    if (!application) return;
    await updateProfileKycStatus(application.userId, { kycStatus: "approved", pan: application.panNumber });
    if (!isKafkaEnabled()) {
      await notifyUser(application.userId, "KYC Approved", "Your KYC has been approved. You can now invest in stocks.", "kyc");
      await audit(req, "KYC_APPROVED", "kyc", application._id.toString(), { remarks: req.body.remarks });
    }
    await publishKycEvent(kafkaTopics.kycApproved, application, "KYC_APPROVED", { remarks: req.body.remarks }, req.log);
    res.json({ application });
  } catch (error) {
    next(error);
  }
}

export async function rejectKyc(req, res, next) {
  try {
    const { remarks } = req.body; // guaranteed non-empty by rejectKycSchema
    const application = await finalizeAdminReview(
      req.params.id,
      {
        status: "rejected",
        adminRemarks: remarks,
        reviewedBy: req.user._id,
        reviewedAt: new Date()
      },
      res,
      "rejected"
    );
    if (!application) return;
    await updateProfileKycStatus(application.userId, { kycStatus: "rejected" });
    if (!isKafkaEnabled()) {
      await notifyUser(application.userId, "KYC Rejected", remarks, "kyc");
      await audit(req, "KYC_REJECTED", "kyc", application._id.toString(), { remarks });
    }
    await publishKycEvent(kafkaTopics.kycRejected, application, "KYC_REJECTED", { remarks }, req.log);
    res.json({ application });
  } catch (error) {
    next(error);
  }
}
