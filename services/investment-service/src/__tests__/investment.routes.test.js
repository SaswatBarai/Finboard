import { afterAll, beforeAll, beforeEach, describe, expect, it } from "@jest/globals";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import request from "supertest";
import jwt from "jsonwebtoken";

// Set env vars before loading config/app
process.env.JWT_SECRET = "test-investment-secret-32chars-ok";
process.env.NODE_ENV = "development";
process.env.INTERNAL_SERVICE_KEY = "dev-internal-key";

import {
  registerLocalAuthHandler,
  registerLocalProfileHandler,
  registerLocalBankingHandler,
  registerLocalNotificationHandler
} from "@finboard/contracts";
import { buildApp } from "../app.js";
import { registerInvestmentHandlers } from "../bootstrap/register-handlers.js";
import { PortfolioHolding } from "../modules/investment/models/portfolio-holding.model.js";

const TEST_USER_ID = new mongoose.Types.ObjectId().toString();
const ADMIN_USER_ID = "admin-user-id";
const AMC_ADMIN_USER_ID = "amc-admin-user-id";

// Wire local handlers for contracts
registerLocalAuthHandler({
  getUserById: async (id) => ({
    _id: id,
    id,
    name: "Test User",
    email: `${id}@test.com`,
    role: id === ADMIN_USER_ID ? "admin" : id === AMC_ADMIN_USER_ID ? "amc_admin" : "user",
    phoneVerified: true,
    emailVerified: true
  }),
  listUsersByRole: async (_role) => {
    return [
      { _id: TEST_USER_ID, id: TEST_USER_ID, name: "Test User", role: "user" }
    ];
  }
});

registerLocalProfileHandler({
  getProfileByUserId: async (userId) => {
    if (userId === "unapproved-user") {
      return { kycStatus: "pending" };
    }
    return { kycStatus: "approved" };
  }
});

let debitCount = 0;
registerLocalBankingHandler({
  getLinkedAccount: async (userId) => {
    if (userId === "unlinked-user") {
      return null;
    }
    return { accountNumber: "1234567890", bankName: "Test Bank" };
  },
  debitForInvestment: async (userId, _amount, _description, _targetAccount) => {
    debitCount++;
    if (userId === "poor-user") {
      throw Object.assign(new Error("Insufficient balance"), { statusCode: 400 });
    }
    return { success: true };
  }
});

let notifyCount = 0;
registerLocalNotificationHandler(async (_userId, _title, _message, _type) => {
  notifyCount++;
  return { success: true };
});

registerInvestmentHandlers();

function bearerToken(userId = TEST_USER_ID, role = "user") {
  return `Bearer ${jwt.sign({ sub: userId, email: "tester@test.com", role }, process.env.JWT_SECRET)}`;
}

let mongod;
let app;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
  app = buildApp();
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

beforeEach(async () => {
  await PortfolioHolding.deleteMany({});
  debitCount = 0;
  notifyCount = 0;
});

