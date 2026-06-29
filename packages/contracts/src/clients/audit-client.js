import axios from "axios";
import { getServiceUrls } from "../services/service-urls.js";

let localHandler = null;

export function registerLocalAuditHandler(handler) {
  localHandler = handler;
}

function internalHeaders() {
  return {
    "x-service-key": process.env.INTERNAL_SERVICE_KEY || "dev-internal-key"
  };
}

export async function auditEvent({ req, action, resourceType, resourceId, details = {}, actorId, actorRole }) {
  const payload = {
    actorId: actorId?.toString?.() || req?.user?._id?.toString?.() || req?.auth?.sub,
    actorRole: actorRole || req?.user?.role || req?.auth?.role || "system",
    action,
    resourceType,
    resourceId: resourceId?.toString?.() || resourceId,
    details,
    ipAddress: req?.ip,
    userAgent: req?.headers?.["user-agent"]
  };

  if (localHandler) {
    return localHandler(payload);
  }

  const { audit } = getServiceUrls();
  await axios.post(`${audit}/internal/audit`, payload, {
    headers: internalHeaders(),
    timeout: 5000
  });
}

/** Backward-compatible helper for existing controllers */
export function audit(req, action, resourceType, resourceId, details = {}) {
  return auditEvent({ req, action, resourceType, resourceId, details });
}
