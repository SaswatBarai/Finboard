import crypto from "crypto";
import nodemailer from "nodemailer";
import { getServiceEnv } from "@finboard/config";

const emailOtpStore = new Map();

function isSmtpConfigured() {
  const { smtp } = getServiceEnv();
  return Boolean(smtp.host && smtp.user && smtp.pass);
}

function createOtp() {
  return String(crypto.randomInt(100000, 999999));
}

function hashOtp(otp) {
  return crypto.createHash("sha256").update(String(otp)).digest("hex");
}

export async function sendPasswordResetOtp(email) {
  const env = getServiceEnv();
  const key = email.toLowerCase();
  const otp = createOtp();

  emailOtpStore.set(key, {
    otpHash: hashOtp(otp),
    expiresAt: Date.now() + 10 * 60 * 1000
  });

  if (isSmtpConfigured()) {
    const transport = nodemailer.createTransport({
      host: env.smtp.host,
      port: env.smtp.port,
      secure: env.smtp.secure,
      auth: { user: env.smtp.user, pass: env.smtp.pass }
    });
    await transport.sendMail({
      from: env.smtp.from,
      to: email,
      subject: "Finboard: Password Reset Code",
      text: `Your Finboard password reset code is ${otp}. It expires in 10 minutes.`,
      html: `<p>Your Finboard password reset code is <strong>${otp}</strong>. It expires in 10 minutes.</p>`
    });
    return { provider: "smtp" };
  }

  console.log(`[DEV] Password reset OTP for ${email}: ${otp}`);
  return {
    provider: "development"
  };
}

export function verifyPasswordResetOtp(email, otp) {
  const key = email.toLowerCase();
  const record = emailOtpStore.get(key);
  if (!record) return { valid: false, reason: "not_found" };
  if (Date.now() > record.expiresAt) {
    emailOtpStore.delete(key);
    return { valid: false, reason: "expired" };
  }
  const valid = record.otpHash === hashOtp(otp);
  if (valid) emailOtpStore.delete(key);
  return { valid, reason: valid ? "ok" : "invalid" };
}
