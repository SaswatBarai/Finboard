import { isValidPhoneNumber } from "react-phone-number-input";

export function isValidE164Phone(value) {
  const normalized = String(value || "").trim();
  return Boolean(normalized) && isValidPhoneNumber(normalized);
}
