import mongoose from "mongoose";

const auditLogSchema = new mongoose.Schema(
  {
    actorId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    actorRole: { type: String, enum: ["user", "admin", "rta_admin", "amc_admin", "system"], default: "system" },
    action: { type: String, required: true },
    resourceType: { type: String, required: true },
    resourceId: String,
    details: { type: mongoose.Schema.Types.Mixed, default: {} },
    ipAddress: String,
    userAgent: String
  },
  { timestamps: true }
);

auditLogSchema.index({ resourceType: 1, resourceId: 1, createdAt: -1 });

export const AuditLog = mongoose.model("AuditLog", auditLogSchema);
