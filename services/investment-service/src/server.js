import { loadEnv } from "@finboard/config";
import { bootstrapService } from "@finboard/service-kit";
import { buildApp } from "./app.js";
import { registerInvestmentHandlers } from "./bootstrap/register-handlers.js";

loadEnv();
registerInvestmentHandlers();

start();

async function start() {
  await bootstrapService({
    serviceName: "investment-service",
    port: 4006,
    createApp: async () => buildApp(),
    connectDatabases: async (log) => {
      const { getServiceEnv } = await import("@finboard/config");
      const { connectMongo } = await import("@finboard/shared");
      await connectMongo(getServiceEnv().mongoUri, "Investment MongoDB");
      log.info("MongoDB connected");
    }
  });
}
