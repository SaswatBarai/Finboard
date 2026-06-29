import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

let loaded = false;

export function loadEnv() {
  if (loaded) return;
  const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
  dotenv.config({ path: resolve(root, ".env") });
  loaded = true;
}
