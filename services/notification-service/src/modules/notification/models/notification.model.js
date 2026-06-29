import mongoose from "mongoose";

const appNotificationSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: { type: String, default: "general" },
    read: { type: Boolean, default: false }
  },
  { timestamps: true }
);

export const AppNotification = mongoose.model("AppNotification", appNotificationSchema);
