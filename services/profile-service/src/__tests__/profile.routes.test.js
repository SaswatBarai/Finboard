import { afterAll, beforeAll, beforeEach, describe, expect, it } from "@jest/globals";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import request from "supertest";
import jwt from "jsonwebtoken";

// Set env vars before any lazy getServiceEnv() calls fire
process.env.JWT_SECRET = "test-profile-secret-32chars-ok";
process.env.NODE_ENV = "development";
process.env.INTERNAL_SERVICE_KEY = "dev-internal-key";
process.env.BCRYPT_SALT_ROUNDS = "1";

import { registerLocalAuthHandler } from "@finboard/contracts";
import { buildApp } from "../app.js";
import { registerProfileHandlers } from "../bootstrap/register-handlers.js";
import { UserProfile } from "../modules/profile/models/profile.model.js";

// ── Shared test identity ──────────────────────────────────────────────────────

const TEST_USER_ID = new mongoose.Types.ObjectId();
const TEST_USER_ID_STR = TEST_USER_ID.toString();

const TEST_USER = {
  id: TEST_USER_ID_STR,
  _id: TEST_USER_ID,
  name: "Profile Tester",
  email: "tester@profile.test",
  phone: "+919876540000",
  role: "user",
  phoneVerified: true,
  emailVerified: true
};

// Wire local auth handler — requireAuth will use this instead of calling auth-service HTTP
registerLocalAuthHandler({
  getUserById: async (id) => (id === TEST_USER_ID_STR ? TEST_USER : null)
});

// Wire local profile handler for contracts used by other services
registerProfileHandlers();

function bearerToken(userId = TEST_USER_ID_STR) {
  return `Bearer ${jwt.sign({ sub: userId, email: TEST_USER.email, role: "user" }, process.env.JWT_SECRET)}`;
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
  await UserProfile.deleteMany({});
});

// ── GET /api/profile/me ───────────────────────────────────────────────────────

describe("GET /api/profile/me", () => {
  it("returns 401 without token", async () => {
    const res = await request(app).get("/api/profile/me");
    expect(res.status).toBe(401);
  });

  it("creates and returns profile on first call (upsert)", async () => {
    const res = await request(app)
      .get("/api/profile/me")
      .set("Authorization", bearerToken());

    expect(res.status).toBe(200);
    expect(res.body.profile).toBeTruthy();
    expect(res.body.profile.userId.toString()).toBe(TEST_USER_ID_STR);
  });

  it("auto-fills name, email, phone from user token on creation", async () => {
    const res = await request(app)
      .get("/api/profile/me")
      .set("Authorization", bearerToken());

    expect(res.status).toBe(200);
    const { profile } = res.body;
    expect(profile.fullName).toBe(TEST_USER.name);
    expect(profile.emailAddress).toBe(TEST_USER.email);
    expect(profile.mobileNumber).toBe(TEST_USER.phone);
  });

  it("returns existing profile on subsequent calls without overwriting", async () => {
    // Create profile via PUT
    await request(app)
      .put("/api/profile/me")
      .set("Authorization", bearerToken())
      .send({ fullName: "Custom Name", occupation: "Engineer" });

    // GET should return the saved values
    const res = await request(app)
      .get("/api/profile/me")
      .set("Authorization", bearerToken());

    expect(res.status).toBe(200);
    expect(res.body.profile.fullName).toBe("Custom Name");
    expect(res.body.profile.occupation).toBe("Engineer");
  });

  it("returns 401 with invalid JWT", async () => {
    const res = await request(app)
      .get("/api/profile/me")
      .set("Authorization", "Bearer invalid.token.value");

    expect(res.status).toBe(401);
  });

  it("returns 401 when JWT sub references unknown user", async () => {
    const unknownId = new mongoose.Types.ObjectId().toString();
    const res = await request(app)
      .get("/api/profile/me")
      .set("Authorization", bearerToken(unknownId));

    expect(res.status).toBe(401);
  });
});

// ── PUT /api/profile/me ───────────────────────────────────────────────────────

