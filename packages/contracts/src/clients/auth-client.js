import axios from "axios";
import { getServiceUrls } from "../services/service-urls.js";

let localHandlers = null;

export function registerLocalAuthHandler(handlers) {
  localHandlers = handlers;
}

function internalHeaders() {
  return {
    "x-service-key": process.env.INTERNAL_SERVICE_KEY || "dev-internal-key"
  };
}

export async function getUserById(userId) {
  const userIdValue = userId?.toString?.() || userId;

  if (localHandlers?.getUserById) {
    return localHandlers.getUserById(userIdValue);
  }

  const { auth } = getServiceUrls();
  const { data } = await axios.get(`${auth}/internal/users/${userIdValue}`, {
    headers: internalHeaders(),
    timeout: 5000
  });
  return data.user;
}

export async function getUsersByIds(ids = []) {
  const normalized = ids.map((id) => id?.toString?.() || id);

  if (localHandlers?.getUsersByIds) {
    return localHandlers.getUsersByIds(normalized);
  }

  const { auth } = getServiceUrls();
  const { data } = await axios.post(
    `${auth}/internal/users/batch`,
    { ids: normalized },
    { headers: internalHeaders(), timeout: 5000 }
  );
  return data.users;
}

export async function listUsersByRole(role) {
  if (localHandlers?.listUsersByRole) {
    return localHandlers.listUsersByRole(role);
  }

  const { auth } = getServiceUrls();
  const { data } = await axios.get(`${auth}/internal/users`, {
    params: role ? { role } : undefined,
    headers: internalHeaders(),
    timeout: 5000
  });
  return data.users;
}
