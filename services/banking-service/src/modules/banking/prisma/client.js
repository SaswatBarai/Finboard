import { getServiceEnv } from "@finboard/config";
import { createPrismaClient } from "./create-client.js";

const env = getServiceEnv();

export const prisma = createPrismaClient(env.bankDatabaseUrl, {
  log: process.env.NODE_ENV === "development" ? ["warn"] : ["error"]
});

export const bankingConfigured = env.bankingConfigured;

export function isPrismaConnectionError(error) {
  return (
    error?.code === "P1017" ||
    error?.message?.includes("Server has closed the connection") ||
    error?.message?.includes("forcibly closed by the remote host") ||
    error?.cause?.message?.includes("forcibly closed by the remote host")
  );
}

export async function resetPrismaConnection() {
  try {
    await prisma.$disconnect();
  } catch {
    // Prisma reconnects lazily on the next query.
  }
}

export async function connectBankingDb() {
  if (!bankingConfigured) {
    console.warn("Banking database not configured — banking routes will return 503");
    return;
  }

  await prisma.$connect();
  console.log("Banking PostgreSQL connected");
}

export async function disconnectBankingDb() {
  await prisma.$disconnect();
}
