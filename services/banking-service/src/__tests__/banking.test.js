/**
 * Banking Service — Phase 4 Jest + Prisma Integration Tests
 *
 * Covers:
 *  4.1  Prisma schema models (BankAccount, BankTransaction, LedgerEntry, Beneficiary, BankVerification, BankNotification)
 *  4.2  PostgreSQL via BANK_DATABASE_URL (test database)
 *  4.3  Prisma migrations + seed with demo accounts
 *  4.4  POST /api/banking/verify-bank — Rs. 2 debit simulation
 *  4.5  Background refund job (processDueVerificationRefunds)
 *  4.6  GET account, balance, transactions
 *  4.7  POST transfer, beneficiary management
 *  4.8  Banking notifications (BankNotification)
 *  4.9  Admin: freeze account, reset balance, list users/transactions
 *  4.10 requireBankingConfigured middleware (graceful when PG unavailable)
 *  4.11 Internal route: debitForInvestment, getLinkedAccount
 */

import { afterAll, beforeAll, beforeEach, describe, expect, it } from "@jest/globals";
import request from "supertest";

// ── Env vars must be set before any workspace module loads ────────────────────
process.env.BANK_DATABASE_URL = "postgresql://finboard:finboard_pass@localhost:5432/finboard_banking_test";
process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "test-jwt-secret-32chars-minimum-ok";
process.env.JWT_EXPIRES_IN = "1h";
process.env.INTERNAL_SERVICE_KEY = "dev-internal-key";
process.env.CLIENT_ORIGIN = "http://localhost:3000";
process.env.BANK_VERIFICATION_REFUND_DELAY_MS = "0"; // Immediate refund for tests

// ── Imports ───────────────────────────────────────────────────────────────────
import { registerLocalAuthHandler } from "@finboard/contracts";
import { buildApp } from "../app.js";
import { clearDatabase, seedTestAccount, testPrisma } from "./helpers/prisma-test-client.js";
import {
  processDueVerificationRefunds,
  debitForInvestment,
  getLinkedAccount,
  verifyBankAccount
} from "../modules/banking/services/banking.service.js";
import { generateTransactionRef, toDecimal, VERIFICATION_AMOUNT } from "../modules/banking/utils/money.util.js";
import { bankingConfigured } from "../modules/banking/prisma/client.js";
import { createJwtUtils } from "@finboard/shared";

// ── Register local auth handler so requireAuth doesn't call auth-service HTTP ─
registerLocalAuthHandler({
  getUserById: async (userId) => {
    const usersById = {
      "admin-user-id-001": {
        name: "Admin User",
        email: "admin@finboard.local",
        phone: "+910000000001",
        role: "admin"
      },
      "rta-user-id-001": {
        name: "RTA Admin",
        email: "rta.admin@finboard.local",
        phone: "+910000000003",
        role: "rta_admin"
      },
      "amc-user-id-001": {
        name: "AMC Admin",
        email: "amc.admin@finboard.local",
        phone: "+910000000004",
        role: "amc_admin"
      },
      "rahul-user-id-001": {
        name: "Rahul Sharma",
        email: "user@finboard.local",
        phone: "+919876543210",
        role: "user"
      }
    };

    const known = usersById[userId];

    return {
      _id: userId,
      id: userId,
      name: known?.name || "Test User",
      email: known?.email || `${userId}@test.local`,
      phone: known?.phone || "+919000000099",
      role: known?.role || (userId.startsWith("admin") ? "admin" : "user"),
      phoneVerified: true,
      emailVerified: true
    };
  }
});

// ── JWT helper (uses @finboard/shared utilities) ──────────────────────────────
const { signJwt } = createJwtUtils({
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: "1h"
});

function makeToken(overrides = {}) {
  return signJwt({
    _id: overrides._id ?? "test-user-id-001",
    id: overrides._id ?? "test-user-id-001",
    email: overrides.email ?? "test@finboard.local",
    role: overrides.role ?? "user"
  });
}

function bearerToken(overrides = {}) {
  return `Bearer ${makeToken(overrides)}`;
}

function adminToken() {
  return bearerToken({ role: "admin", _id: "admin-user-id-001", email: "admin@finboard.local" });
}

function rtaToken() {
  return bearerToken({ role: "rta_admin", _id: "rta-user-id-001", email: "rta.admin@finboard.local" });
}

function amcToken() {
  return bearerToken({ role: "amc_admin", _id: "amc-user-id-001", email: "amc.admin@finboard.local" });
}

// ── App instance ──────────────────────────────────────────────────────────────
let app;

beforeAll(async () => {
  app = buildApp();
  await testPrisma.$connect();
});

afterAll(async () => {
  await testPrisma.$disconnect();
});

beforeEach(async () => {
  await clearDatabase();
});

// =============================================================================
// 4.1 / 4.2  Prisma Schema + PostgreSQL Connectivity
// =============================================================================

