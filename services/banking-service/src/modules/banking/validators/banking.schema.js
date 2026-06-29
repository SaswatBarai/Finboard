import { z } from "zod";

export const verifyBankSchema = z.object({
  accountNumber: z.string().trim().regex(/^\d{12}$/),
  ifsc: z.string().trim().regex(/^[A-Z]{4}0[A-Z0-9]{6}$/i),
  accountHolderName: z.string().trim().min(2).max(100)
});

export const transferSchema = z.object({
  accountNumber: z.string().trim().regex(/^\d{12}$/),
  ifsc: z.string().trim().regex(/^[A-Z]{4}0[A-Z0-9]{6}$/i),
  amount: z.coerce.number().positive(),
  remarks: z.string().trim().max(120).optional()
});

export const beneficiarySchema = z.object({
  accountNumber: z.string().trim().regex(/^\d{12}$/),
  ifsc: z.string().trim().regex(/^[A-Z]{4}0[A-Z0-9]{6}$/i)
});

export const freezeSchema = z.object({
  frozen: z.boolean()
});

export const resetBalanceSchema = z.object({
  balance: z.coerce.number().min(0)
});

