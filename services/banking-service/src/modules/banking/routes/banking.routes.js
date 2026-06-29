import { Router } from "express";
import {
  createBeneficiary,
  deleteNotification,
  freezeAccount,
  getAccount,
  getAdminTransactions,
  getAdminUsers,
  getDemoAccounts,
  getLinkedAccounts,
  getNotifications,
  lookupBankAccount,
  removeLinkedAccount,
  getTransactions,
  resetBalance,
  transfer,
  verifyBank
} from "../controllers/banking.controller.js";
import { requireAuth, requireRole } from "@finboard/contracts";
import { validate } from "@finboard/shared";
import { requireBankingConfigured } from "../middleware/require-banking-configured.middleware.js";
import { beneficiarySchema, freezeSchema, resetBalanceSchema, transferSchema, verifyBankSchema } from "../validators/banking.schema.js";

export const bankingRouter = Router();

const customerBanking = requireRole("user");
const bankingAdmin = requireRole("admin");

bankingRouter.use(requireAuth);
bankingRouter.use(requireBankingConfigured);

bankingRouter.get("/demo-accounts", customerBanking, getDemoAccounts);
bankingRouter.get("/account", customerBanking, getAccount);
bankingRouter.get("/accounts", customerBanking, getLinkedAccounts);
bankingRouter.get("/balance", customerBanking, getAccount);
bankingRouter.get("/lookup/:accountNumber", customerBanking, lookupBankAccount);
bankingRouter.delete("/accounts/:id", customerBanking, removeLinkedAccount);
bankingRouter.post("/verify-bank", customerBanking, validate(verifyBankSchema), verifyBank);
bankingRouter.post("/beneficiary", customerBanking, validate(beneficiarySchema), createBeneficiary);
bankingRouter.post("/transfer", customerBanking, validate(transferSchema), transfer);
bankingRouter.get("/transactions", customerBanking, getTransactions);
bankingRouter.get("/notifications", customerBanking, getNotifications);
bankingRouter.delete("/notifications/:id", customerBanking, deleteNotification);

bankingRouter.get("/admin/users", bankingAdmin, getAdminUsers);
bankingRouter.get("/admin/transactions", bankingAdmin, getAdminTransactions);
bankingRouter.patch("/admin/users/:id/freeze", bankingAdmin, validate(freezeSchema), freezeAccount);
bankingRouter.patch("/admin/users/:id/reset-balance", bankingAdmin, validate(resetBalanceSchema), resetBalance);
