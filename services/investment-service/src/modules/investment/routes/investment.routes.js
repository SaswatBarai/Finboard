import { Router } from "express";
import { requireAuth, requireRole } from "@finboard/contracts";
import { isKafkaEnabled } from "@finboard/kafka";
import { validate } from "@finboard/shared";
import {
  listPortfolioHoldings,
  createPortfolioHolding,
  updatePortfolioHolding,
  listAllPortfolioHoldings,
  notifyUser,
  debitForInvestment,
  getLinkedAccount,
  getProfileByUserId,
  listUsersByRole
} from "@finboard/contracts";
import { buyStockSchema, createSipSchema } from "../validators/investment.schema.js";
import {
  publishOrderPlacedEvent,
  publishOrderStatusEvent,
  publishSipCreatedEvent
} from "../services/investment-events.service.js";

export const investmentRouter = Router();

investmentRouter.use(requireAuth);

const defaultAmcAccount = {
  bankName: "HDFC Bank",
  accountNumber: "AMC0001002001",
  ifsc: "HDFC0007777",
  accountHolder: "Finboard Asset Management Collection",
  upiId: "finboardamc@hdfcbank"
};

function createFolioNumber(symbol) {
  return `FBN-${String(symbol || "MF").toUpperCase()}-${Date.now().toString().slice(-8)}`;
}

function nextSipDate(day) {
  const now = new Date();
  const candidate = new Date(now.getFullYear(), now.getMonth(), day);
  if (candidate <= now) {
    candidate.setMonth(candidate.getMonth() + 1);
  }
  return candidate;
}

async function ensureInvestmentEligibility(userId) {
  const profile = await getProfileByUserId(userId.toString());
  if (profile?.kycStatus !== "approved") {
    throw Object.assign(new Error("Complete KYC approval before investing"), { statusCode: 403 });
  }

  const bankAccount = await getLinkedAccount(userId.toString());
  if (!bankAccount) {
    throw Object.assign(new Error("Complete bank verification before investing"), { statusCode: 400 });
  }

  return { profile, bankAccount };
}

investmentRouter.get("/portfolio", async (req, res, next) => {
  try {
    const holdings = await listPortfolioHoldings(req.user._id);
    res.json({ holdings });
  } catch (error) {
    next(error);
  }
});

investmentRouter.post("/buy", validate(buyStockSchema), async (req, res, next) => {
  try {
    await ensureInvestmentEligibility(req.user._id);

    const assetType = req.body.assetType || "stock";
    const totalAmount = req.body.price * req.body.quantity;
    const targetAccount = req.body.amcAccount || defaultAmcAccount;
    await debitForInvestment(
      req.user._id.toString(),
      totalAmount,
      `${assetType === "mutual_fund" ? "Mutual fund" : "Stock"} investment: ${req.body.quantity} ${req.body.symbol.toUpperCase()} routed to ${targetAccount.accountHolder}`,
      targetAccount
    );

    const holding = await createPortfolioHolding({
      userId: req.user._id,
      assetType,
      symbol: req.body.symbol.toUpperCase(),
      name: req.body.name,
      quantity: req.body.quantity,
      purchasePrice: req.body.price,
      currentPrice: req.body.price,
      totalAmount,
      orderStatus: assetType === "mutual_fund" ? "pending_amc_approval" : "successful",
      folioNumber: assetType === "mutual_fund" ? createFolioNumber(req.body.symbol) : undefined,
      amcAccount: targetAccount,
      metadata: req.body.metadata || {}
    });

    if (!isKafkaEnabled()) {
      await notifyUser(
        req.user._id,
        assetType === "mutual_fund" ? "Mutual Fund Order Placed" : "Stock Purchased",
        `${assetType === "mutual_fund" ? "Placed order for" : "Purchased"} ${req.body.quantity} ${req.body.symbol.toUpperCase()} units for Rs. ${totalAmount.toFixed(2)}.`,
        "investment"
      );
    }
    await publishOrderPlacedEvent(holding, req.log);
    res.status(201).json({ holding });
  } catch (error) {
    next(error);
  }
});

