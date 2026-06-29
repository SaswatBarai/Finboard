import { afterAll, beforeAll, beforeEach, describe, expect, it } from "@jest/globals";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import request from "supertest";
import jwt from "jsonwebtoken";

process.env.JWT_SECRET = "test-audit-secret-32chars-ok";
process.env.NODE_ENV = "development";
process.env.INTERNAL_SERVICE_KEY = "dev-internal-key";

import { registerLocalAuthHandler } from "@finboard/contracts";
import { buildApp } from "../app.js";
import { AuditLog } from "../modules/audit/models/audit-log.model.js";

const ADMIN_ID = new mongoose.Types.ObjectId();
const ADMIN_ID_STR = ADMIN_ID.toString();
const USER_ID = new mongoose.Types.ObjectId();
const USER_ID_STR = USER_ID.toString();
const RESOURCE_ID = new mongoose.Types.ObjectId().toString();

const ADMIN_USER = {
  id: ADMIN_ID_STR,
  _id: ADMIN_ID,
  name: "Audit Admin",
  email: "admin@audit.test",
  phone: "+919876540100",
  role: "admin"
};

const REGULAR_USER = {
  id: USER_ID_STR,
  _id: USER_ID,
  name: "Retail User",
  email: "user@audit.test",
  phone: "+919876540101",
  role: "user"
};

registerLocalAuthHandler({
  getUserById: async (id) => {
    if (id === ADMIN_ID_STR) return ADMIN_USER;
    if (id === USER_ID_STR) return REGULAR_USER;
    return null;
  }
});

function bearerToken(user = ADMIN_USER) {
  return `Bearer ${jwt.sign({ sub: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET)}`;
}

const INTERNAL_HEADER = { "x-service-key": "dev-internal-key" };

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
  await AuditLog.deleteMany({});
});

async function seedAuditEntry(overrides = {}) {
  return AuditLog.create({
    actorId: ADMIN_ID,
    actorRole: "admin",
    action: "KYC_SUBMITTED",
    resourceType: "kyc",
    resourceId: RESOURCE_ID,
    details: { status: "pending_admin_review" },
    ipAddress: "127.0.0.1",
    userAgent: "jest",
    ...overrides
  });
}

describe("GET /api/audit/:resourceType/:resourceId", () => {
  it("returns 401 without token", async () => {
    const res = await request(app).get(`/api/audit/kyc/${RESOURCE_ID}`);
    expect(res.status).toBe(401);
  });

  it("returns 403 for non-admin users", async () => {
    const res = await request(app)
      .get(`/api/audit/kyc/${RESOURCE_ID}`)
      .set("Authorization", bearerToken(REGULAR_USER));

    expect(res.status).toBe(403);
  });

  it("returns audit entries for admin users", async () => {
    await seedAuditEntry();
    await seedAuditEntry({ action: "KYC_APPROVED", details: { remarks: "Looks good" } });
    await seedAuditEntry({ resourceId: "other-resource" });

    const res = await request(app)
      .get(`/api/audit/kyc/${RESOURCE_ID}`)
      .set("Authorization", bearerToken());

    expect(res.status).toBe(200);
    expect(res.body.entries).toHaveLength(2);
    expect(res.body.entries[0].action).toBe("KYC_APPROVED");
    expect(res.body.entries[1].action).toBe("KYC_SUBMITTED");
  });

  it("allows rta_admin role", async () => {
    await seedAuditEntry();
    const rtaAdmin = { ...ADMIN_USER, id: ADMIN_ID_STR, role: "rta_admin" };
    const token = bearerToken(rtaAdmin);

    const res = await request(app).get(`/api/audit/kyc/${RESOURCE_ID}`).set("Authorization", token);

    expect(res.status).toBe(200);
    expect(res.body.entries).toHaveLength(1);
  });
});

describe("POST /internal/audit", () => {
  it("creates an audit entry via internal route", async () => {
    const res = await request(app)
      .post("/internal/audit")
      .set(INTERNAL_HEADER)
      .send({
        actorId: USER_ID_STR,
        actorRole: "user",
        action: "KYC_SUBMITTED",
        resourceType: "kyc",
        resourceId: RESOURCE_ID,
        details: { status: "pending_admin_review" },
        ipAddress: "10.0.0.1",
        userAgent: "supertest"
      });

    expect(res.status).toBe(201);
    expect(res.body.entry.action).toBe("KYC_SUBMITTED");
    expect(res.body.entry.resourceType).toBe("kyc");
  });

  it("rejects requests without internal service key", async () => {
    const res = await request(app).post("/internal/audit").send({
      action: "KYC_SUBMITTED",
      resourceType: "kyc",
      resourceId: RESOURCE_ID
    });

    expect(res.status).toBe(403);
  });
});

describe("Immutability", () => {
  it("does not expose update or delete routes", async () => {
    const entry = await seedAuditEntry();

    const updateRes = await request(app)
      .put(`/api/audit/kyc/${RESOURCE_ID}`)
      .set("Authorization", bearerToken())
      .send({ action: "TAMPERED" });

    const deleteRes = await request(app)
      .delete(`/api/audit/${entry._id}`)
      .set("Authorization", bearerToken());

    expect(updateRes.status).toBe(404);
    expect(deleteRes.status).toBe(404);
  });
});
