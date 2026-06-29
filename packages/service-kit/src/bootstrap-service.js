import { loadEnv } from "@finboard/config";
import { createLogger } from "@finboard/logger";
import { connectMongo, disconnectMongo } from "@finboard/shared";

export async function bootstrapService({
  serviceName,
  port,
  createApp,
  connectDatabases,
  onShutdown,
  onReady
}) {
  loadEnv();
  const log = createLogger(serviceName);
  const env = { port: Number(process.env.PORT || port), serviceName };

  const app = await createApp();

  if (connectDatabases) await connectDatabases(log);

  const server = app.listen(env.port, () => {
    log.info(`running on http://localhost:${env.port}`);
    onReady?.(log);
  });

  async function shutdown(signal) {
    log.info(`${signal} received, shutting down`);
    server.close(async () => {
      if (onShutdown) await onShutdown();
      else await disconnectMongo().catch(() => {});
      process.exit(0);
    });
  }

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
}
