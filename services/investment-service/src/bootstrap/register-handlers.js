import { registerLocalPortfolioHandler } from "@finboard/contracts";
import { PortfolioHolding } from "../modules/investment/models/portfolio-holding.model.js";

export function registerInvestmentHandlers() {
  registerLocalPortfolioHandler({
    listByUser: (userId) => PortfolioHolding.find({ userId }).sort({ createdAt: -1 }),
    listAll: () => PortfolioHolding.find().sort({ createdAt: -1 }).lean(),
    create: (payload) => PortfolioHolding.create(payload),
    update: (id, patch) => PortfolioHolding.findByIdAndUpdate(id, patch, { new: true })
  });
}
