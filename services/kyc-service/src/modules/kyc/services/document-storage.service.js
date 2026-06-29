import path from "path";
import fs from "fs/promises";
import { buildDomainEvent, kafkaTopics } from "@finboard/contracts";
import { publishEvent } from "@finboard/kafka";
import { ensureBucket, getPresignedDownloadUrl, isStorageEnabled, uploadObject } from "@finboard/storage";

export async function initKycStorage(log) {
  if (!isStorageEnabled()) {
    return;
  }

  await ensureBucket(log);
}

async function persistUploadedFile(file, userId, type) {
  const safeName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, "_");
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}-${safeName}`;

  if (isStorageEnabled()) {
    const storageKey = `kyc/${userId}/${type}/${filename}`;
    await uploadObject(storageKey, file.buffer, file.mimetype);
    const url = await getPresignedDownloadUrl(storageKey);
    return {
      path: storageKey,
      storageKey,
      url
    };
  }

  return {
    path: file.path,
    storageKey: path.basename(file.path),
    url: `/uploads/kyc/${path.basename(file.path)}`
  };
}

export async function buildKycDocument(file, type, processed, userId) {
  const stored = await persistUploadedFile(file, userId, type);
  return {
    type,
    originalName: file.originalname,
    mimeType: file.mimetype,
    sizeBytes: file.size,
    path: stored.path,
    storageKey: stored.storageKey,
    url: stored.url,
    ocrText: processed.ocrText,
    extracted: processed.extracted,
    extractionSource: processed.extractionSource
  };
}

export function resolveStorageKey(document) {
  if (document.storageKey) {
    return document.storageKey;
  }

  if (document.path?.startsWith("kyc/")) {
    return document.path;
  }

  const url = String(document.url || "");
  const fromBucket = url.match(/\/finboard-kyc\/(kyc\/[^?]+)/i);
  if (fromBucket?.[1]) {
    return fromBucket[1];
  }

  const fromPath = url.match(/\/(kyc\/[^?]+)/);
  return fromPath?.[1] || null;
}

export async function enrichDocumentUrls(documents) {
  if (!isStorageEnabled() || !documents?.length) {
    return documents;
  }

  return Promise.all(
    documents.map(async (document) => {
      const key = resolveStorageKey(document);
      if (!key) {
        return document;
      }

      const url = await getPresignedDownloadUrl(key);
      return url ? { ...document, url, storageKey: document.storageKey || key } : document;
    })
  );
}

export async function publishKycEvent(topic, application, action, details = {}, log) {
  return publishEvent(
    topic,
    buildDomainEvent({
      eventType: topic,
      action,
      userId: application.userId,
      resourceType: "kyc",
      resourceId: application._id,
      details: {
        status: application.status,
        ...details
      }
    }),
    log
  );
}

export async function readLocalFileForOcr(file) {
  if (file.buffer) {
    return file.buffer;
  }

  return fs.readFile(file.path);
}
