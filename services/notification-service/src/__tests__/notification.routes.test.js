import { afterAll, beforeAll, beforeEach, describe, expect, it } from "@jest/globals";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import request from "supertest";
import jwt from "jsonwebtoken";

process.env.JWT_SECRET = "test-notification-secret-32chars";
process.env.NODE_ENV = "development";
process.env.INTERNAL_SERVICE_KEY = "dev-internal-key";

import { registerLocalAuthHandler } from "@finboard/contracts";
import { buildApp } from "../app.js";
import { AppNotification } from "../modules/notification/models/notification.model.js";

const TEST_USER_ID = new mongoose.Types.ObjectId();
const TEST_USER_ID_STR = TEST_USER_ID.toString();
const OTHER_USER_ID = new mongoose.Types.ObjectId();

const TEST_USER = {
  id: TEST_USER_ID_STR,
  _id: TEST_USER_ID,
  name: "Notification Tester",
  email: "notify@test.local",
  phone: "+919876540001",
  role: "user"
};

registerLocalAuthHandler({
  getUserById: async (id) => (id === TEST_USER_ID_STR ? TEST_USER : null)
});

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
  await AppNotification.deleteMany({});
});

async function createNotification(overrides = {}) {
  return AppNotification.create({
    userId: TEST_USER_ID,
    title: "Test Alert",
    message: "Something happened",
    type: "general",
    read: false,
    ...overrides
  });
}

describe("GET /api/notifications", () => {
  it("returns 401 without token", async () => {
    const res = await request(app).get("/api/notifications");
    expect(res.status).toBe(401);
  });

  it("lists notifications for the authenticated user", async () => {
    await createNotification();
    await AppNotification.create({
      userId: OTHER_USER_ID,
      title: "Other user",
      message: "hidden"
    });

    const res = await request(app).get("/api/notifications").set("Authorization", bearerToken());

    expect(res.status).toBe(200);
    expect(res.body.notifications).toHaveLength(1);
    expect(res.body.notifications[0].title).toBe("Test Alert");
  });
});

describe("GET /api/notifications/unread-count", () => {
  it("returns unread count for the authenticated user", async () => {
    await createNotification({ read: false });
    await createNotification({ read: true });
    await AppNotification.create({
      userId: OTHER_USER_ID,
      title: "Other",
      message: "hidden",
      read: false
    });

    const res = await request(app).get("/api/notifications/unread-count").set("Authorization", bearerToken());

    expect(res.status).toBe(200);
    expect(res.body.count).toBe(1);
  });
});

describe("PUT /api/notifications/:id/read", () => {
  it("marks an owned notification as read", async () => {
    const notification = await createNotification({ read: false });

    const res = await request(app)
      .put(`/api/notifications/${notification._id}/read`)
      .set("Authorization", bearerToken());

    expect(res.status).toBe(200);
    expect(res.body.notification.read).toBe(true);

    const stored = await AppNotification.findById(notification._id);
    expect(stored.read).toBe(true);
  });

  it("returns 404 for another user's notification", async () => {
    const notification = await AppNotification.create({
      userId: OTHER_USER_ID,
      title: "Other",
      message: "hidden"
    });

    const res = await request(app)
      .put(`/api/notifications/${notification._id}/read`)
      .set("Authorization", bearerToken());

    expect(res.status).toBe(404);
  });
});

describe("DELETE /api/notifications/:id", () => {
  it("deletes an owned notification", async () => {
    const notification = await createNotification();

    const res = await request(app)
      .delete(`/api/notifications/${notification._id}`)
      .set("Authorization", bearerToken());

    expect(res.status).toBe(200);
    expect(await AppNotification.countDocuments()).toBe(0);
  });
});

describe("POST /internal/notifications", () => {
  it("creates a notification via internal route", async () => {
    const res = await request(app)
      .post("/internal/notifications")
      .set(INTERNAL_HEADER)
      .send({
        userId: TEST_USER_ID_STR,
        title: "KYC Approved",
        message: "You can invest now.",
        type: "kyc",
        email: TEST_USER.email
      });

    expect(res.status).toBe(201);
    expect(res.body.notification.title).toBe("KYC Approved");
    expect(res.body.notification.read).toBe(false);
  });

  it("rejects requests without internal service key", async () => {
    const res = await request(app).post("/internal/notifications").send({
      userId: TEST_USER_ID_STR,
      title: "Blocked",
      message: "nope"
    });

    expect(res.status).toBe(403);
  });
});