describe("4.1 / 4.2 — Prisma schema: BankAccount, BankTransaction, LedgerEntry, Beneficiary, BankVerification, BankNotification", () => {
  it("can create a BankAccount record", async () => {
    const account = await seedTestAccount();
    expect(account.id).toBeDefined();
    expect(account.holderName).toBe("Rahul Sharma");
    expect(account.status).toBe("ACTIVE");
  });

  it("can create a BankTransaction and LedgerEntry linked to an account", async () => {
    const account = await seedTestAccount();

    const tx = await testPrisma.bankTransaction.create({
      data: {
        transactionRef: generateTransactionRef("TST"),
        senderId: account.id,
        senderAccountNumber: account.accountNumber,
        amount: toDecimal(100),
        type: "DEBIT",
        status: "SUCCESS",
        description: "Test debit",
        appUserId: "user-001"
      }
    });

    const ledger = await testPrisma.ledgerEntry.create({
      data: {
        accountId: account.id,
        transactionId: tx.id,
        entryType: "DEBIT",
        amount: toDecimal(100),
        balanceAfter: toDecimal(14900)
      }
    });

    expect(tx.transactionRef).toMatch(/^TST/);
    expect(ledger.balanceAfter.toString()).toBe("14900");
  });

  it("can create a Beneficiary", async () => {
    const owner = await seedTestAccount({ email: "owner@test.local", accountNumber: "100000000010" });
    const target = await seedTestAccount({ email: "target@test.local", accountNumber: "100000000011" });

    const beneficiary = await testPrisma.beneficiary.create({
      data: {
        appUserId: "user-bene-001",
        beneficiaryAccount: target.accountNumber,
        beneficiaryName: target.holderName,
        ifsc: target.ifsc,
        bankAccountId: owner.id
      }
    });

    expect(beneficiary.id).toBeDefined();
    expect(beneficiary.beneficiaryAccount).toBe("100000000011");
  });

  it("can create a BankVerification record", async () => {
    const account = await seedTestAccount({ email: "verify@test.local", accountNumber: "100000000012" });

    const v = await testPrisma.bankVerification.create({
      data: {
        appUserId: "user-v-001",
        accountId: account.id,
        accountNumber: account.accountNumber,
        ifsc: account.ifsc,
        accountHolderName: account.holderName,
        status: "REFUND_PENDING",
        refundDueAt: new Date(Date.now() - 1000)
      }
    });

    expect(v.status).toBe("REFUND_PENDING");
  });

  it("can create a BankNotification", async () => {
    const account = await seedTestAccount({ email: "notif@test.local", accountNumber: "100000000013" });

    const notif = await testPrisma.bankNotification.create({
      data: {
        appUserId: "user-n-001",
        accountId: account.id,
        title: "Test Notification",
        message: "Testing notification creation"
      }
    });

    expect(notif.id).toBeDefined();
    expect(notif.read).toBe(false);
  });

  it("bankingConfigured is truthy (DB is reachable)", () => {
    expect(bankingConfigured).toBeTruthy();
  });
});

// =============================================================================
// 4.3  Seed data utility validation
// =============================================================================

describe("4.3 — Prisma seed utilities", () => {
  it("seedTestAccount creates account with correct defaults", async () => {
    const account = await seedTestAccount();
    expect(account.bankName).toBe("Finboard Demo Bank");
    expect(account.role).toBe("CUSTOMER");
    expect(account.balance.toString()).toBe("15000");
  });

  it("seedTestAccount respects overrides", async () => {
    const account = await seedTestAccount({ balance: 50000, holderName: "Vikram Rao", status: "FROZEN" });
    expect(account.balance.toString()).toBe("50000");
    expect(account.holderName).toBe("Vikram Rao");
    expect(account.status).toBe("FROZEN");
  });
});

// =============================================================================
// 4.4  POST /api/banking/verify-bank
// =============================================================================

