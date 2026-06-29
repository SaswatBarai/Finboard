import { Resend } from "resend";
import { getServiceEnv } from "@finboard/config";
import { buildNotificationEmailHtml, buildOtpEmailHtml } from "./templates.js";

export function isResendConfigured() {
  const { resend } = getServiceEnv();
  return Boolean(resend.apiKey && resend.from);
}

function getResendClient() {
  const { resend } = getServiceEnv();
  if (!isResendConfigured()) {
    return null;
  }

  return new Resend(resend.apiKey);
}

export async function sendEmail({ to, subject, text, html }) {
  const bodyHtml = html || `<p>${text}</p>`;
  const resend = getResendClient();

  if (resend) {
    const { error } = await resend.emails.send({
      from: getServiceEnv().resend.from,
      to,
      subject,
      text,
      html: bodyHtml
    });

    if (error) {
      throw new Error(error.message || "Resend failed to send email");
    }

    return { provider: "resend", to };
  }

  console.log(`[DEV] Email to ${to}: ${subject} — ${text}`);
  return { provider: "development", to };
}

export async function sendOtpEmail({
  to,
  otp,
  ttlMinutes,
  purpose = "verification",
  name
}) {
  const greetingName = name ? `Hi ${name},` : "Hi,";
  const configs = {
    verification: {
      title: "Verify your Finboard account",
      greeting: `${greetingName} use the code below to verify your account and continue onboarding.`,
      text: `Your Finboard verification code is ${otp}. It expires in ${ttlMinutes} minutes.`,
      footer: null
    },
    login: {
      title: "Your Finboard sign-in code",
      greeting: `${greetingName} use the code below to sign in to your Finboard account.`,
      text: `Your Finboard sign-in code is ${otp}. It expires in ${ttlMinutes} minutes.`,
      footer: null
    },
    password_reset: {
      title: "Reset your Finboard password",
      greeting: `${greetingName} use the code below to reset your password.`,
      text: `Your Finboard password reset code is ${otp}. It expires in ${ttlMinutes} minutes.`,
      footer: "If you did not request a password reset, secure your account by changing your password."
    }
  };

  const config = configs[purpose] || configs.verification;
  const html = buildOtpEmailHtml({
    title: config.title,
    greeting: config.greeting,
    otp,
    ttlMinutes,
    footer: config.footer
  });

  const result = await sendEmail({
    to,
    subject: config.title,
    text: config.text,
    html
  });

  return { ...result, purpose };
}

export async function sendNotificationEmail({ to, subject, text }) {
  return sendEmail({
    to,
    subject,
    text,
    html: buildNotificationEmailHtml({ title: subject, body: text })
  });
}
