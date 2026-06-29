import { prisma } from "../../modules/banking/prisma/client.js";
import { getServiceEnv } from "@finboard/config";

export async function connectBankingDb(log) {
  if (!getServiceEnv().bankingConfigured) {
    log.warn("Banking database not configured");
    return;
  }
  await prisma.$connect();
  log.info("Banking PostgreSQL connected");
}

export async function disconnectBankingDb() {
  await prisma.$disconnect();
}