describe("4.4 — POST /api/banking/verify-bank (Rs. 2 debit simulation)", () => {
  it("successfully verifies a valid bank account and debits Rs. 2", async () => {
    const account = await seedTestAccount({
      holderName: "Rahul Sharma",
      email: "rahul.verify@test.local",
      accountNumber: "200000000001",
      balance: 10000
    });

    const res = await request(app)
      .post("/api/banking/verify-bank")
      .set("Authorization", bearerToken({ _id: "user-verify-001" }))
      .send({
        accountNumber: "200000000001",
        ifsc: "DEMO0000001",
        accountHolderName: "Rahul Sharma"
      });

    expect(res.status).toBe(201);
    expect(res.body.message).toBe("Bank Account Verified");
    expect(res.body.verification.status).toBe("REFUND_PENDING");

    // Balance must be decremented by Rs. 2
    const updated = await testPrisma.bankAccount.findUnique({ where: { id: account.id } });
    expect(Number(updated.balance)).toBe(9998);

    // A DEBIT transaction must exist
    const txn = await testPrisma.bankTransaction.findFirst({
      where: { appUserId: "user-verify-001", type: "DEBIT" }
    });
    expect(txn).not.toBeNull();
    expect(txn.transactionRef).toMatch(/^VRD/);
    expect(Number(txn.amount)).toBe(2);

    // A ledger entry must exist
    const ledger = await testPrisma.ledgerEntry.findFirst({
      where: { accountId: account.id, entryType: "DEBIT" }
    });
    expect(ledger).not.toBeNull();
    expect(Number(ledger.amount)).toBe(2);

    // account must be linked to appUserId
    expect(updated.appUserId).toBe("user-verify-001");
  });

  it("returns 404 for invalid account holder name", async () => {
    await seedTestAccount({
      holderName: "Rahul Sharma",
      email: "wrong.name@test.local",
      accountNumber: "200000000002",
      balance: 10000
    });

    const res = await request(app)
      .post("/api/banking/verify-bank")
      .set("Authorization", bearerToken({ _id: "user-verify-002" }))
      .send({
        accountNumber: "200000000002",
        ifsc: "DEMO0000001",
        accountHolderName: "Wrong Name"
      });

    expect(res.status).toBe(404);
  });

  it("returns 403 for frozen account", async () => {
    await seedTestAccount({
      holderName: "Frozen User",
      email: "frozen@test.local",
      accountNumber: "200000000003",
      balance: 10000,
      status: "FROZEN"
    });

    const res = await request(app)
      .post("/api/banking/verify-bank")
      .set("Authorization", bearerToken({ _id: "user-verify-003" }))
      .send({
        accountNumber: "200000000003",
        ifsc: "DEMO0000001",
        accountHolderName: "Frozen User"
      });

    expect(res.status).toBe(403);
  });

  it("returns 400 for insufficient balance (less than Rs. 2)", async () => {
    await seedTestAccount({
      holderName: "Poor User",
      email: "poor@test.local",
      accountNumber: "200000000004",
      balance: 1
    });

    const res = await request(app)
      .post("/api/banking/verify-bank")
      .set("Authorization", bearerToken({ _id: "user-verify-004" }))
      .send({
        accountNumber: "200000000004",
        ifsc: "DEMO0000001",
        accountHolderName: "Poor User"
      });

    expect(res.status).toBe(400);
  });

  it("validates request body with Zod schema — returns 400 for invalid format", async () => {
    const res = await request(app)
      .post("/api/banking/verify-bank")
      .set("Authorization", bearerToken())
      .send({ accountNumber: "123", ifsc: "BAD", accountHolderName: "X" });

    expect(res.status).toBe(400);
  });

  it("returns 401 without auth token", async () => {
    const res = await request(app)
      .post("/api/banking/verify-bank")
      .send({ accountNumber: "200000000001", ifsc: "DEMO0000001", accountHolderName: "Test" });

    expect(res.status).toBe(401);
  });
});

// =============================================================================
// 4.5  Background Refund Job (processDueVerificationRefunds)
// =============================================================================

describe("4.5 — Background refund job (processDueVerificationRefunds)", () => {
  it("processes a due REFUND_PENDING verification and credits Rs. 2 back", async () => {
    const account = await seedTestAccount({
      email: "refund.test@test.local",
      accountNumber: "300000000001",
      balance: 9998
    });

    const debitTx = await testPrisma.bankTransaction.create({
      data: {
        transactionRef: generateTransactionRef("VRD"),
        senderId: account.id,
        senderAccountNumber: account.accountNumber,
        amount: toDecimal(2),
        type: "DEBIT",
        status: "SUCCESS",
        description: "Bank Verification Debit",
        appUserId: "user-refund-001"
      }
    });

    await testPrisma.bankVerification.create({
      data: {
        appUserId: "user-refund-001",
        accountId: account.id,
        accountNumber: account.accountNumber,
        ifsc: account.ifsc,
        accountHolderName: account.holderName,
        status: "REFUND_PENDING",
        debitTransactionId: debitTx.id,
        refundDueAt: new Date(Date.now() - 1000) // past due
      }
    });

    const processed = await processDueVerificationRefunds();
    expect(processed).toBe(1);

    const refreshed = await testPrisma.bankAccount.findUnique({ where: { id: account.id } });
    expect(Number(refreshed.balance)).toBe(10000);

    const verification = await testPrisma.bankVerification.findFirst({
      where: { appUserId: "user-refund-001" }
    });
    expect(verification.status).toBe("REFUNDED");
    expect(verification.refundedAt).not.toBeNull();

    const creditTx = await testPrisma.bankTransaction.findFirst({
      where: { appUserId: "user-refund-001", type: "CREDIT" }
    });
    expect(creditTx).not.toBeNull();
    expect(creditTx.transactionRef).toMatch(/^VRF/);
  });

  it("skips verifications not yet due", async () => {
    const account = await seedTestAccount({ email: "notdue@test.local", accountNumber: "300000000002" });
    await testPrisma.bankVerification.create({
      data: {
        appUserId: "user-refund-002",
        accountId: account.id,
        accountNumber: account.accountNumber,
        ifsc: account.ifsc,
        accountHolderName: account.holderName,
        status: "REFUND_PENDING",
        refundDueAt: new Date(Date.now() + 60000) // future
      }
    });

    const processed = await processDueVerificationRefunds();
    expect(processed).toBe(0);
  });

  it("returns 0 when there are no pending verifications", async () => {
    const processed = await processDueVerificationRefunds();
    expect(processed).toBe(0);
  });
});

