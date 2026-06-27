import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, jest } from "@jest/globals";
import crypto from "crypto";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import request from "supertest";

// Set env vars before any module that reads them is invoked
process.env.JWT_SECRET = "test-jwt-secret-32chars-minimum-ok";
process.env.JWT_EXPIRES_IN = "1h";
process.env.NODE_ENV = "development";
process.env.BCRYPT_SALT_ROUNDS = "1";
process.env.INTERNAL_SERVICE_KEY = "dev-internal-key";

import { registerLocalProfileHandler } from "@finboard/contracts";
import { buildApp } from "../app.js";
import { registerAuthHandlers } from "../bootstrap/register-handlers.js";
import { User } from "../modules/auth/models/user.model.js";
import { signJwt } from "../common/helpers/jwt.helper.js";

// Wire local handlers so signup doesn't call profile-service over HTTP
registerLocalProfileHandler({
  createInitialProfile: async () => ({ id: "test-profile-id" })
});
registerAuthHandlers();

const TEST_PHONE = "+919876543210";
const TEST_EMAIL = "user@test.com";
const TEST_PASSWORD = "Password@123";
const TEST_OTP = "482917";

let mongod;
let app;
let randomIntSpy;

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
  await User.deleteMany({});
  randomIntSpy = jest.spyOn(crypto, "randomInt").mockReturnValue(Number(TEST_OTP));
});

afterEach(() => {
  randomIntSpy?.mockRestore();
});

// ── Helpers ──────────────────────────────────────────────────────────────────

async function createUser(overrides = {}) {
  const user = new User({
    name: overrides.name ?? "Test User",
    email: overrides.email ?? TEST_EMAIL,
    phone: overrides.phone ?? TEST_PHONE,
    role: overrides.role ?? "user",
    phoneVerified: true,
    emailVerified: overrides.emailVerified ?? false
  });
  await user.setPassword(overrides.password ?? TEST_PASSWORD);
  await user.save();
  return user;
}

function bearerToken(user) {
  return `Bearer ${signJwt(user)}`;
}

async function sendPhoneOtp(phone) {
  const res = await request(app).post("/api/auth/send-otp").send({ phone });
  expect(res.status).toBe(200);
  expect(res.body.devOtp).toBeUndefined();
  return TEST_OTP;
}

async function requestPasswordResetOtp(email) {
  const res = await request(app).post("/api/auth/forgot-password").send({ email });
  expect(res.status).toBe(200);
  expect(res.body.devOtp).toBeUndefined();
  return TEST_OTP;
}

// ── POST /api/auth/send-otp ───────────────────────────────────────────────────

describe("POST /api/auth/send-otp", () => {
  it("does not return OTP in the response body", async () => {
    await createUser();

    const res = await request(app)
      .post("/api/auth/send-otp")
      .send({ phone: TEST_PHONE });

    expect(res.status).toBe(200);
    expect(res.body.provider).toBe("development");
    expect(res.body.devOtp).toBeUndefined();
  });

  it("allows resend for pending signup users", async () => {
    await request(app).post("/api/auth/signup").send({
      name: "Pending User",
      email: "pending@test.com",
      phone: "+919000000099",
      password: TEST_PASSWORD
    });

    const res = await request(app)
      .post("/api/auth/send-otp")
      .send({ phone: "+919000000099" });

    expect(res.status).toBe(200);
    expect(res.body.devOtp).toBeUndefined();
  });

  it("returns 404 for unregistered phone numbers", async () => {
    const res = await request(app)
      .post("/api/auth/send-otp")
      .send({ phone: TEST_PHONE });

    expect(res.status).toBe(404);
    expect(res.body.message).toMatch(/registered/i);
  });

  it("rejects invalid phone format", async () => {
    const res = await request(app)
      .post("/api/auth/send-otp")
      .send({ phone: "9876543210" });

    expect(res.status).toBe(400);
  });
});

// ── POST /api/auth/verify-otp ─────────────────────────────────────────────────

describe("POST /api/auth/verify-otp", () => {
  it("returns approved:true with devOtp after send-otp", async () => {
    await createUser();
    const otp = await sendPhoneOtp(TEST_PHONE);

    const res = await request(app)
      .post("/api/auth/verify-otp")
      .send({ phone: TEST_PHONE, otp });

    expect(res.status).toBe(200);
    expect(res.body.approved).toBe(true);
  });

  it("returns approved:false with wrong OTP", async () => {
    await createUser();
    await request(app).post("/api/auth/send-otp").send({ phone: TEST_PHONE });

    const res = await request(app)
      .post("/api/auth/verify-otp")
      .send({ phone: TEST_PHONE, otp: "000000" });

    expect(res.status).toBe(200);
    expect(res.body.approved).toBe(false);
  });
});

// ── POST /api/auth/signup ─────────────────────────────────────────────────────

