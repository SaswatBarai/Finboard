import { config } from "dotenv";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";
import { defineConfig } from "prisma/config";

const serviceRoot = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(serviceRoot, "../../.env") });

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "node prisma/seed.js"
  },
  datasource: {
    url: process.env.BANK_DATABASE_URL
  }
});
