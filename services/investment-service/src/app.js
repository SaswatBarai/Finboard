import { getServiceEnv } from "@finboard/config";
import { createApp } from "@finboard/service-kit";
import { requireInternalService } from "@finboard/shared";
import { investmentRouter } from "./modules/investment/index.js";
import { createInternalPortfolioRouter } from "./modules/investment/routes/portfolio.internal.routes.js";

export function buildApp() {
  const env = getServiceEnv({ serviceName: "investment-service", port: 4006 });

  return createApp({
    serviceName: env.serviceName,
    clientOrigins: env.clientOrigins,
    routes: [
      { path: "/api/investments", router: investmentRouter },
      { path: "/internal/portfolio", router: createInternalPortfolioRouter({ requireInternalService: requireInternalService(env.internalServiceKey) }) }
    ]
  });
}
