import { loadEnv } from "@finboard/config";
import { bootstrapService } from "@finboard/service-kit";
import { disconnectProducer } from "@finboard/kafka";
import { buildApp } from "./app.js";
import { registerNotificationHandlers } from "./bootstrap/register-handlers.js";
import { startNotificationConsumer, stopNotificationConsumer } from "./kafka/notification-consumer.js";
registerNotificationHandlers();

loadEnv();

start();

async function start() {
  await bootstrapService({
    serviceName: "notification-service",
    port: 4007,
    createApp: async () => buildApp(),
    connectDatabases: async (log) => {
      const { getServiceEnv } = await import("@finboard/config");
      const { connectMongo } = await import("@finboard/shared");
      await connectMongo(getServiceEnv().mongoUri, "Notification MongoDB");
      log.info("MongoDB connected");
    },
    onReady: async (log) => {
      await startNotificationConsumer(log);
    },
    onShutdown: async () => {
      await stopNotificationConsumer();
      await disconnectProducer();
    }
  });
}
