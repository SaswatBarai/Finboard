import { z } from "zod";

// ── PAN structural checksum ───────────────────────────────────────────────────

// 4th character encodes the taxpayer entity type — invalid type = invalid PAN
const VALID_TAXPAYER_TYPES = new Set(["P", "C", "H", "F", "A", "T", "B", "L", "J", "G"]);

export function isValidPan(pan) {
  const upper = pan.toUpperCase().trim();
  if (!/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(upper)) return false;
  return VALID_TAXPAYER_TYPES.has(upper[3]);
}

// ── Aadhaar Verhoeff check digit (UIDAI spec) ────────────────────────────────

const VERHOEFF_D = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  [1, 2, 3, 4, 0, 6, 7, 8, 9, 5],
  [2, 3, 4, 0, 1, 7, 8, 9, 5, 6],
  [3, 4, 0, 1, 2, 8, 9, 5, 6, 7],
  [4, 0, 1, 2, 3, 9, 5, 6, 7, 8],
  [5, 9, 8, 7, 6, 0, 4, 3, 2, 1],
  [6, 5, 9, 8, 7, 1, 0, 4, 3, 2],
  [7, 6, 5, 9, 8, 2, 1, 0, 4, 3],
  [8, 7, 6, 5, 9, 3, 2, 1, 0, 4],
  [9, 8, 7, 6, 5, 4, 3, 2, 1, 0],
];

const VERHOEFF_P = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  [1, 5, 7, 6, 2, 8, 3, 0, 9, 4],
  [5, 8, 0, 3, 7, 9, 6, 1, 4, 2],
  [8, 9, 1, 6, 0, 4, 3, 5, 2, 7],
  [9, 4, 5, 3, 1, 2, 6, 8, 7, 0],
  [4, 2, 8, 6, 5, 7, 3, 9, 0, 1],
  [2, 7, 9, 3, 8, 0, 6, 4, 1, 5],
  [7, 0, 4, 6, 9, 1, 3, 2, 5, 8],
];

export function isValidAadhaarVerhoeff(aadhaar) {
  if (!/^\d{12}$/.test(aadhaar)) return false;
  const digits = aadhaar.split("").map(Number).reverse();
  let c = 0;
  for (let i = 0; i < digits.length; i++) {
    c = VERHOEFF_D[c][VERHOEFF_P[i % 8][digits[i]]];
  }
  return c === 0;
}

// ── Zod schemas ───────────────────────────────────────────────────────────────

export const submitKycSchema = z.object({
  name: z.string().trim().min(2).max(100),
  panNumber: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z]{5}[0-9]{4}[A-Z]$/, "Invalid PAN format")
    .refine((v) => isValidPan(v), "PAN taxpayer type is invalid"),
  aadhaarNumber: z
    .string()
    .trim()
    .regex(/^\d{12}$/, "Aadhaar must be exactly 12 digits")
    .refine((v) => isValidAadhaarVerhoeff(v), "Aadhaar check digit is invalid")
});

// Approve: remarks optional (admin may leave a note)
export const reviewKycSchema = z.object({
  remarks: z.string().trim().max(500).optional()
});

// Reject: remarks required — user must know why
export const rejectKycSchema = z.object({
  remarks: z
    .string({ required_error: "Rejection remarks are required" })
    .trim()
    .min(10, "Remarks must be at least 10 characters")
    .max(500, "Remarks must not exceed 500 characters")
});
