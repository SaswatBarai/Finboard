import mongoose from "mongoose";

const portfolioHoldingSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    assetType: {
      type: String,
      enum: ["stock", "mutual_fund", "sip"],
      default: "stock",
      index: true
    },
    symbol: { type: String, required: true, uppercase: true },
    name: { type: String, required: true },
    quantity: { type: Number, required: true, min: 0.0001 },
    purchasePrice: { type: Number, required: true },
    currentPrice: { type: Number, required: true },
    totalAmount: { type: Number, required: true },
    orderStatus: {
      type: String,
      enum: ["pending_amc_approval", "successful", "rejected", "sip_active", "sip_paused", "sip_stopped"],
      default: "successful",
      index: true
    },
    folioNumber: { type: String, index: true },
    sipDate: Number,
    sipAmount: Number,
    nextDebitDate: Date,
    amcAccount: {
      bankName: String,
      accountNumber: String,
      ifsc: String,
      accountHolder: String,
      upiId: String
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    }
  },
  { timestamps: true }
);

export const PortfolioHolding = mongoose.model("PortfolioHolding", portfolioHoldingSchema);
