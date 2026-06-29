import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import morgan from "morgan";
import { errorHandler, notFound } from "../middleware/error-handler.js";
import { sanitizeRequest } from "../middleware/sanitize.js";

export function createServiceApp({ serviceName, clientOrigins = [], routes = [], staticDirs = [] }) {
  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin(origin, callback) {
        if (!origin || clientOrigins.includes(origin)) {
          return callback(null, true);
        }
        return callback(new Error(`CORS blocked origin: ${origin}`));
      },
      credentials: true
    })
  );
  app.use(express.json({ limit: "1mb" }));
  app.use(sanitizeRequest);
  app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));
  app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000,
      limit: process.env.NODE_ENV === "production" ? 100 : 1000,
      standardHeaders: "draft-8",
      legacyHeaders: false,
      skip: (req) => req.path.startsWith("/internal") || req.path === "/health"
    })
  );

  app.get("/health", (req, res) => {
    res.json({ status: "ok", service: serviceName });
  });

  for (const { path, dir } of staticDirs) {
    app.use(path, express.static(dir));
  }

  for (const { path, router } of routes) {
    app.use(path, router);
  }

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
