import { processDueVerificationRefunds } from "../services/banking.service.js";
import { bankingConfigured, isPrismaConnectionError, resetPrismaConnection } from "../prisma/client.js";

let intervalId;
let lastConnectionWarningAt = 0;

export function startVerificationRefundJob() {
  if (!bankingConfigured) {
    return;
  }

  if (intervalId) {
    return;
  }

  intervalId = setInterval(async () => {
    try {
      await processDueVerificationRefunds();
    } catch (error) {
      if (isPrismaConnectionError(error)) {
        await resetPrismaConnection();
        const now = Date.now();
        if (now - lastConnectionWarningAt > 60000) {
          lastConnectionWarningAt = now;
          console.warn("Verification refund job paused briefly: PostgreSQL connection was reset. It will retry automatically.");
        }
        return;
      }

      console.error("Verification refund job failed", error);
    }
  }, 30000);
}

export function stopVerificationRefundJob() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
}