describe("POST /api/auth/signup", () => {
  it("creates a pending user, sends OTP, and completes on verify-otp", async () => {
    const res = await request(app).post("/api/auth/signup").send({
      name: "New User",
      email: TEST_EMAIL,
      phone: TEST_PHONE,
      password: TEST_PASSWORD
    });

    expect(res.status).toBe(201);
    expect(res.body.requiresPhoneVerification).toBe(true);
    expect(res.body.registrationComplete).toBe(false);
    expect(res.body.token).toBeUndefined();
    expect(res.body.user.email).toBe(TEST_EMAIL);
    expect(res.body.user.phoneVerified).toBe(false);
    expect(res.body.otp).toBeUndefined();

    const verifyRes = await request(app)
      .post("/api/auth/verify-otp")
      .send({ phone: TEST_PHONE, otp: TEST_OTP });

    expect(verifyRes.status).toBe(200);
    expect(verifyRes.body.registrationComplete).toBe(true);
    expect(verifyRes.body.token).toBeTruthy();
    expect(verifyRes.body.user.phoneVerified).toBe(true);
  });

  it("returns 409 on duplicate email", async () => {
    await createUser();

    const res = await request(app).post("/api/auth/signup").send({
      name: "Dup User",
      email: TEST_EMAIL,
      phone: "+919876543211",
      password: TEST_PASSWORD
    });

    expect(res.status).toBe(409);
  });

  it("returns 409 on duplicate phone", async () => {
    await createUser();

    const res = await request(app).post("/api/auth/signup").send({
      name: "Dup User",
      email: "other@test.com",
      phone: TEST_PHONE,
      password: TEST_PASSWORD
    });

    expect(res.status).toBe(409);
  });

  it("blocks signin until phone is verified", async () => {
    await request(app).post("/api/auth/signup").send({
      name: "Pending User",
      email: "pending@test.com",
      phone: "+919000000099",
      password: TEST_PASSWORD
    });

    const res = await request(app)
      .post("/api/auth/signin")
      .send({ email: "pending@test.com", password: TEST_PASSWORD });

    expect(res.status).toBe(403);
  });

  it("blocks phone-login until phone is verified", async () => {
    await request(app).post("/api/auth/signup").send({
      name: "Pending User",
      email: "pending-phone@test.com",
      phone: "+919000000088",
      password: TEST_PASSWORD
    });

    const res = await request(app)
      .post("/api/auth/phone-login")
      .send({ phone: "+919000000088", otp: "123456" });

    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/verification/i);
  });
});

// ── POST /api/auth/signin ─────────────────────────────────────────────────────

describe("POST /api/auth/signin", () => {
  it("returns token on valid credentials", async () => {
    await createUser();

    const res = await request(app)
      .post("/api/auth/signin")
      .send({ email: TEST_EMAIL, password: TEST_PASSWORD });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeTruthy();
    expect(res.body.user.email).toBe(TEST_EMAIL);
  });

  it("returns 401 on wrong password", async () => {
    await createUser();

    const res = await request(app)
      .post("/api/auth/signin")
      .send({ email: TEST_EMAIL, password: "WrongPass@1" });

    expect(res.status).toBe(401);
  });

  it("returns 401 on unknown email", async () => {
    const res = await request(app)
      .post("/api/auth/signin")
      .send({ email: "nobody@test.com", password: TEST_PASSWORD });

    expect(res.status).toBe(401);
  });
});

// ── POST /api/auth/phone-login ───────────────────────────────────────────────

describe("POST /api/auth/phone-login", () => {
  it("returns token for a registered verified user", async () => {
    await createUser();
    const otp = await sendPhoneOtp(TEST_PHONE);

    const res = await request(app)
      .post("/api/auth/phone-login")
      .send({ phone: TEST_PHONE, otp });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeTruthy();
    expect(res.body.user.phone).toBe(TEST_PHONE);
  });

  it("returns 404 for unregistered phone numbers", async () => {
    const res = await request(app)
      .post("/api/auth/phone-login")
      .send({ phone: "+919111111111", otp: "123456" });

    expect(res.status).toBe(404);
    expect(res.body.message).toMatch(/registered/i);
  });

  it("returns 401 for invalid OTP", async () => {
    await createUser();
    await request(app).post("/api/auth/send-otp").send({ phone: TEST_PHONE });

    const res = await request(app)
      .post("/api/auth/phone-login")
      .send({ phone: TEST_PHONE, otp: "000000" });

    expect(res.status).toBe(401);
  });
});

// ── POST /api/auth/admin/signin ───────────────────────────────────────────────

describe("POST /api/auth/admin/signin", () => {
  it("allows admin role to sign in", async () => {
    await createUser({ email: "admin@test.com", phone: "+910000000099", role: "admin" });

    const res = await request(app)
      .post("/api/auth/admin/signin")
      .send({ email: "admin@test.com", password: TEST_PASSWORD });

    expect(res.status).toBe(200);
    expect(res.body.user.role).toBe("admin");
  });

  it("allows rta_admin role", async () => {
    await createUser({ email: "rta@test.com", phone: "+910000000098", role: "rta_admin" });

    const res = await request(app)
      .post("/api/auth/admin/signin")
      .send({ email: "rta@test.com", password: TEST_PASSWORD });

    expect(res.status).toBe(200);
  });

  it("returns 403 when user role attempts admin login", async () => {
    await createUser();

    const res = await request(app)
      .post("/api/auth/admin/signin")
      .send({ email: TEST_EMAIL, password: TEST_PASSWORD });

    expect(res.status).toBe(403);
  });

  it("returns 403 when adminRole does not match user role", async () => {
    await createUser({ email: "rta@test.com", phone: "+910000000097", role: "rta_admin" });

    const res = await request(app)
      .post("/api/auth/admin/signin")
      .send({ email: "rta@test.com", password: TEST_PASSWORD, adminRole: "amc_admin" });

    expect(res.status).toBe(403);
  });
});

