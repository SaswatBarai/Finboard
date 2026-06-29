import axios from "axios";
import { getServiceUrls } from "../services/service-urls.js";

let localHandler = null;

export function registerLocalIdentityHandler(handler) {
  localHandler = handler;
}

function internalHeaders() {
  return { "x-service-key": process.env.INTERNAL_SERVICE_KEY || "dev-internal-key" };
}

export async function lookupIdentity({ panNumber, aadhaarNumber }) {
  if (localHandler) {
    return localHandler({ panNumber, aadhaarNumber });
  }

  const { identity } = getServiceUrls();
  const { data } = await axios.post(
    `${identity}/internal/identity/lookup`,
    { panNumber, aadhaarNumber },
    { headers: internalHeaders(), timeout: 5000 }
  );
  return data.identity;
}
