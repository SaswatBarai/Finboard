import axios from "axios";
import { getServiceUrls } from "../services/service-urls.js";

let localHandlers = null;

export function registerLocalProfileHandler(handlers) {
  localHandlers = handlers;
}

function internalHeaders() {
  return {
    "x-service-key": process.env.INTERNAL_SERVICE_KEY || "dev-internal-key"
  };
}

export async function createInitialProfile({ userId, fullName, mobileNumber, emailAddress }) {
  const userIdValue = userId?.toString?.() || userId;

  if (localHandlers?.createInitialProfile) {
    return localHandlers.createInitialProfile({ userId: userIdValue, fullName, mobileNumber, emailAddress });
  }

  const { profile } = getServiceUrls();
  const { data } = await axios.post(
    `${profile}/internal/profile`,
    { userId: userIdValue, fullName, mobileNumber, emailAddress },
    { headers: internalHeaders(), timeout: 5000 }
  );
  return data.profile;
}

export async function getProfileByUserId(userId) {
  const userIdValue = userId?.toString?.() || userId;

  if (localHandlers?.getProfileByUserId) {
    return localHandlers.getProfileByUserId(userIdValue);
  }

  const { profile } = getServiceUrls();
  const { data } = await axios.get(`${profile}/internal/profile/${userIdValue}`, {
    headers: internalHeaders(),
    timeout: 5000
  });
  return data.profile;
}

export async function updateProfileKycStatus(userId, patch) {
  const userIdValue = userId?.toString?.() || userId;

  if (localHandlers?.updateProfileKycStatus) {
    return localHandlers.updateProfileKycStatus(userIdValue, patch);
  }

  const { profile } = getServiceUrls();
  const { data } = await axios.patch(`${profile}/internal/profile/${userIdValue}/kyc-status`, patch, {
    headers: internalHeaders(),
    timeout: 5000
  });
  return data.profile;
}