// =============================================================================
// 4.6  GET account, balance, transactions
// =============================================================================

describe("4.6 — GET account / balance / transactions", () => {
  it("GET /api/banking/account returns account summary for linked user", async () => {
    await seedTestAccount({
      email: "linked@test.local",
      accountNumber: "400000000001",
      appUserId: "user-linked-001"
    });

    const res = await request(app)
      .get("/api/banking/account")
      .set("Authorization", bearerToken({ _id: "user-linked-001" }));

    expect(res.status).toBe(200);
    expect(res.body.account).not.toBeNull();
    expect(res.body.account.accountNumber).toBe("400000000001");
    expect(res.body.recentTransactions).toBeDefined();
    expect(res.body.beneficiaries).toBeDefined();
  });

  it("GET /api/banking/account returns null when user has no linked account", async () => {
    const res = await request(app)
      .get("/api/banking/account")
      .set("Authorization", bearerToken({ _id: "user-unlinked-999" }));

    expect(res.status).toBe(200);
    expect(res.body.account).toBeNull();
    expect(res.body.recentTransactions).toHaveLength(0);
  });

  it("GET /api/banking/balance returns account summary", async () => {
    await seedTestAccount({
      email: "balance@test.local",
      accountNumber: "400000000002",
      appUserId: "user-balance-001",
      balance: 25000
    });

    const res = await request(app)
      .get("/api/banking/balance")
      .set("Authorization", bearerToken({ _id: "user-balance-001" }));

    expect(res.status).toBe(200);
    expect(Number(res.body.account.balance)).toBe(25000);
  });

  it("GET /api/banking/transactions returns transactions for linked account", async () => {
    const account = await seedTestAccount({
      email: "txn.user@test.local",
      accountNumber: "400000000003",
      appUserId: "user-txn-001"
    });

    await testPrisma.bankTransaction.create({
      data: {
        transactionRef: generateTransactionRef("TST"),
        senderId: account.id,
        senderAccountNumber: account.accountNumber,
        amount: toDecimal(500),
        type: "DEBIT",
        status: "SUCCESS",
        description: "Test transaction",
        appUserId: "user-txn-001"
      }
    });

    const res = await request(app)
      .get("/api/banking/transactions")
      .set("Authorization", bearerToken({ _id: "user-txn-001" }));

    expect(res.status).toBe(200);
    expect(res.body.transactions).toHaveLength(1);
    expect(res.body.transactions[0].type).toBe("DEBIT");
  });

  it("GET /api/banking/transactions excludes receiver credit leg when user sent money", async () => {
    const sender = await seedTestAccount({
      email: "txn.sender@test.local",
      accountNumber: "400000000030",
      appUserId: "user-txn-sender-001"
    });
    const receiver = await seedTestAccount({
      email: "txn.receiver@test.local",
      accountNumber: "400000000031",
      appUserId: "user-txn-receiver-001"
    });

    const debit = await testPrisma.bankTransaction.create({
      data: {
        transactionRef: generateTransactionRef("DBT"),
        senderId: sender.id,
        receiverId: receiver.id,
        senderAccountNumber: sender.accountNumber,
        receiverAccountNumber: receiver.accountNumber,
        amount: toDecimal(500),
        type: "DEBIT",
        status: "SUCCESS",
        description: "Payment sent",
        appUserId: "user-txn-sender-001"
      }
    });

    await testPrisma.bankTransaction.create({
      data: {
        transactionRef: generateTransactionRef("CDT"),
        senderId: sender.id,
        receiverId: receiver.id,
        senderAccountNumber: sender.accountNumber,
        receiverAccountNumber: receiver.accountNumber,
        amount: toDecimal(500),
        type: "CREDIT",
        status: "SUCCESS",
        description: "Money Received",
        appUserId: "user-txn-receiver-001"
      }
    });

    const senderRes = await request(app)
      .get("/api/banking/transactions")
      .set("Authorization", bearerToken({ _id: "user-txn-sender-001" }));

    expect(senderRes.status).toBe(200);
    expect(senderRes.body.transactions).toHaveLength(1);
    expect(senderRes.body.transactions[0].id).toBe(debit.id);
    expect(senderRes.body.transactions[0].type).toBe("DEBIT");

    const receiverRes = await request(app)
      .get("/api/banking/transactions")
      .set("Authorization", bearerToken({ _id: "user-txn-receiver-001" }));

    expect(receiverRes.status).toBe(200);
    expect(receiverRes.body.transactions).toHaveLength(1);
    expect(receiverRes.body.transactions[0].type).toBe("CREDIT");
  });

  it("GET /api/banking/transactions returns empty array for unlinked user", async () => {
    const res = await request(app)
      .get("/api/banking/transactions")
      .set("Authorization", bearerToken({ _id: "user-no-account-txn" }));

    expect(res.status).toBe(200);
    expect(res.body.transactions).toHaveLength(0);
  });

  it("GET /api/banking/demo-accounts returns only the authenticated user's demo account", async () => {
    await seedTestAccount({
      email: "test-user-id-001@test.local",
      holderName: "Test User",
      accountNumber: "400000000010",
      role: "CUSTOMER"
    });
    await seedTestAccount({
      email: "other@test.local",
      holderName: "Other Person",
      accountNumber: "400000000011",
      role: "CUSTOMER"
    });

    const res = await request(app)
      .get("/api/banking/demo-accounts")
      .set("Authorization", bearerToken());

    expect(res.status).toBe(200);
    expect(res.body.accounts).toHaveLength(1);
    expect(res.body.accounts[0].accountNumber).toBe("400000000010");
  });

  it("GET /api/banking/demo-accounts matches demo account by holder name when email differs", async () => {
    await seedTestAccount({
      email: "rahul.sharma@testbank.local",
      holderName: "Rahul Sharma",
      phone: "+919000000002",
      accountNumber: "400000000020",
      role: "CUSTOMER"
    });
    await seedTestAccount({
      email: "priya.singh@testbank.local",
      holderName: "Priya Singh",
      accountNumber: "400000000021",
      role: "CUSTOMER"
    });

    const res = await request(app)
      .get("/api/banking/demo-accounts")
      .set("Authorization", bearerToken({ _id: "rahul-user-id-001" }));

    expect(res.status).toBe(200);
    expect(res.body.accounts).toHaveLength(1);
    expect(res.body.accounts[0].holderName).toBe("Rahul Sharma");
  });

  it("GET /api/banking/demo-accounts returns 403 for admin role", async () => {
    const res = await request(app).get("/api/banking/demo-accounts").set("Authorization", adminToken());

    expect(res.status).toBe(403);
  });

  it("GET /api/banking/demo-accounts returns 403 for rta_admin role", async () => {
    const res = await request(app).get("/api/banking/demo-accounts").set("Authorization", rtaToken());

    expect(res.status).toBe(403);
  });

  it("GET /api/banking/lookup/:accountNumber returns account info", async () => {
    await seedTestAccount({ email: "lookup@test.local", accountNumber: "400000000020" });

    const res = await request(app)
      .get("/api/banking/lookup/400000000020")
      .set("Authorization", bearerToken());

    expect(res.status).toBe(200);
    expect(res.body.account.accountNumber).toBe("400000000020");
  });

  it("GET /api/banking/lookup/:accountNumber returns 404 for unknown account", async () => {
    const res = await request(app)
      .get("/api/banking/lookup/999999999999")
      .set("Authorization", bearerToken());

    expect(res.status).toBe(404);
  });
});

