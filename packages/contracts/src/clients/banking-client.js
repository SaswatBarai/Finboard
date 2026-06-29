import axios from "axios";
import { getServiceUrls } from "../services/service-urls.js";

let localDebitHandler = null;
let localLinkedAccountHandler = null;

export function registerLocalBankingHandler({ debitForInvestment, getLinkedAccount }) {
  localDebitHandler = debitForInvestment;
  localLinkedAccountHandler = getLinkedAccount;
}

function internalHeaders(token) {
  return {
    Authorization: token ? `Bearer ${token}` : undefined,
    "x-service-key": process.env.INTERNAL_SERVICE_KEY || "dev-internal-key"
  };
}

export async function getLinkedAccount(userId, token) {
  const userIdValue = userId?.toString?.() || userId;

  if (localLinkedAccountHandler) {
    return localLinkedAccountHandler(userIdValue);
  }

  const { banking } = getServiceUrls();
  const { data } = await axios.get(`${banking}/internal/accounts/linked/${userIdValue}`, {
    headers: internalHeaders(token),
    timeout: 5000
  });
  return data.account;
}

export async function debitForInvestment(userId, amount, description, targetAccount, token) {
  if (typeof userId === "object" && userId !== null && "amount" in userId) {
    return debitForInvestmentRequest(userId);
  }

  return debitForInvestmentRequest({ userId, amount, description, targetAccount, token });
}

async function debitForInvestmentRequest({ userId, amount, description, targetAccount, token }) {
  const userIdValue = userId?.toString?.() || userId;

  if (localDebitHandler) {
    return localDebitHandler(userIdValue, amount, description, targetAccount);
  }

  const { banking } = getServiceUrls();
  const { data } = await axios.post(
    `${banking}/internal/debit/investment`,
    { userId: userIdValue, amount, description, targetAccount },
    { headers: internalHeaders(token), timeout: 10000 }
  );
  return data;
}
