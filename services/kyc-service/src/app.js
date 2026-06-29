import { getServiceEnv } from "@finboard/config";
import { createApp } from "@finboard/service-kit";
import { requireInternalService } from "@finboard/shared";
import path from "path";
import { fileURLToPath } from "url";
import { kycRouter } from "./modules/kyc/index.js";
import { createInternalIdentityRouter } from "./modules/kyc/routes/identity.internal.routes.js";

export function buildApp() {
  const env = getServiceEnv({ serviceName: "kyc-service", port: 4003 });

  const repoRoot = fileURLToPath(new URL("../../..", import.meta.url));
  const uploadDir = path.resolve(repoRoot, "infrastructure/storage/uploads");

  return createApp({
    serviceName: env.serviceName,
    clientOrigins: env.clientOrigins,
    staticDirs: [{ path: "/uploads", dir: uploadDir }],
    routes: [
      { path: "/api/kyc", router: kycRouter },
      { path: "/internal/identity", router: createInternalIdentityRouter({ requireInternalService: requireInternalService(env.internalServiceKey) }) }
    ]
  });
}
