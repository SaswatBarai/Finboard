import { loadEnv } from "@finboard/config";
import { registerLocalAuthHandler } from "@finboard/contracts";
import { bootstrapService } from "@finboard/service-kit";
import { buildApp } from "./app.js";
import { registerKycHandlers } from "./bootstrap/register-handlers.js";
import { registerKycAuthHandlers } from "./bootstrap/register-auth-handlers.js";

import { initKycStorage } from "./modules/kyc/services/document-storage.service.js";

loadEnv();
registerKycHandlers();
registerKycAuthHandlers();

start();

async function start() {
  await bootstrapService({
    serviceName: "kyc-service",
    port: 4003,
    createApp: async () => buildApp(),
    connectDatabases: async (log) => {
      const { getServiceEnv } = await import("@finboard/config");
      const { connectMongo } = await import("@finboard/shared");
      await connectMongo(getServiceEnv().mongoUri, "Kyc MongoDB");
      await initKycStorage(log);
      log.info("MongoDB connected");
    }
  });
}
