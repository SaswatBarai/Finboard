import { readFileSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { parse as parseYaml } from "yaml";

const specPath = join(dirname(fileURLToPath(import.meta.url)), "../../../../docs/openapi.yaml");

let cachedSpec = null;
let cachedMtimeMs = null;

export function loadOpenApiSpec() {
  const { mtimeMs } = statSync(specPath);

  if (!cachedSpec || cachedMtimeMs !== mtimeMs) {
    const source = readFileSync(specPath, "utf8");
    cachedSpec = parseYaml(source);
    cachedMtimeMs = mtimeMs;
  }

  return cachedSpec;
}
