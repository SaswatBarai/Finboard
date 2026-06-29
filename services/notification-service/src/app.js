import { getServiceEnv } from "@finboard/config";
import { createApp } from "@finboard/service-kit";
import { createAuthMiddleware, createJwtUtils, requireInternalService } from "@finboard/shared";
import { createNotificationRouter, createInternalNotificationRouter } from "./modules/notification/index.js";

export function buildApp() {
  const env = getServiceEnv({ serviceName: "notification-service", port: 4007 });
  const { verifyJwt } = createJwtUtils({ jwtSecret: env.jwtSecret, jwtExpiresIn: env.jwtExpiresIn });
  const { requireAuth } = createAuthMiddleware({ verifyJwt });

  return createApp({
    serviceName: env.serviceName,
    clientOrigins: env.clientOrigins,
    routes: [
      { path: "/api/notifications", router: createNotificationRouter({ requireAuth }) },
      {
        path: "/internal/notifications",
        router: createInternalNotificationRouter({
          requireInternalService: requireInternalService(env.internalServiceKey)
        })
      }
    ]
  });
}