// ── GET /api/auth/me ──────────────────────────────────────────────────────────

describe("GET /api/auth/me", () => {
  it("returns user with valid JWT", async () => {
    const user = await createUser();

    const res = await request(app)
      .get("/api/auth/me")
      .set("Authorization", bearerToken(user));

    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe(TEST_EMAIL);
  });

  it("returns 401 without token", async () => {
    const res = await request(app).get("/api/auth/me");
    expect(res.status).toBe(401);
  });

  it("returns 401 with tampered token", async () => {
    const res = await request(app)
      .get("/api/auth/me")
      .set("Authorization", "Bearer invalid.token.here");

    expect(res.status).toBe(401);
  });
});

// ── PATCH /api/auth/change-password ──────────────────────────────────────────

describe("PATCH /api/auth/change-password", () => {
  it("updates password successfully", async () => {
    const user = await createUser();

    const res = await request(app)
      .patch("/api/auth/change-password")
      .set("Authorization", bearerToken(user))
      .send({ currentPassword: TEST_PASSWORD, newPassword: "NewPass@456" });

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/updated/i);
  });

  it("returns 401 when currentPassword is wrong", async () => {
    const user = await createUser();

    const res = await request(app)
      .patch("/api/auth/change-password")
      .set("Authorization", bearerToken(user))
      .send({ currentPassword: "WrongPass@1", newPassword: "NewPass@456" });

    expect(res.status).toBe(401);
  });

  it("returns 400 when newPassword is too short", async () => {
    const user = await createUser();

    const res = await request(app)
      .patch("/api/auth/change-password")
      .set("Authorization", bearerToken(user))
      .send({ currentPassword: TEST_PASSWORD, newPassword: "short" });

    expect(res.status).toBe(400);
  });
});

// ── POST /api/auth/forgot-password ───────────────────────────────────────────

describe("POST /api/auth/forgot-password", () => {
  it("returns 200 without OTP in the response when account exists", async () => {
    await createUser();

    const res = await request(app)
      .post("/api/auth/forgot-password")
      .send({ email: TEST_EMAIL });

    expect(res.status).toBe(200);
    expect(res.body.message).toContain("reset code");
    expect(res.body.devOtp).toBeUndefined();
  });

  it("returns 200 without OTP when account does not exist", async () => {
    const res = await request(app)
      .post("/api/auth/forgot-password")
      .send({ email: "nobody@test.com" });

    expect(res.status).toBe(200);
    expect(res.body.devOtp).toBeUndefined();
  });

  it("returns 400 on invalid email format", async () => {
    const res = await request(app)
      .post("/api/auth/forgot-password")
      .send({ email: "not-an-email" });

    expect(res.status).toBe(400);
  });
});

// ── POST /api/auth/reset-password ────────────────────────────────────────────

describe("POST /api/auth/reset-password", () => {
  it("resets password and allows login with new password", async () => {
    await createUser();

    const resetOtp = await requestPasswordResetOtp(TEST_EMAIL);

    const resetRes = await request(app).post("/api/auth/reset-password").send({
      email: TEST_EMAIL,
      otp: resetOtp,
      newPassword: "ResetPass@789"
    });
    expect(resetRes.status).toBe(200);
    expect(resetRes.body.message).toMatch(/reset/i);

    const loginRes = await request(app)
      .post("/api/auth/signin")
      .send({ email: TEST_EMAIL, password: "ResetPass@789" });
    expect(loginRes.status).toBe(200);
  });

  it("returns 400 on wrong OTP", async () => {
    await createUser();
    await request(app).post("/api/auth/forgot-password").send({ email: TEST_EMAIL });

    const res = await request(app).post("/api/auth/reset-password").send({
      email: TEST_EMAIL,
      otp: "000000",
      newPassword: "ResetPass@789"
    });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/invalid/i);
  });

  it("returns 400 when no forgot-password was requested", async () => {
    // Use a distinct email so no OTP from prior tests leaks into this one
    await createUser({ email: "nootp@test.com", phone: "+919000000001" });

    const res = await request(app).post("/api/auth/reset-password").send({
      email: "nootp@test.com",
      otp: "123456",
      newPassword: "ResetPass@789"
    });

    expect(res.status).toBe(400);
  });

  it("returns 400 for unknown email", async () => {
    const res = await request(app).post("/api/auth/reset-password").send({
      email: "nobody@test.com",
      otp: "123456",
      newPassword: "ResetPass@789"
    });

    expect(res.status).toBe(400);
  });
});
