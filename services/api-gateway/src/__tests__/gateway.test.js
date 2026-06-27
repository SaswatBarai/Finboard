import { describe, expect, it } from "@jest/globals";
import request from "supertest";

process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "test-jwt-secret-32chars-minimum-ok";
process.env.INTERNAL_SERVICE_KEY = "dev-internal-key";

const { buildGatewayApp } = await import("../app.js");

describe("API Gateway", () => {
  it("GET /health returns service status and routes", async () => {
    const app = buildGatewayApp();
    const response = await request(app).get("/health");

    expect(response.status).toBe(200);
    expect(response.body.status).toBe("ok");
    expect(response.body.service).toBe("api-gateway");
    expect(Array.isArray(response.body.routes)).toBe(true);
    expect(response.body.routes.some((route) => route.prefix === "/api/kyc")).toBe(true);
  });

  it("GET /openapi.json returns OpenAPI document", async () => {
    const app = buildGatewayApp();
    const response = await request(app).get("/openapi.json");

    expect(response.status).toBe(200);
    expect(response.body.openapi).toBe("3.1.0");
    expect(response.body.info.title).toBe("Finboard API");
    expect(response.body.paths["/api/auth/signin"]).toBeDefined();
  });

  it("GET /docs serves Scalar API reference", async () => {
    const app = buildGatewayApp();
    const response = await request(app).get("/docs");

    expect(response.status).toBe(200);
    expect(response.text).toContain("/docs/scalar.js");
    expect(response.text).toContain("Scalar.createApiReference");
  });

  it("GET /docs/scalar.js serves bundled Scalar script", async () => {
    const app = buildGatewayApp();
    const response = await request(app).get("/docs/scalar.js");

    expect(response.status).toBe(200);
    expect(response.headers["content-type"]).toMatch(/javascript/);
  });

  it("allows API requests from the gateway docs origin (Scalar)", async () => {
    const app = buildGatewayApp();
    const response = await request(app)
      .get("/health")
      .set("Origin", "http://localhost:4000");

    expect(response.status).toBe(200);
    expect(response.headers["access-control-allow-origin"]).toBe("http://localhost:4000");
  });
});
