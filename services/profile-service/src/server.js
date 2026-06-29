import { loadEnv } from "@finboard/config";
import { bootstrapService } from "@finboard/service-kit";
import { buildApp } from "./app.js";
import { registerProfileHandlers } from "./bootstrap/register-handlers.js";
registerProfileHandlers();

loadEnv();

start();

async function start() {
  await bootstrapService({
    serviceName: "profile-service",
    port: 4002,
    createApp: async () => buildApp(),
    connectDatabases: async (log) => {
      const { getServiceEnv } = await import("@finboard/config");
      const { connectMongo } = await import("@finboard/shared");
      await connectMongo(getServiceEnv().mongoUri, "Profile MongoDB");
      log.info("MongoDB connected");
    }
  });
}
