import { getApiError } from "@/lib/api";

export function getAuthErrorMessage(error) {
  const status = error?.response?.status;
  const message = getApiError(error);

  if (status === 404 && /registered/i.test(message)) {
    return "No account found for this phone number. Create an account first.";
  }

  if (status === 403 && /verification/i.test(message)) {
    return "Phone verification is required. Complete signup or verify your OTP before signing in.";
  }

  if (status === 409 && /pending verification/i.test(message)) {
    return message;
  }

  return message;
}

export function isPendingVerificationConflict(error) {
  return error?.response?.status === 409 && /pending verification/i.test(getApiError(error));
}
