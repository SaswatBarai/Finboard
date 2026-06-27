import cors from "cors";
import crypto from "node:crypto";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import morgan from "morgan";
import { createProxyMiddleware } from "http-proxy-middleware";
import { apiReference } from "@scalar/express-api-reference";
import { getServiceUrls } from "@finboard/contracts";
import { errorHandler, getServiceEnv, notFound, sanitizeRequest } from "@finboard/shared";
import { loadOpenApiSpec } from "./openapi/load-spec.js";
import { getScalarBundlePath, scalarScriptUrl } from "./openapi/scalar.js";

export function buildGatewayApp() {
  const env = getServiceEnv({ port: 4000, serviceName: "api-gateway" });
  const targets = getServiceUrls();

  const routeTable = [
    { prefix: "/api/auth", target: targets.auth },
    { prefix: "/api/profile", target: targets.profile },
    { prefix: "/api/kyc", target: targets.kyc },
    { prefix: "/api/documents", target: targets.ocr },
    { prefix: "/api/ocr", target: targets.ocr },
    { prefix: "/api/banking", target: targets.banking },
    { prefix: "/api/investments", target: targets.investment },
    { prefix: "/api/notifications", target: targets.notification },
    { prefix: "/api/audit", target: targets.audit },
    { prefix: "/uploads", target: targets.kyc }
  ];

  const app = express();

  app.use((req, res, next) => {
    res.locals.cspNonce = crypto.randomBytes(16).toString("base64");
    next();
  });

  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          baseUri: ["'self'"],
          fontSrc: ["'self'", "https:", "data:"],
          formAction: ["'self'"],
          frameAncestors: ["'self'"],
          frameSrc: ["'self'", "https://*.scalar.com"],
          imgSrc: ["'self'", "data:", "https:", "blob:"],
          objectSrc: ["'none'"],
          scriptSrc: [
            "'self'",
            "https://cdn.jsdelivr.net",
            (req, res) => `'nonce-${res.locals.cspNonce}'`
          ],
          scriptSrcAttr: ["'none'"],
          styleSrc: ["'self'", "https:", "'unsafe-inline'"],
          connectSrc: [
            "'self'",
            "https://*.scalar.com",
            "https://scalar.com",
            "https://proxy.scalar.com",
            "https://agent.scalar.com",
            "https://api.scalar.com",
            "https://registry.scalar.com",
            "https://dashboard.scalar.com",
            "wss://*.scalar.com"
          ],
          workerSrc: ["'self'", "blob:"]
        }
      }
    })
  );
  app.use(
    cors({
      origin(origin, callback) {
        if (!origin || env.clientOrigins.includes(origin)) {
          return callback(null, true);
        }

        const gatewayOrigins = [
          `http://localhost:${env.port}`,
          `http://127.0.0.1:${env.port}`
        ];

        if (gatewayOrigins.includes(origin)) {
          return callback(null, true);
        }

        return callback(new Error(`CORS blocked origin: ${origin}`));
      },
      credentials: true
    })
  );
  app.use(sanitizeRequest);
  app.use(morgan(env.nodeEnv === "production" ? "combined" : "dev"));
  app.use(
    rateLimit({
      windowMs: 60 * 1000,
      limit: env.nodeEnv === "production" ? 100 : 1000,
      standardHeaders: "draft-8",
      legacyHeaders: false
    })
  );

  app.get("/health", (req, res) => {
    res.json({ status: "ok", service: env.serviceName, routes: routeTable });
  });

  app.get("/openapi.json", (req, res) => {
    res.json(loadOpenApiSpec());
  });

  app.get("/docs/scalar.js", (req, res) => {
    res.sendFile(getScalarBundlePath());
  });

  app.use("/docs", (req, res) => {
    const docsConfig = {
      theme: "purple",
      cdn: scalarScriptUrl,
      nonce: res.locals.cspNonce,
      content: loadOpenApiSpec(),
      metaData: {
        title: "Finboard API Reference"
      }
    };

    if (process.env.SCALAR_AGENT_KEY) {
      docsConfig.agent = { key: process.env.SCALAR_AGENT_KEY };
    }

    apiReference(docsConfig)(req, res);
  });

  for (const route of routeTable) {
    app.use(
      route.prefix,
      createProxyMiddleware({
        target: route.target,
        changeOrigin: true,
        pathRewrite: (path) => `${route.prefix}${path}`,
        on: {
          proxyReq(proxyReq) {
            proxyReq.removeHeader("origin");
            proxyReq.removeHeader("referer");
          }
        }
      })
    );
  }

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
