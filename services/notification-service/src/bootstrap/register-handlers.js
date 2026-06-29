import { registerLocalNotificationHandler } from "@finboard/contracts";
import { notifyUser } from "../modules/notification/index.js";

export function registerNotificationHandlers() {
  registerLocalNotificationHandler(notifyUser);
}