investmentRouter.post("/sip", validate(createSipSchema), async (req, res, next) => {
  try {
    await ensureInvestmentEligibility(req.user._id);

    const targetAccount = req.body.amcAccount || defaultAmcAccount;
    const units = req.body.monthlyAmount / req.body.nav;
    await debitForInvestment(
      req.user._id.toString(),
      req.body.monthlyAmount,
      `SIP first installment: ${req.body.symbol.toUpperCase()} routed to ${targetAccount.accountHolder}`,
      targetAccount
    );

    const holding = await createPortfolioHolding({
      userId: req.user._id,
      assetType: "sip",
      symbol: req.body.symbol.toUpperCase(),
      name: req.body.name,
      quantity: units,
      purchasePrice: req.body.nav,
      currentPrice: req.body.nav,
      totalAmount: req.body.monthlyAmount,
      orderStatus: "sip_active",
      folioNumber: createFolioNumber(req.body.symbol),
      sipDate: req.body.sipDate,
      sipAmount: req.body.monthlyAmount,
      nextDebitDate: nextSipDate(req.body.sipDate),
      amcAccount: targetAccount,
      metadata: req.body.metadata || {}
    });

    if (!isKafkaEnabled()) {
      await notifyUser(req.user._id, "SIP Created", `SIP of Rs. ${req.body.monthlyAmount} started for ${req.body.name}.`, "investment");
    }
    await publishSipCreatedEvent(holding, req.log);
    res.status(201).json({ holding });
  } catch (error) {
    next(error);
  }
});

investmentRouter.get("/admin/overview", requireRole("admin", "rta_admin", "amc_admin"), async (req, res, next) => {
  try {
    const [holdings, investors] = await Promise.all([listAllPortfolioHoldings(), listUsersByRole("user")]);

    const investorMap = new Map(investors.map((user) => [user.id || user._id?.toString(), user]));
    const enriched = holdings.map((holding) => ({
      ...holding,
      investor: investorMap.get(String(holding.userId)) || null
    }));

    const totalAum = holdings.reduce((sum, holding) => sum + Number(holding.currentPrice || 0) * Number(holding.quantity || 0), 0);
    const sipBook = holdings.filter((holding) => holding.assetType === "sip").reduce((sum, holding) => sum + Number(holding.sipAmount || 0), 0);
    const mutualFundAum = holdings
      .filter((holding) => ["mutual_fund", "sip"].includes(holding.assetType))
      .reduce((sum, holding) => sum + Number(holding.currentPrice || 0) * Number(holding.quantity || 0), 0);
    const stockAum = totalAum - mutualFundAum;

    res.json({
      summary: {
        totalAum,
        mutualFundAum,
        stockAum,
        sipBook,
        totalInvestors: investors.length,
        activeFunds: new Set(holdings.filter((holding) => holding.assetType !== "stock").map((holding) => holding.symbol)).size,
        totalOrders: holdings.length,
        pendingOrders: holdings.filter((holding) => holding.orderStatus === "pending_amc_approval").length
      },
      holdings: enriched
    });
  } catch (error) {
    next(error);
  }
});

investmentRouter.patch("/admin/orders/:id/status", requireRole("admin", "amc_admin"), async (req, res, next) => {
  try {
    const allowed = ["successful", "rejected", "pending_amc_approval", "sip_active", "sip_paused", "sip_stopped"];
    if (!allowed.includes(req.body.status)) {
      return res.status(400).json({ message: "Invalid order status" });
    }

    const holding = await updatePortfolioHolding(req.params.id, { orderStatus: req.body.status });
    if (!holding) {
      return res.status(404).json({ message: "Investment order not found" });
    }

    if (!isKafkaEnabled()) {
      await notifyUser(holding.userId, "Investment Order Updated", `${holding.name} status changed to ${req.body.status}.`, "investment");
    }
    await publishOrderStatusEvent(holding, req.body.status, req.log);
    res.json({ holding });
  } catch (error) {
    next(error);
  }
});