describe("PUT /api/profile/me", () => {
  it("returns 401 without token", async () => {
    const res = await request(app)
      .put("/api/profile/me")
      .send({ fullName: "No Auth" });

    expect(res.status).toBe(401);
  });

  it("updates scalar profile fields", async () => {
    const res = await request(app)
      .put("/api/profile/me")
      .set("Authorization", bearerToken())
      .send({
        fullName: "Investor One",
        occupation: "Software Engineer",
        gender: "Male",
        maritalStatus: "Single",
        incomeRange: "5 Lac - 10 Lac"
      });

    expect(res.status).toBe(200);
    const { profile } = res.body;
    expect(profile.fullName).toBe("Investor One");
    expect(profile.occupation).toBe("Software Engineer");
    expect(profile.gender).toBe("Male");
    expect(profile.maritalStatus).toBe("Single");
    expect(profile.incomeRange).toBe("5 Lac - 10 Lac");
  });

  it("normalizes PAN to uppercase", async () => {
    const res = await request(app)
      .put("/api/profile/me")
      .set("Authorization", bearerToken())
      .send({ pan: "bnzpm2501f" });

    expect(res.status).toBe(200);
    expect(res.body.profile.pan).toBe("BNZPM2501F");
  });

  it("normalizes bank IFSC to uppercase", async () => {
    const res = await request(app)
      .put("/api/profile/me")
      .set("Authorization", bearerToken())
      .send({ bank: { ifsc: "hdfc0001234", accountHolderName: "Test User", bankName: "HDFC Bank" } });

    expect(res.status).toBe(200);
    expect(res.body.profile.bank.ifsc).toBe("HDFC0001234");
  });

  it("parses dateOfBirth string to a Date value", async () => {
    const res = await request(app)
      .put("/api/profile/me")
      .set("Authorization", bearerToken())
      .send({ dateOfBirth: "1995-08-15" });

    expect(res.status).toBe(200);
    expect(new Date(res.body.profile.dateOfBirth).getFullYear()).toBe(1995);
  });

  it("updates address sub-document", async () => {
    const res = await request(app)
      .put("/api/profile/me")
      .set("Authorization", bearerToken())
      .send({
        address: {
          line1: "123 MG Road",
          city: "Bengaluru",
          state: "Karnataka",
          postalCode: "560001",
          country: "India"
        }
      });

    expect(res.status).toBe(200);
    const { address } = res.body.profile;
    expect(address.city).toBe("Bengaluru");
    expect(address.postalCode).toBe("560001");
  });

  it("returns 400 on invalid PAN format", async () => {
    const res = await request(app)
      .put("/api/profile/me")
      .set("Authorization", bearerToken())
      .send({ pan: "INVALID" });

    expect(res.status).toBe(400);
  });

  it("returns 400 on invalid IFSC format", async () => {
    const res = await request(app)
      .put("/api/profile/me")
      .set("Authorization", bearerToken())
      .send({ bank: { ifsc: "BADINPUT" } });

    expect(res.status).toBe(400);
  });

  it("returns 400 on invalid email format in emailAddress field", async () => {
    const res = await request(app)
      .put("/api/profile/me")
      .set("Authorization", bearerToken())
      .send({ emailAddress: "not-an-email" });

    expect(res.status).toBe(400);
  });

  it("returns 400 on invalid gender enum value", async () => {
    const res = await request(app)
      .put("/api/profile/me")
      .set("Authorization", bearerToken())
      .send({ gender: "Robot" });

    expect(res.status).toBe(400);
  });

  it("allows clearing dateOfBirth with empty string", async () => {
    // First set a date
    await request(app)
      .put("/api/profile/me")
      .set("Authorization", bearerToken())
      .send({ dateOfBirth: "1990-01-01" });

    // Then clear it
    const res = await request(app)
      .put("/api/profile/me")
      .set("Authorization", bearerToken())
      .send({ dateOfBirth: "" });

    expect(res.status).toBe(200);
  });

  it("merges partial updates without wiping unrelated fields", async () => {
    await request(app)
      .put("/api/profile/me")
      .set("Authorization", bearerToken())
      .send({ fullName: "First Set", occupation: "Doctor" });

    await request(app)
      .put("/api/profile/me")
      .set("Authorization", bearerToken())
      .send({ gender: "Female" });

    const res = await request(app)
      .get("/api/profile/me")
      .set("Authorization", bearerToken());

    expect(res.body.profile.fullName).toBe("First Set");
    expect(res.body.profile.occupation).toBe("Doctor");
    expect(res.body.profile.gender).toBe("Female");
  });
});

// ── POST /internal/profile ────────────────────────────────────────────────────

