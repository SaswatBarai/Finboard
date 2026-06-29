import { getServiceEnv } from "@finboard/config";
import { createApp } from "@finboard/service-kit";
import { requireAuth, requireRole } from "@finboard/contracts";
import { requireInternalService } from "@finboard/shared";
import { createAuditRouter, createInternalAuditRouter } from "./modules/audit/index.js";

export function buildApp() {
  const env = getServiceEnv({ serviceName: "audit-service", port: 4008 });

  return createApp({
    serviceName: env.serviceName,
    clientOrigins: env.clientOrigins,
    routes: [
      { path: "/api/audit", router: createAuditRouter({ requireAuth, requireRole }) },
      {
        path: "/internal/audit",
        router: createInternalAuditRouter({ requireInternalService: requireInternalService(env.internalServiceKey) })
      }
    ]
  });
}
