import { Router } from "express";
import { DummyIdentity } from "../models/dummy-identity.model.js";

export function createInternalIdentityRouter({ requireInternalService }) {
  const router = Router();

  router.post("/lookup", requireInternalService, async (req, res, next) => {
    try {
      const { panNumber, aadhaarNumber } = req.body;
      const identity = await DummyIdentity.findOne({ panNumber, aadhaarNumber }).lean();
      res.json({ identity });
    } catch (error) {
      next(error);
    }
  });

  return router;
}
