import { registerLocalOcrHandler, registerLocalVerifyKycHandler } from "@finboard/contracts";
import { processDocument } from "../modules/ocr/index.js";
import { verifyKycIdentity } from "../modules/ocr/services/kyc-verification.service.js";

export function registerOcrHandlers() {
  registerLocalOcrHandler(processDocument);
  registerLocalVerifyKycHandler(verifyKycIdentity);
}