describe("Investment Service — Phase 5 Integration Tests", () => {
  
  describe("GET /api/investments/portfolio", () => {
    it("returns 401 without auth token", async () => {
      const res = await request(app).get("/api/investments/portfolio");
      expect(res.status).toBe(401);
    });

    it("returns empty portfolio list for user with no holdings", async () => {
      const res = await request(app)
        .get("/api/investments/portfolio")
        .set("Authorization", bearerToken());
      
      expect(res.status).toBe(200);
      expect(res.body.holdings).toEqual([]);
    });

    it("returns portfolio holdings for the authenticated user", async () => {
      await PortfolioHolding.create({
        userId: TEST_USER_ID,
        assetType: "stock",
        symbol: "RELIANCE",
        name: "Reliance Industries",
        quantity: 10,
        purchasePrice: 2400,
        currentPrice: 2400,
        totalAmount: 24000
      });

      // Holding for another user
      await PortfolioHolding.create({
        userId: new mongoose.Types.ObjectId().toString(),
        assetType: "stock",
        symbol: "TCS",
        name: "TATA Consultancy Services",
        quantity: 5,
        purchasePrice: 3200,
        currentPrice: 3200,
        totalAmount: 16000
      });

      const res = await request(app)
        .get("/api/investments/portfolio")
        .set("Authorization", bearerToken());

      expect(res.status).toBe(200);
      expect(res.body.holdings.length).toBe(1);
      expect(res.body.holdings[0].symbol).toBe("RELIANCE");
    });
  });

  describe("POST /api/investments/buy", () => {
    const validStockOrder = {
      symbol: "INFY",
      name: "Infosys",
      price: 1500,
      quantity: 5,
      assetType: "stock"
    };

    const validMutualFundOrder = {
      symbol: "HDFCBAL",
      name: "HDFC Balanced Advantage Fund",
      price: 300,
      quantity: 50,
      assetType: "mutual_fund"
    };

    it("rejects buy orders without authorization", async () => {
      const res = await request(app)
        .post("/api/investments/buy")
        .send(validStockOrder);
      expect(res.status).toBe(401);
    });

    it("rejects when body fields are missing/invalid", async () => {
      const res = await request(app)
        .post("/api/investments/buy")
        .set("Authorization", bearerToken())
        .send({ symbol: "", price: -100 });
      expect(res.status).toBe(400); // Zod validation failure
    });

    it("rejects if KYC is not approved", async () => {
      const res = await request(app)
        .post("/api/investments/buy")
        .set("Authorization", bearerToken("unapproved-user"))
        .send(validStockOrder);
      
      expect(res.status).toBe(403);
      expect(res.body.message).toContain("KYC");
    });

    it("rejects if bank account is not linked", async () => {
      const res = await request(app)
        .post("/api/investments/buy")
        .set("Authorization", bearerToken("unlinked-user"))
        .send(validStockOrder);
      
      expect(res.status).toBe(400);
      expect(res.body.message).toContain("bank verification");
    });

    it("rejects if bank account has insufficient balance", async () => {
      const res = await request(app)
        .post("/api/investments/buy")
        .set("Authorization", bearerToken("poor-user"))
        .send(validStockOrder);
      
      expect(res.status).toBe(400);
      expect(res.body.message).toContain("Insufficient balance");
    });

    it("successfully purchases stock immediately", async () => {
      const res = await request(app)
        .post("/api/investments/buy")
        .set("Authorization", bearerToken())
        .send(validStockOrder);
      
      expect(res.status).toBe(201);
      expect(res.body.holding).toBeDefined();
      expect(res.body.holding.orderStatus).toBe("successful");
      expect(debitCount).toBe(1);
      expect(notifyCount).toBe(1);

      const dbHolding = await PortfolioHolding.findById(res.body.holding._id);
      expect(dbHolding).toBeDefined();
      expect(dbHolding.symbol).toBe("INFY");
    });

    it("places mutual fund order in pending_amc_approval status", async () => {
      const res = await request(app)
        .post("/api/investments/buy")
        .set("Authorization", bearerToken())
        .send(validMutualFundOrder);
      
      expect(res.status).toBe(201);
      expect(res.body.holding.orderStatus).toBe("pending_amc_approval");
      expect(res.body.holding.folioNumber).toMatch(/^FBN-HDFCBAL-/);
      expect(debitCount).toBe(1);
      expect(notifyCount).toBe(1);
    });
  });

  describe("POST /api/investments/sip", () => {
    const validSipData = {
      symbol: "SBIELITE",
      name: "SBI Bluechip Fund",
      nav: 60,
      monthlyAmount: 2000,
      sipDate: 15
    };

    it("rejects SIP request without authentication", async () => {
      const res = await request(app)
        .post("/api/investments/sip")
        .send(validSipData);
      expect(res.status).toBe(401);
    });

    it("creates SIP in sip_active status after debiting initial installment", async () => {
      const res = await request(app)
        .post("/api/investments/sip")
        .set("Authorization", bearerToken())
        .send(validSipData);
      
      expect(res.status).toBe(201);
      expect(res.body.holding.orderStatus).toBe("sip_active");
      expect(res.body.holding.sipAmount).toBe(2000);
      expect(res.body.holding.sipDate).toBe(15);
      expect(res.body.holding.folioNumber).toMatch(/^FBN-SBIELITE-/);
      expect(debitCount).toBe(1);
      expect(notifyCount).toBe(1);
    });
  });

  describe("GET /api/investments/admin/overview", () => {
    it("returns 403 for non-admin roles", async () => {
      const res = await request(app)
        .get("/api/investments/admin/overview")
        .set("Authorization", bearerToken());
      expect(res.status).toBe(403);
    });

    it("returns overview dashboard data for admin", async () => {
      await PortfolioHolding.create({
        userId: TEST_USER_ID,
        assetType: "stock",
        symbol: "TATA",
        name: "Tata Motors",
        quantity: 10,
        purchasePrice: 500,
        currentPrice: 520,
        totalAmount: 5000,
        orderStatus: "successful"
      });

      await PortfolioHolding.create({
        userId: TEST_USER_ID,
        assetType: "sip",
        symbol: "NIPPON",
        name: "Nippon Large Cap",
        quantity: 100,
        purchasePrice: 50,
        currentPrice: 55,
        totalAmount: 5000,
        sipAmount: 1000,
        orderStatus: "sip_active"
      });

      const res = await request(app)
        .get("/api/investments/admin/overview")
        .set("Authorization", bearerToken(ADMIN_USER_ID, "admin"));
      
      expect(res.status).toBe(200);
      expect(res.body.summary).toBeDefined();
      expect(res.body.summary.totalAum).toBe(10700); // 520*10 + 55*100 = 5200 + 5500
      expect(res.body.summary.sipBook).toBe(1000);
      expect(res.body.holdings.length).toBe(2);
      expect(res.body.holdings[0].investor).toBeDefined();
    });
  });

  describe("PATCH /api/investments/admin/orders/:id/status", () => {
    it("rejects order update for non-admin", async () => {
      const res = await request(app)
        .patch("/api/investments/admin/orders/some-id/status")
        .set("Authorization", bearerToken())
        .send({ status: "successful" });
      expect(res.status).toBe(403);
    });

    it("allows AMC admin or platform admin to update pending orders", async () => {
      const holding = await PortfolioHolding.create({
        userId: TEST_USER_ID,
        assetType: "mutual_fund",
        symbol: "AXIS",
        name: "Axis Long Term Equity",
        quantity: 50,
        purchasePrice: 100,
        currentPrice: 100,
        totalAmount: 5000,
        orderStatus: "pending_amc_approval"
      });

      const res = await request(app)
        .patch(`/api/investments/admin/orders/${holding._id}/status`)
        .set("Authorization", bearerToken(AMC_ADMIN_USER_ID, "amc_admin"))
        .send({ status: "successful" });
      
      expect(res.status).toBe(200);
      expect(res.body.holding.orderStatus).toBe("successful");
      expect(notifyCount).toBe(1);
    });

    it("returns 404 for unknown order ID", async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();
      const res = await request(app)
        .patch(`/api/investments/admin/orders/${fakeId}/status`)
        .set("Authorization", bearerToken(ADMIN_USER_ID, "admin"))
        .send({ status: "successful" });
      expect(res.status).toBe(404);
    });

    it("rejects invalid status", async () => {
      const res = await request(app)
        .patch("/api/investments/admin/orders/some-id/status")
        .set("Authorization", bearerToken(ADMIN_USER_ID, "admin"))
        .send({ status: "INVALID_STATUS" });
      expect(res.status).toBe(400);
    });
  });

  describe("Internal Routes — /internal/portfolio", () => {
    it("returns 403 when called without x-service-key header", async () => {
      const res = await request(app).get("/internal/portfolio");
      expect(res.status).toBe(403);
    });

    it("returns 403 when called with wrong service key", async () => {
      const res = await request(app)
        .get("/internal/portfolio")
        .set("x-service-key", "wrong-key");
      expect(res.status).toBe(403);
    });

    it("lists all holdings when called with service key", async () => {
      await PortfolioHolding.create({
        userId: TEST_USER_ID,
        assetType: "stock",
        symbol: "SBI",
        name: "State Bank of India",
        quantity: 10,
        purchasePrice: 600,
        currentPrice: 600,
        totalAmount: 6000
      });

      const res = await request(app)
        .get("/internal/portfolio")
        .set("x-service-key", "dev-internal-key");
      
      expect(res.status).toBe(200);
      expect(res.body.holdings.length).toBe(1);
      expect(res.body.holdings[0].symbol).toBe("SBI");
    });

    it("gets user holdings, creates holding, and updates holding internal routes", async () => {
      // 1. GET user holdings
      let res = await request(app)
        .get(`/internal/portfolio/users/${TEST_USER_ID}`)
        .set("x-service-key", "dev-internal-key");
      expect(res.status).toBe(200);
      expect(res.body.holdings).toEqual([]);

      // 2. POST create holding
      res = await request(app)
        .post("/internal/portfolio")
        .set("x-service-key", "dev-internal-key")
        .send({
          userId: TEST_USER_ID,
          assetType: "stock",
          symbol: "TCS",
          name: "Tata Consultancy Services",
          quantity: 2,
          purchasePrice: 3000,
          currentPrice: 3000,
          totalAmount: 6000
        });
      expect(res.status).toBe(201);
      expect(res.body.holding.symbol).toBe("TCS");
      const holdingId = res.body.holding._id;

      // 3. PATCH update holding
      res = await request(app)
        .patch(`/internal/portfolio/${holdingId}`)
        .set("x-service-key", "dev-internal-key")
        .send({ currentPrice: 3100 });
      expect(res.status).toBe(200);
      expect(res.body.holding.currentPrice).toBe(3100);
    });
  });

});
