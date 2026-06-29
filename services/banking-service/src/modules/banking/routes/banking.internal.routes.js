import { Router } from "express";
import { debitForInvestment, getLinkedAccount } from "../services/banking.service.js";

export function createInternalBankingRouter({ requireInternalService }) {
  const router = Router();

  router.get("/accounts/linked/:userId", requireInternalService, async (req, res, next) => {
    try {
      const account = await getLinkedAccount(req.params.userId);
      res.json({ account });
    } catch (error) {
      next(error);
    }
  });

  router.post("/debit/investment", requireInternalService, async (req, res, next) => {
    try {
      const { userId, amount, description, targetAccount } = req.body;
      const result = await debitForInvestment(userId, amount, description, targetAccount);
      res.json(result);
    } catch (error) {
      next(error);
    }
  });

  return router;
}
