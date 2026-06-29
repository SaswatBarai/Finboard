import { AppNotification } from "../models/notification.model.js";
import { sendNotificationEmail } from "./email.service.js";

export async function notifyUser(userId, title, message, type = "general", options = {}) {
  const notification = await AppNotification.create({ userId, title, message, type });

  sendNotificationEmail(userId, title, message, options.email).catch((error) => {
    console.warn("[notification] email send failed:", error.message);
  });

  return notification;
}

export function getUnreadCount(userId) {
  return AppNotification.countDocuments({ userId, read: false });
}

export async function markAsRead(userId, notificationId) {
  const notification = await AppNotification.findOneAndUpdate(
    { _id: notificationId, userId },
    { $set: { read: true } },
    { new: true }
  );

  return notification;
}
