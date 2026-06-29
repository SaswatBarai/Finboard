import { sendNotificationEmail as deliverNotificationEmail } from "@finboard/email";
import { getUserById } from "@finboard/contracts";

export async function sendNotificationEmail(userId, title, message, email) {
  const recipient = email || (await getUserById(userId))?.email;
  if (!recipient) {
    return { provider: "skipped", reason: "no_email" };
  }

  const result = await deliverNotificationEmail({
    to: recipient,
    subject: title,
    text: message
  });

  return { provider: result.provider, to: recipient };
}
