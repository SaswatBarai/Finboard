import axios from "axios";
import { getServiceUrls } from "../services/service-urls.js";

let localHandler = null;
let localVerifyKycHandler = null;

export function registerLocalOcrHandler(handler) {
  localHandler = handler;
}

export function registerLocalVerifyKycHandler(handler) {
  localVerifyKycHandler = handler;
}

function internalHeaders() {
  return { "x-service-key": process.env.INTERNAL_SERVICE_KEY || "dev-internal-key" };
}

export async function processDocumentOcr(filePath, type) {
  if (localHandler) {
    return localHandler(filePath, type);
  }

  const { ocr } = getServiceUrls();
  const { data } = await axios.post(
    `${ocr}/internal/ocr/process`,
    { filePath, type },
    { headers: internalHeaders(), timeout: 60000 }
  );
  return data;
}

export async function verifyKycWithAi(payload) {
  if (localVerifyKycHandler) {
    return localVerifyKycHandler(payload);
  }

  const { ocr } = getServiceUrls();
  const { data } = await axios.post(`${ocr}/internal/ocr/verify-kyc`, payload, {
    headers: internalHeaders(),
    timeout: 90000
  });
  return data;
}