// =============================================================================
// 4.7  POST transfer, beneficiary management
// =============================================================================

describe("4.7 — POST /api/banking/transfer and beneficiary management", () => {
  it("transfers funds between two accounts and creates ledger entries", async () => {
    const sender = await seedTestAccount({
      email: "sender@test.local",
      accountNumber: "500000000001",
      appUserId: "user-sender-001",
      balance: 10000
    });
    await seedTestAccount({
      email: "receiver@test.local",
      accountNumber: "500000000002",
      balance: 5000
    });

    const res = await request(app)
      .post("/api/banking/transfer")
      .set("Authorization", bearerToken({ _id: "user-sender-001" }))
      .send({
        accountNumber: "500000000002",
        ifsc: "DEMO0000001",
        amount: 1000,
        remarks: "Test transfer"
      });

    expect(res.status).toBe(201);

    const updatedSender = await testPrisma.bankAccount.findUnique({ where: { id: sender.id } });
    expect(Number(updatedSender.balance)).toBe(9000);

    const receiver = await testPrisma.bankAccount.findFirst({ where: { accountNumber: "500000000002" } });
    expect(Number(receiver.balance)).toBe(6000);

    const txns = await testPrisma.bankTransaction.findMany({
      where: { OR: [{ senderId: sender.id }, { receiverId: receiver.id }] }
    });
    expect(txns.length).toBe(2);

    const ledgers = await testPrisma.ledgerEntry.findMany({
      where: { OR: [{ accountId: sender.id }, { accountId: receiver.id }] }
    });
    expect(ledgers.length).toBe(2);
  });

  it("returns 400 for transfer with insufficient balance", async () => {
    await seedTestAccount({
      email: "poor.sender@test.local",
      accountNumber: "500000000003",
      appUserId: "user-poor-001",
      balance: 50
    });
    await seedTestAccount({ email: "rich.receiver@test.local", accountNumber: "500000000004", balance: 5000 });

    const res = await request(app)
      .post("/api/banking/transfer")
      .set("Authorization", bearerToken({ _id: "user-poor-001" }))
      .send({ accountNumber: "500000000004", ifsc: "DEMO0000001", amount: 1000 });

    expect(res.status).toBe(400);
  });

  it("returns 400 when sender has no linked account", async () => {
    await seedTestAccount({ email: "no.sender@test.local", accountNumber: "500000000005" });

    const res = await request(app)
      .post("/api/banking/transfer")
      .set("Authorization", bearerToken({ _id: "user-no-account-999" }))
      .send({ accountNumber: "500000000005", ifsc: "DEMO0000001", amount: 100 });

    expect(res.status).toBe(400);
  });

  it("returns 400 for self-transfer", async () => {
    await seedTestAccount({
      email: "self.transfer@test.local",
      accountNumber: "500000000006",
      appUserId: "user-self-001",
      balance: 10000
    });

    const res = await request(app)
      .post("/api/banking/transfer")
      .set("Authorization", bearerToken({ _id: "user-self-001" }))
      .send({ accountNumber: "500000000006", ifsc: "DEMO0000001", amount: 100 });

    expect(res.status).toBe(400);
  });

  it("POST /api/banking/beneficiary adds a beneficiary", async () => {
    await seedTestAccount({
      email: "bene.owner@test.local",
      accountNumber: "500000000007",
      appUserId: "user-bene-owner-001"
    });
    await seedTestAccount({ email: "bene.target@test.local", accountNumber: "500000000008" });

    const res = await request(app)
      .post("/api/banking/beneficiary")
      .set("Authorization", bearerToken({ _id: "user-bene-owner-001" }))
      .send({ accountNumber: "500000000008", ifsc: "DEMO0000001" });

    expect(res.status).toBe(201);
    expect(res.body.beneficiary.beneficiaryAccount).toBe("500000000008");
  });

  it("POST /api/banking/beneficiary returns 404 for non-existent account", async () => {
    await seedTestAccount({
      email: "bene.owner2@test.local",
      accountNumber: "500000000009",
      appUserId: "user-bene-owner-002"
    });

    const res = await request(app)
      .post("/api/banking/beneficiary")
      .set("Authorization", bearerToken({ _id: "user-bene-owner-002" }))
      .send({ accountNumber: "999999999999", ifsc: "DEMO0000001" });

    expect(res.status).toBe(404);
  });
});

