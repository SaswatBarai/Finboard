import { Router } from "express";
import { approveKyc, getKycAdmin, getMyKyc, listKycAdmin, rejectKyc, submitKyc } from "../controllers/kyc.controller.js";
import { requireAuth, requireRole } from "@finboard/contracts";
import { validate } from "@finboard/shared";
import { kycUpload } from "../middleware/upload.middleware.js";
import { reviewKycSchema, rejectKycSchema, submitKycSchema } from "../validators/kyc.schema.js";

export const kycRouter = Router();

kycRouter.use(requireAuth);

kycRouter.get("/me", getMyKyc);
kycRouter.post(
  "/submit",
  kycUpload.fields([
    { name: "pan", maxCount: 1 },
    { name: "aadhaar", maxCount: 1 }
  ]),
  validate(submitKycSchema),
  submitKyc
);

kycRouter.get("/admin/applications", requireRole("admin", "rta_admin"), listKycAdmin);
kycRouter.get("/admin/applications/:id", requireRole("admin", "rta_admin"), getKycAdmin);
kycRouter.post("/admin/applications/:id/approve", requireRole("admin", "rta_admin"), validate(reviewKycSchema), approveKyc);
kycRouter.post("/admin/applications/:id/reject", requireRole("admin", "rta_admin"), validate(rejectKycSchema), rejectKyc);
