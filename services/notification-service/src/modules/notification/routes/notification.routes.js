import { Router } from "express";
import { AppNotification } from "../models/notification.model.js";
import { getUnreadCount, markAsRead, notifyUser } from "../services/notification.service.js";

export function createNotificationRouter({ requireAuth }) {
  const router = Router();
  router.use(requireAuth);

  router.get("/unread-count", async (req, res, next) => {
    try {
      const count = await getUnreadCount(req.user._id);
      res.json({ count });
    } catch (error) {
      next(error);
    }
  });

  router.get("/", async (req, res, next) => {
    try {
      const notifications = await AppNotification.find({ userId: req.user._id }).sort({ createdAt: -1 }).limit(50);
      res.json({ notifications });
    } catch (error) {
      next(error);
    }
  });

  router.put("/:id/read", async (req, res, next) => {
    try {
      const notification = await markAsRead(req.user._id, req.params.id);
      if (!notification) {
        return res.status(404).json({ message: "Notification not found" });
      }
      res.json({ notification });
    } catch (error) {
      next(error);
    }
  });

  router.delete("/:id", async (req, res, next) => {
    try {
      await AppNotification.deleteOne({ _id: req.params.id, userId: req.user._id });
      res.json({ message: "Notification removed" });
    } catch (error) {
      next(error);
    }
  });

  return router;
}

export function createInternalNotificationRouter({ requireInternalService }) {
  const router = Router();

  router.post("/", requireInternalService, async (req, res, next) => {
    try {
      const { userId, title, message, type, email } = req.body;
      const notification = await notifyUser(userId, title, message, type, { email });
      res.status(201).json({ notification });
    } catch (error) {
      next(error);
    }
  });

  return router;
}
