import { AuditLog } from "../models/audit-log.model.js";

export function writeAuditLog(payload) {
  return AuditLog.create(payload);
}

export function auditFromRequest(req, action, resourceType, resourceId, details = {}) {
  return writeAuditLog({
    actorId: req.user?._id,
    actorRole: req.user?.role || "system",
    action,
    resourceType,
    resourceId,
    details,
    ipAddress: req.ip,
    userAgent: req.headers["user-agent"]
  });
}

export function getAuditLogsByResource(resourceType, resourceId) {
  return AuditLog.find({ resourceType, resourceId: String(resourceId) })
    .sort({ createdAt: -1 })
    .limit(100);
}
