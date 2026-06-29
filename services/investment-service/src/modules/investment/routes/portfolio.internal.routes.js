import { Router } from "express";
import { PortfolioHolding } from "../models/portfolio-holding.model.js";

export function createInternalPortfolioRouter({ requireInternalService }) {
  const router = Router();

  router.get("/", requireInternalService, async (req, res, next) => {
    try {
      const holdings = await PortfolioHolding.find().sort({ createdAt: -1 }).lean();
      res.json({ holdings });
    } catch (error) {
      next(error);
    }
  });

  router.get("/users/:userId", requireInternalService, async (req, res, next) => {
    try {
      const holdings = await PortfolioHolding.find({ userId: req.params.userId }).sort({ createdAt: -1 });
      res.json({ holdings });
    } catch (error) {
      next(error);
    }
  });

  router.post("/", requireInternalService, async (req, res, next) => {
    try {
      const holding = await PortfolioHolding.create(req.body);
      res.status(201).json({ holding });
    } catch (error) {
      next(error);
    }
  });

  router.patch("/:id", requireInternalService, async (req, res, next) => {
    try {
      const holding = await PortfolioHolding.findByIdAndUpdate(req.params.id, req.body, { new: true });
      if (!holding) return res.status(404).json({ message: "Holding not found" });
      res.json({ holding });
    } catch (error) {
      next(error);
    }
  });

  return router;
}
