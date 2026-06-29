import { loadEnv } from "@finboard/config";
import { bootstrapService } from "@finboard/service-kit";
import { buildApp } from "./app.js";
import { registerOcrHandlers } from "./bootstrap/register-handlers.js";
registerOcrHandlers();

loadEnv();

start();

async function start() {
  await bootstrapService({
    serviceName: "ocr-service",
    port: 4004,
    createApp: async () => buildApp(),
    
  });
}
