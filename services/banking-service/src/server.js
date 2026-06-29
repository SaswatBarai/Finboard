import { loadEnv } from "@finboard/config";
import { bootstrapService } from "@finboard/service-kit";
import { buildApp } from "./app.js";
import { registerBankingHandlers } from "./bootstrap/register-handlers.js";
registerBankingHandlers();

loadEnv();

start();

async function start() {
  const { getServiceEnv } = await import("@finboard/config");
  const { startVerificationRefundJob, stopVerificationRefundJob } = await import("./modules/banking/index.js");

  await bootstrapService({
    serviceName: "banking-service",
    port: 4005,
    createApp: async () => buildApp(),
    connectDatabases: async (log) => {
      const { connectBankingDb } = await import("./infrastructure/database/prisma.js");
      await connectBankingDb(log);
    },
    onReady: () => {
      if (getServiceEnv().bankingConfigured) startVerificationRefundJob();
    },
    onShutdown: async () => {
      const { stopVerificationRefundJob } = await import("./modules/banking/index.js");
      stopVerificationRefundJob();
      const { disconnectBankingDb } = await import("./infrastructure/database/prisma.js");
      await disconnectBankingDb();
    }
  });
}
