import axios from "axios";
import { getServiceUrls } from "../services/service-urls.js";

let localHandler = null;

export function registerLocalNotificationHandler(handler) {
  localHandler = handler;
}

function internalHeaders() {
  return {
    "x-service-key": process.env.INTERNAL_SERVICE_KEY || "dev-internal-key"
  };
}

export async function notifyUser(userId, title, message, type = "general") {
  const userIdValue = userId?.toString?.() || userId;

  if (localHandler) {
    return localHandler(userIdValue, title, message, type);
  }

  const { notification } = getServiceUrls();

  await axios.post(
    `${notification}/internal/notifications`,
    { userId: userIdValue, title, message, type },
    { headers: internalHeaders(), timeout: 5000 }
  );
}
