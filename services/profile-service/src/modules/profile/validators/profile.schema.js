import { z } from "zod";

const emptyableDate = z
  .union([z.string().trim().length(0), z.string().datetime(), z.string().regex(/^\d{4}-\d{2}-\d{2}$/)])
  .optional();

export const profileUpdateSchema = z.object({
  fullName: z.string().trim().min(2).max(100).optional(),
  dateOfBirth: emptyableDate,
  pan: z
    .string()
    .trim()
    .regex(/^$|^[A-Z]{5}[0-9]{4}[A-Z]$/i, "PAN must look like ABCDE1234F")
    .optional(),
  mobileNumber: z.string().trim().max(20).optional(),
  emailAddress: z.string().trim().email().optional().or(z.literal("")),
  maritalStatus: z.enum(["", "Single", "Married", "Other"]).optional(),
  gender: z.enum(["", "Male", "Female", "Other", "Prefer not to say"]).optional(),
  incomeRange: z.enum(["", "Below 1 Lac", "1 Lac - 5 Lac", "5 Lac - 10 Lac", "10 Lac - 25 Lac", "Above 25 Lac"]).optional(),
  occupation: z.string().trim().max(80).optional(),
  fatherName: z.string().trim().max(100).optional(),
  motherName: z.string().trim().max(100).optional(),
  address: z
    .object({
      line1: z.string().trim().max(160).optional(),
      line2: z.string().trim().max(160).optional(),
      city: z.string().trim().max(80).optional(),
      state: z.string().trim().max(80).optional(),
      postalCode: z.string().trim().max(12).optional(),
      country: z.string().trim().max(80).optional()
    })
    .optional(),
  bank: z
    .object({
      accountHolderName: z.string().trim().max(100).optional(),
      accountNumberMasked: z.string().trim().max(24).optional(),
      ifsc: z.string().trim().regex(/^$|^[A-Z]{4}0[A-Z0-9]{6}$/i, "Invalid IFSC").optional(),
      bankName: z.string().trim().max(100).optional()
    })
    .optional()
});

