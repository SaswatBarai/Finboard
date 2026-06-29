import { Prisma } from "../../../../generated/prisma/index.js";

const { Decimal } = Prisma;

export const VERIFICATION_AMOUNT = new Decimal("2.00");

export function toDecimal(value) {
  return new Decimal(value);
}

export function formatMoney(value) {
  return Number(value).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

export function generateTransactionRef(prefix = "TXN") {
  const random = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `${prefix}${Date.now()}${random}`;
}