describe("POST /internal/profile", () => {
  it("creates a new profile and returns 201", async () => {
    const newUserId = new mongoose.Types.ObjectId();

    const res = await request(app)
      .post("/internal/profile")
      .set(INTERNAL_HEADER)
      .send({
        userId: newUserId.toString(),
        fullName: "New Investor",
        mobileNumber: "+919123456789",
        emailAddress: "new@investor.test"
      });

    expect(res.status).toBe(201);
    expect(res.body.profile.fullName).toBe("New Investor");
    expect(res.body.profile.mobileNumber).toBe("+919123456789");
  });

  it("returns kycStatus defaulting to profile_pending", async () => {
    const newUserId = new mongoose.Types.ObjectId();

    const res = await request(app)
      .post("/internal/profile")
      .set(INTERNAL_HEADER)
      .send({ userId: newUserId.toString(), fullName: "KYC Check", mobileNumber: "+910000000000", emailAddress: "kyc@test.com" });

    expect(res.status).toBe(201);
    expect(res.body.profile.kycStatus).toBe("profile_pending");
  });

  it("returns 403 without internal service key", async () => {
    const res = await request(app)
      .post("/internal/profile")
      .send({ userId: new mongoose.Types.ObjectId().toString(), fullName: "Blocked" });

    expect(res.status).toBe(403);
  });

  it("returns 403 with wrong internal service key", async () => {
    const res = await request(app)
      .post("/internal/profile")
      .set({ "x-service-key": "wrong-key" })
      .send({ userId: new mongoose.Types.ObjectId().toString(), fullName: "Blocked" });

    expect(res.status).toBe(403);
  });
});

// ── GET /internal/profile/:userId ─────────────────────────────────────────────

describe("GET /internal/profile/:userId", () => {
  it("returns a profile by userId", async () => {
    const userId = new mongoose.Types.ObjectId();
    await UserProfile.create({ userId, fullName: "Found User", mobileNumber: "+910000000001", emailAddress: "found@test.com" });

    const res = await request(app)
      .get(`/internal/profile/${userId}`)
      .set(INTERNAL_HEADER);

    expect(res.status).toBe(200);
    expect(res.body.profile.fullName).toBe("Found User");
  });

  it("returns 404 for non-existent userId", async () => {
    const unknownId = new mongoose.Types.ObjectId();

    const res = await request(app)
      .get(`/internal/profile/${unknownId}`)
      .set(INTERNAL_HEADER);

    expect(res.status).toBe(404);
  });

  it("returns 403 without internal service key", async () => {
    const res = await request(app).get(`/internal/profile/${new mongoose.Types.ObjectId()}`);
    expect(res.status).toBe(403);
  });
});

// ── PATCH /internal/profile/:userId/kyc-status ───────────────────────────────

describe("PATCH /internal/profile/:userId/kyc-status", () => {
  it("updates kycStatus to approved", async () => {
    const userId = new mongoose.Types.ObjectId();
    await UserProfile.create({ userId, fullName: "KYC Pending", mobileNumber: "+910000000002", emailAddress: "kyc1@test.com" });

    const res = await request(app)
      .patch(`/internal/profile/${userId}/kyc-status`)
      .set(INTERNAL_HEADER)
      .send({ kycStatus: "approved" });

    expect(res.status).toBe(200);
    expect(res.body.profile.kycStatus).toBe("approved");
  });

  it("updates kycStatus to rejected", async () => {
    const userId = new mongoose.Types.ObjectId();
    await UserProfile.create({ userId, fullName: "KYC Reject", mobileNumber: "+910000000003", emailAddress: "kyc2@test.com" });

    const res = await request(app)
      .patch(`/internal/profile/${userId}/kyc-status`)
      .set(INTERNAL_HEADER)
      .send({ kycStatus: "rejected" });

    expect(res.status).toBe(200);
    expect(res.body.profile.kycStatus).toBe("rejected");
  });

  it("also updates pan when provided alongside kycStatus", async () => {
    const userId = new mongoose.Types.ObjectId();
    await UserProfile.create({ userId, fullName: "PAN Update", mobileNumber: "+910000000004", emailAddress: "pan@test.com" });

    const res = await request(app)
      .patch(`/internal/profile/${userId}/kyc-status`)
      .set(INTERNAL_HEADER)
      .send({ kycStatus: "approved", pan: "ABCDE1234F" });

    expect(res.status).toBe(200);
    expect(res.body.profile.pan).toBe("ABCDE1234F");
  });

  it("upserts profile if it does not exist", async () => {
    const newUserId = new mongoose.Types.ObjectId();

    const res = await request(app)
      .patch(`/internal/profile/${newUserId}/kyc-status`)
      .set(INTERNAL_HEADER)
      .send({ kycStatus: "approved" });

    expect(res.status).toBe(200);
    expect(res.body.profile.kycStatus).toBe("approved");
  });

  it("returns 403 without internal service key", async () => {
    const res = await request(app)
      .patch(`/internal/profile/${new mongoose.Types.ObjectId()}/kyc-status`)
      .send({ kycStatus: "approved" });

    expect(res.status).toBe(403);
  });
});
