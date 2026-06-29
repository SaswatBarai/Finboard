import { Router } from "express";
import { UserProfile } from "../models/profile.model.js";

export function createInternalProfileRouter({ requireInternalService }) {
  const router = Router();

  router.post("/", requireInternalService, async (req, res, next) => {
    try {
      const { userId, fullName, mobileNumber, emailAddress } = req.body;
      const profile = await UserProfile.create({
        userId,
        fullName,
        mobileNumber,
        emailAddress
      });
      res.status(201).json({ profile });
    } catch (error) {
      next(error);
    }
  });

  router.get("/:userId", requireInternalService, async (req, res, next) => {
    try {
      const profile = await UserProfile.findOne({ userId: req.params.userId });
      if (!profile) {
        return res.status(404).json({ message: "Profile not found" });
      }
      res.json({ profile });
    } catch (error) {
      next(error);
    }
  });

  router.patch("/:userId/kyc-status", requireInternalService, async (req, res, next) => {
    try {
      const profile = await UserProfile.findOneAndUpdate(
        { userId: req.params.userId },
        { $set: req.body },
        { upsert: true, new: true }
      );
      res.json({ profile });
    } catch (error) {
      next(error);
    }
  });

  return router;
}