// =============================================================================
// 4.8  Banking Notifications (BankNotification)
// =============================================================================

describe("4.8 — Banking Notifications (BankNotification)", () => {
  it("GET /api/banking/notifications returns notifications for the user", async () => {
    const account = await seedTestAccount({
      email: "notif.user@test.local",
      accountNumber: "600000000001",
      appUserId: "user-notif-001"
    });

    await testPrisma.bankNotification.createMany({
      data: [
        { appUserId: "user-notif-001", accountId: account.id, title: "Test 1", message: "Message 1" },
        { appUserId: "user-notif-001", accountId: account.id, title: "Test 2", message: "Message 2" }
      ]
    });

    const res = await request(app)
      .get("/api/banking/notifications")
      .set("Authorization", bearerToken({ _id: "user-notif-001" }));

    expect(res.status).toBe(200);
    expect(res.body.notifications).toHaveLength(2);
  });

  it("DELETE /api/banking/notifications/:id removes a notification", async () => {
    const account = await seedTestAccount({
      email: "notif.delete@test.local",
      accountNumber: "600000000002",
      appUserId: "user-notif-delete-001"
    });

    const notif = await testPrisma.bankNotification.create({
      data: {
        appUserId: "user-notif-delete-001",
        accountId: account.id,
        title: "To Delete",
        message: "This will be deleted"
      }
    });

    const res = await request(app)
      .delete(`/api/banking/notifications/${notif.id}`)
      .set("Authorization", bearerToken({ _id: "user-notif-delete-001" }));

    expect(res.status).toBe(200);

    const deletedNotif = await testPrisma.bankNotification.findUnique({ where: { id: notif.id } });
    expect(deletedNotif).toBeNull();
  });

  it("verifyBankAccount (service) creates a BankNotification on success", async () => {
    await seedTestAccount({
      holderName: "Notif Verify",
      email: "notif.verify@test.local",
      accountNumber: "600000000003",
      balance: 10000
    });

    await verifyBankAccount("user-notif-v-001", {}, {
      accountNumber: "600000000003",
      ifsc: "DEMO0000001",
      accountHolderName: "Notif Verify"
    });

    const notif = await testPrisma.bankNotification.findFirst({
      where: { appUserId: "user-notif-v-001" }
    });
    expect(notif).not.toBeNull();
    expect(notif.title).toBe("Bank Account Verified");
  });
});

