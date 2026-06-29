import { bankingConfigured } from "../prisma/client.js";

export function requireBankingConfigured(req, res, next) {
  if (!bankingConfigured) {
    return res.status(503).json({
      message: "Banking database is not configured. Add your Supabase PostgreSQL URL to BANK_DATABASE_URL, then run Prisma migrate and seed."
    });
  }

  next();
}

