/**
 * Prisma Test Client Helper
 *
 * Provides an isolated PrismaClient connected to the test database (finboard_banking_test).
 */
import { createPrismaClient } from "../../modules/banking/prisma/create-client.js";

const TEST_DB_URL =
  process.env.BANK_DATABASE_URL_TEST ||
  process.env.BANK_DATABASE_URL ||
  "postgresql://finboard:finboard_pass@localhost:5432/finboard_banking_test";

export const testPrisma = createPrismaClient(TEST_DB_URL, { log: [] });

/**
 * Clean all tables between test runs.
 * Order matters because of foreign key constraints.
 */
export async function clearDatabase() {
  await testPrisma.$transaction([
    testPrisma.ledgerEntry.deleteMany(),
    testPrisma.bankNotification.deleteMany(),
    testPrisma.bankVerification.deleteMany(),
    testPrisma.bankTransaction.deleteMany(),
    testPrisma.beneficiary.deleteMany(),
    testPrisma.bankAccount.deleteMany()
  ]);
}

/**
 * Insert a standard demo bank account used across most tests.
 */
export async function seedTestAccount(overrides = {}) {
  return testPrisma.bankAccount.create({
    data: {
      holderName: overrides.holderName ?? "Rahul Sharma",
      email: overrides.email ?? `rahul.${Date.now()}@testbank.local`,
      phone: overrides.phone ?? "+919000000002",
      accountNumber: overrides.accountNumber ?? String(Date.now()).slice(-12),
      ifsc: overrides.ifsc ?? "DEMO0000001",
      bankName: overrides.bankName ?? "Finboard Demo Bank",
      balance: overrides.balance ?? 15000,
      role: overrides.role ?? "CUSTOMER",
      status: overrides.status ?? "ACTIVE",
      appUserId: overrides.appUserId ?? null,
      avatar: overrides.avatar ?? "RS"
    }
  });
}
