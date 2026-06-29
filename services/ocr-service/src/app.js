import { getServiceEnv } from "@finboard/config";
import { createApp } from "@finboard/service-kit";
import { requireInternalService } from "@finboard/shared";
import { createInternalOcrRouter } from "./modules/ocr/index.js";

export function buildApp() {
  const env = getServiceEnv({ serviceName: "ocr-service", port: 4004 });

  return createApp({
    serviceName: env.serviceName,
    clientOrigins: env.clientOrigins,
    
    routes: [
      { path: "/internal/ocr", router: createInternalOcrRouter({ requireInternalService: requireInternalService(env.internalServiceKey) }) }
    ]
  });
}
