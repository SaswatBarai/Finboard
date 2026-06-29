import { getServiceEnv } from "@finboard/config";
import { createApp } from "@finboard/service-kit";
import { requireInternalService } from "@finboard/shared";
import { profileRouter, createInternalProfileRouter } from "./modules/profile/index.js";

export function buildApp() {
  const env = getServiceEnv({ serviceName: "profile-service", port: 4002 });

  return createApp({
    serviceName: env.serviceName,
    clientOrigins: env.clientOrigins,
    
    routes: [
      { path: "/api/profile", router: profileRouter },
      { path: "/internal/profile", router: createInternalProfileRouter({ requireInternalService: requireInternalService(env.internalServiceKey) }) }
    ]
  });
}
