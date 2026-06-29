import { registerLocalAuditHandler } from "@finboard/contracts";
import { writeAuditLog } from "../modules/audit/index.js";

export function registerAuditHandlers() {
  registerLocalAuditHandler(writeAuditLog);
}