// =============================================================================
// 4.9  Admin: freeze, reset balance, list users/transactions
// =============================================================================

describe("4.9 — Admin endpoints (freeze, reset balance, list users/transactions)", () => {
  it("GET /api/banking/admin/users returns all bank accounts", async () => {
    await seedTestAccount({ email: "admin.user1@test.local", accountNumber: "700000000001" });
    await seedTestAccount({ email: "admin.user2@test.local", accountNumber: "700000000002" });

    const res = await request(app)
      .get("/api/banking/admin/users")
      .set("Authorization", adminToken());

    expect(res.status).toBe(200);
    expect(res.body.accounts.length).toBeGreaterThanOrEqual(2);
  });

  it("GET /api/banking/admin/transactions returns all transactions", async () => {
    const account = await seedTestAccount({
      email: "admin.txn@test.local",
      accountNumber: "700000000003"
    });

    await testPrisma.bankTransaction.create({
      data: {
        transactionRef: generateTransactionRef("ADM"),
        senderId: account.id,
        senderAccountNumber: account.accountNumber,
        amount: toDecimal(100),
        type: "DEBIT",
        status: "SUCCESS",
        description: "Admin test transaction"
      }
    });

    const res = await request(app)
      .get("/api/banking/admin/transactions")
      .set("Authorization", adminToken());

    expect(res.status).toBe(200);
    expect(res.body.transactions.length).toBeGreaterThanOrEqual(1);
  });

  it("PATCH /api/banking/admin/users/:id/freeze freezes an account", async () => {
    const account = await seedTestAccount({ email: "freeze.test@test.local", accountNumber: "700000000004" });

    const res = await request(app)
      .patch(`/api/banking/admin/users/${account.id}/freeze`)
      .set("Authorization", adminToken())
      .send({ frozen: true });

    expect(res.status).toBe(200);
    expect(res.body.account.status).toBe("FROZEN");

    const frozen = await testPrisma.bankAccount.findUnique({ where: { id: account.id } });
    expect(frozen.status).toBe("FROZEN");
  });

  it("PATCH /api/banking/admin/users/:id/freeze unfreezes an account", async () => {
    const account = await seedTestAccount({
      email: "unfreeze.test@test.local",
      accountNumber: "700000000005",
      status: "FROZEN"
    });

    const res = await request(app)
      .patch(`/api/banking/admin/users/${account.id}/freeze`)
      .set("Authorization", adminToken())
      .send({ frozen: false });

    expect(res.status).toBe(200);
    expect(res.body.account.status).toBe("ACTIVE");
  });

  it("PATCH /api/banking/admin/users/:id/reset-balance resets account balance", async () => {
    const account = await seedTestAccount({ email: "reset.test@test.local", accountNumber: "700000000006", balance: 1000 });

    const res = await request(app)
      .patch(`/api/banking/admin/users/${account.id}/reset-balance`)
      .set("Authorization", adminToken())
      .send({ balance: 50000 });

    expect(res.status).toBe(200);
    expect(Number(res.body.account.balance)).toBe(50000);

    const updated = await testPrisma.bankAccount.findUnique({ where: { id: account.id } });
    expect(Number(updated.balance)).toBe(50000);
  });

  it("GET /api/banking/admin/users returns 403 for regular user role", async () => {
    const res = await request(app)
      .get("/api/banking/admin/users")
      .set("Authorization", bearerToken({ role: "user" }));

    expect(res.status).toBe(403);
  });

  it("GET /api/banking/admin/users returns 403 for rta_admin role", async () => {
    const res = await request(app).get("/api/banking/admin/users").set("Authorization", rtaToken());

    expect(res.status).toBe(403);
  });

  it("GET /api/banking/admin/users returns 403 for amc_admin role", async () => {
    const res = await request(app).get("/api/banking/admin/users").set("Authorization", amcToken());

    expect(res.status).toBe(403);
  });

  it("GET /api/banking/admin/users returns 401 without token", async () => {
    const res = await request(app).get("/api/banking/admin/users");
    expect(res.status).toBe(401);
  });
});

// =============================================================================
// 4.10 requireBankingConfigured middleware
// =============================================================================

describe("4.10 — requireBankingConfigured middleware", () => {
  it("banking routes work normally when BANK_DATABASE_URL is configured", async () => {
    const res = await request(app)
      .get("/api/banking/account")
      .set("Authorization", bearerToken({ _id: "middleware-test-user" }));

    // Should NOT return 503 — banking is configured in our test env
    expect(res.status).not.toBe(503);
    expect(res.status).toBe(200);
  });
});

// =============================================================================
// 4.11 Internal routes: debitForInvestment, getLinkedAccount
// =============================================================================

