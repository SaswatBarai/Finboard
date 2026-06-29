import { PrismaClient } from "../../../../generated/prisma/index.js";
import { PrismaPg } from "@prisma/adapter-pg";

export function createPrismaClient(connectionString, options = {}) {
  if (!connectionString) {
    throw new Error("BANK_DATABASE_URL is required for Prisma Client");
  }

  const adapter = new PrismaPg({ connectionString });
  return new PrismaClient({ adapter, ...options });
}
