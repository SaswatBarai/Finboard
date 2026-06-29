import { getServiceEnv } from "@finboard/config";
import { createApp } from "@finboard/service-kit";
import { requireInternalService } from "@finboard/shared";
import { bankingRouter, createInternalBankingRouter } from "./modules/banking/index.js";

export function buildApp() {
  const env = getServiceEnv({ serviceName: "banking-service", port: 4005 });

  return createApp({
    serviceName: env.serviceName,
    clientOrigins: env.clientOrigins,
    
    routes: [
      { path: "/api/banking", router: bankingRouter },
      { path: "/internal", router: createInternalBankingRouter({ requireInternalService: requireInternalService(env.internalServiceKey) }) }
    ]
  });
}
