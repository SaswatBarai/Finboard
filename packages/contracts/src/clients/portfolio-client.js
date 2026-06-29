import axios from "axios";
import { getServiceUrls } from "../services/service-urls.js";

let localHandlers = null;

export function registerLocalPortfolioHandler(handlers) {
  localHandlers = handlers;
}

function internalHeaders() {
  return { "x-service-key": process.env.INTERNAL_SERVICE_KEY || "dev-internal-key" };
}

export async function listPortfolioHoldings(userId) {
  const userIdValue = userId?.toString?.() || userId;
  if (localHandlers?.listByUser) return localHandlers.listByUser(userIdValue);

  const { portfolio } = getServiceUrls();
  const { data } = await axios.get(`${portfolio}/internal/portfolio/users/${userIdValue}`, {
    headers: internalHeaders(),
    timeout: 5000
  });
  return data.holdings;
}

export async function createPortfolioHolding(payload) {
  if (localHandlers?.create) return localHandlers.create(payload);

  const { portfolio } = getServiceUrls();
  const { data } = await axios.post(`${portfolio}/internal/portfolio`, payload, {
    headers: internalHeaders(),
    timeout: 5000
  });
  return data.holding;
}

export async function updatePortfolioHolding(id, patch) {
  if (localHandlers?.update) return localHandlers.update(id, patch);

  const { portfolio } = getServiceUrls();
  const { data } = await axios.patch(`${portfolio}/internal/portfolio/${id}`, patch, {
    headers: internalHeaders(),
    timeout: 5000
  });
  return data.holding;
}

export async function listAllPortfolioHoldings() {
  if (localHandlers?.listAll) return localHandlers.listAll();

  const { portfolio } = getServiceUrls();
  const { data } = await axios.get(`${portfolio}/internal/portfolio`, {
    headers: internalHeaders(),
    timeout: 5000
  });
  return data.holdings;
}
