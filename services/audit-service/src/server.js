import { loadEnv } from "@finboard/config";
import { bootstrapService } from "@finboard/service-kit";
import { disconnectProducer } from "@finboard/kafka";
import { buildApp } from "./app.js";
import { registerAuditHandlers } from "./bootstrap/register-handlers.js";
import { startAuditConsumer, stopAuditConsumer } from "./kafka/audit-consumer.js";
registerAuditHandlers();

loadEnv();

start();

async function start() {
  await bootstrapService({
    serviceName: "audit-service",
    port: 4008,
    createApp: async () => buildApp(),
    connectDatabases: async (log) => {
      const { getServiceEnv } = await import("@finboard/config");
      const { connectMongo } = await import("@finboard/shared");
      await connectMongo(getServiceEnv().mongoUri, "Audit MongoDB");
      log.info("MongoDB connected");
    },
    onReady: async (log) => {
      await startAuditConsumer(log);
    },
    onShutdown: async () => {
      await stopAuditConsumer();
      await disconnectProducer();
    }
  });
}
