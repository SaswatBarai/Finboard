import crypto from "crypto";
import twilio from "twilio";
import { getServiceEnv } from "@finboard/config";

const otpStore = new Map();
const verifiedPhoneStore = new Map();

function markPhoneVerified(phone) {
  verifiedPhoneStore.set(phone, Date.now() + getServiceEnv().twilio.otpTtlMinutes * 60 * 1000);
}

function consumePhoneVerification(phone) {
  const expiresAt = verifiedPhoneStore.get(phone);

  if (!expiresAt) {
    return false;
  }

  verifiedPhoneStore.delete(phone);
  return Date.now() <= expiresAt;
}

function isTwilioVerifyConfigured() {
  return Boolean(getServiceEnv().twilio.accountSid && (hasApiKeyAuth() || getServiceEnv().twilio.authToken) && getServiceEnv().twilio.verifyServiceSid);
}

function isTwilioMessageConfigured() {
  return Boolean(
    getServiceEnv().twilio.accountSid &&
      (hasApiKeyAuth() || getServiceEnv().twilio.authToken) &&
      (getServiceEnv().twilio.fromPhone || getServiceEnv().twilio.messagingServiceSid)
  );
}

function hasApiKeyAuth() {
  return Boolean(getServiceEnv().twilio.apiKeySid && getServiceEnv().twilio.apiKeySecret);
}

function getClient() {
  if (getServiceEnv().twilio.accountSid && getServiceEnv().twilio.authToken) {
    return twilio(getServiceEnv().twilio.accountSid, getServiceEnv().twilio.authToken);
  }

  return twilio(getServiceEnv().twilio.apiKeySid, getServiceEnv().twilio.apiKeySecret, {
    accountSid: getServiceEnv().twilio.accountSid
  });
}

function createOtp() {
  return String(crypto.randomInt(100000, 999999));
}

function hashOtp(otp) {
  return crypto.createHash("sha256").update(String(otp)).digest("hex");
}

export async function sendPhoneOtp(phone) {
  if (isTwilioVerifyConfigured()) {
    const verification = await getClient().verify.v2.services(getServiceEnv().twilio.verifyServiceSid).verifications.create({
      to: phone,
      channel: "sms"
    });
    return {
      provider: "twilio_verify",
      sid: verification.sid,
      status: verification.status,
      to: verification.to,
      channel: verification.channel
    };
  }

  const otp = createOtp();
  const expiresAt = Date.now() + getServiceEnv().twilio.otpTtlMinutes * 60 * 1000;
  otpStore.set(phone, { otpHash: hashOtp(otp), expiresAt, attempts: 0 });

  if (isTwilioMessageConfigured()) {
    const payload = {
      to: phone,
      body: `Your Finboard verification code is ${otp}. It expires in ${getServiceEnv().twilio.otpTtlMinutes} minutes.`
    };

    if (getServiceEnv().twilio.messagingServiceSid) {
      payload.messagingServiceSid = getServiceEnv().twilio.messagingServiceSid;
    } else {
      payload.from = getServiceEnv().twilio.fromPhone;
    }

    await getClient().messages.create(payload);
    return { provider: "twilio_messages" };
  }

  console.log(`[DEV] Phone OTP for ${phone}: ${otp}`);
  console.warn("Twilio SMS sender is not configured. Add TWILIO_FROM_PHONE or TWILIO_MESSAGING_SERVICE_SID to send real SMS.");
  return {
    provider: "development"
  };
}

export async function verifyPhoneOtp(phone, otp) {
  if (consumePhoneVerification(phone)) {
    return true;
  }

  const result = await verifyPhoneOtpDetailed(phone, otp);
  if (result.approved) {
    consumePhoneVerification(phone);
  }

  return result.approved;
}

export async function verifyPhoneOtpDetailed(phone, otp) {
  if (isTwilioVerifyConfigured()) {
    const result = await getClient().verify.v2.services(getServiceEnv().twilio.verifyServiceSid).verificationChecks.create({
      to: phone,
      code: otp
    });
    const approved = result.status === "approved";
    if (approved) {
      markPhoneVerified(phone);
    }

    return {
      provider: "twilio_verify",
      approved,
      status: result.status,
      sid: result.sid,
      to: result.to
    };
  }

  const record = otpStore.get(phone);
  if (!record) {
    return { provider: "development", approved: false, status: "not_found" };
  }

  if (Date.now() > record.expiresAt) {
    otpStore.delete(phone);
    return { provider: "development", approved: false, status: "expired" };
  }

  record.attempts += 1;
  if (record.attempts > 5) {
    otpStore.delete(phone);
    return { provider: "development", approved: false, status: "too_many_attempts" };
  }

  const valid = record.otpHash === hashOtp(otp);
  if (valid) {
    otpStore.delete(phone);
    markPhoneVerified(phone);
  }

  return { provider: "development", approved: valid, status: valid ? "approved" : "pending" };
}