describe("4.11 — Internal routes: debitForInvestment and getLinkedAccount", () => {
  it("getLinkedAccount (service) returns the linked account for a user", async () => {
    await seedTestAccount({
      email: "internal.linked@test.local",
      accountNumber: "800000000001",
      appUserId: "internal-user-001"
    });

    const account = await getLinkedAccount("internal-user-001");
    expect(account).not.toBeNull();
    expect(account.accountNumber).toBe("800000000001");
  });

  it("getLinkedAccount (service) returns null for unlinked user", async () => {
    const account = await getLinkedAccount("non-existent-user-999");
    expect(account).toBeNull();
  });

  it("debitForInvestment (service) debits with INV prefix transaction ref", async () => {
    const account = await seedTestAccount({
      email: "invest.debit@test.local",
      accountNumber: "800000000002",
      appUserId: "invest-user-001",
      balance: 50000
    });

    const result = await debitForInvestment("invest-user-001", 10000, "Buy HDFC Top 100 MF", null);

    expect(result.debit.transactionRef).toMatch(/^INV/);
    expect(Number(result.account.balance)).toBe(40000);

    const updated = await testPrisma.bankAccount.findUnique({ where: { id: account.id } });
    expect(Number(updated.balance)).toBe(40000);

    const ledger = await testPrisma.ledgerEntry.findFirst({
      where: { accountId: account.id, entryType: "DEBIT" }
    });
    expect(Number(ledger.amount)).toBe(10000);
  });

  it("debitForInvestment (service) throws 400 when balance is insufficient", async () => {
    await seedTestAccount({
      email: "invest.insufficient@test.local",
      accountNumber: "800000000003",
      appUserId: "invest-user-002",
      balance: 100
    });

    await expect(debitForInvestment("invest-user-002", 10000, "Too expensive")).rejects.toMatchObject({
      statusCode: 400
    });
  });

  it("debitForInvestment (service) throws 400 when account is not linked", async () => {
    await expect(debitForInvestment("non-linked-invest-user", 1000, "No account")).rejects.toMatchObject({
      statusCode: 400
    });
  });

  it("debitForInvestment (service) throws 403 when account is frozen", async () => {
    await seedTestAccount({
      email: "invest.frozen@test.local",
      accountNumber: "800000000004",
      appUserId: "invest-user-003",
      balance: 50000,
      status: "FROZEN"
    });

    await expect(debitForInvestment("invest-user-003", 1000, "Frozen account")).rejects.toMatchObject({
      statusCode: 403
    });
  });

  it("internal GET /internal/accounts/linked/:userId returns linked account", async () => {
    await seedTestAccount({
      email: "internal.route@test.local",
      accountNumber: "800000000005",
      appUserId: "internal-route-user-001"
    });

    const res = await request(app)
      .get("/internal/accounts/linked/internal-route-user-001")
      .set("x-service-key", "dev-internal-key");

    expect(res.status).toBe(200);
    expect(res.body.account).not.toBeNull();
    expect(res.body.account.accountNumber).toBe("800000000005");
  });

  it("internal POST /internal/debit/investment debits for investment", async () => {
    await seedTestAccount({
      email: "internal.invest@test.local",
      accountNumber: "800000000006",
      appUserId: "internal-invest-user-001",
      balance: 100000
    });

    const res = await request(app)
      .post("/internal/debit/investment")
      .set("x-service-key", "dev-internal-key")
      .send({
        userId: "internal-invest-user-001",
        amount: 5000,
        description: "Buy Nippon India Growth Fund",
        targetAccount: null
      });

    expect(res.status).toBe(200);
    expect(res.body.debit.transactionRef).toMatch(/^INV/);
    expect(Number(res.body.account.balance)).toBe(95000);
  });

  it("internal routes return 403 with wrong internal service key", async () => {
    const res = await request(app)
      .get("/internal/accounts/linked/some-user-id")
      .set("x-service-key", "wrong-key");

    expect(res.status).toBe(403);
  });

  it("internal routes return 403 without internal service key", async () => {
    const res = await request(app)
      .get("/internal/accounts/linked/some-user-id");

    expect(res.status).toBe(403);
  });
});

// =============================================================================
// Money Utilities (Unit tests)
// =============================================================================

describe("Money Utilities — generateTransactionRef, toDecimal, VERIFICATION_AMOUNT", () => {
  it("generateTransactionRef generates refs with correct prefix", () => {
    const ref = generateTransactionRef("VRD");
    expect(ref).toMatch(/^VRD/);
  });

  it("generateTransactionRef generates unique refs", () => {
    const refs = new Set(Array.from({ length: 50 }, () => generateTransactionRef("TST")));
    expect(refs.size).toBe(50);
  });

  it("toDecimal converts number to Prisma Decimal", () => {
    const d = toDecimal(1500);
    expect(d.toString()).toBe("1500");
  });

  it("VERIFICATION_AMOUNT equals Rs. 2", () => {
    expect(VERIFICATION_AMOUNT.toString()).toBe("2");
  });
});
