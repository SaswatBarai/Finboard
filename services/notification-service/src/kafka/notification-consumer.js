import { kafkaTopics } from "@finboard/contracts";
import { startConsumer, stopConsumer } from "@finboard/kafka";
import { notifyUser } from "../modules/notification/services/notification.service.js";

const subscribedTopics = [
  kafkaTopics.kycSubmitted,
  kafkaTopics.kycApproved,
  kafkaTopics.kycRejected,
  kafkaTopics.bankVerified,
  kafkaTopics.orderPlaced,
  kafkaTopics.orderApproved,
  kafkaTopics.orderRejected,
  kafkaTopics.sipCreated
];

const notificationTemplates = {
  [kafkaTopics.kycSubmitted]: (event) => ({
    title: "KYC Submitted",
    message: "Your KYC application was submitted and is being processed.",
    type: "kyc"
  }),
  [kafkaTopics.kycApproved]: () => ({
    title: "KYC Approved",
    message: "Your KYC has been approved. You can now invest.",
    type: "kyc"
  }),
  [kafkaTopics.kycRejected]: (event) => ({
    title: "KYC Rejected",
    message: event.details?.remarks || "Your KYC application was rejected.",
    type: "kyc"
  }),
  [kafkaTopics.bankVerified]: () => ({
    title: "Bank Account Verified",
    message: "Your bank account has been verified successfully.",
    type: "banking"
  }),
  [kafkaTopics.orderPlaced]: (event) => ({
    title: "Order Placed",
    message: `Order placed for ${event.details?.symbol || "investment"}.`,
    type: "investment"
  }),
  [kafkaTopics.orderApproved]: (event) => ({
    title: "Order Approved",
    message: `${event.details?.symbol || "Investment"} order approved.`,
    type: "investment"
  }),
  [kafkaTopics.orderRejected]: (event) => ({
    title: "Order Rejected",
    message: `${event.details?.symbol || "Investment"} order rejected.`,
    type: "investment"
  }),
  [kafkaTopics.sipCreated]: (event) => ({
    title: "SIP Created",
    message: `SIP started for ${event.details?.symbol || "fund"}.`,
    type: "investment"
  })
};

let consumer = null;

export async function startNotificationConsumer(log) {
  consumer = await startConsumer({
    groupId: "notification-service",
    topics: subscribedTopics,
    log,
    eachMessage: async ({ topic, event }) => {
      const template = notificationTemplates[topic];
      if (!template || !event.userId) {
        return;
      }

      const { title, message, type } = template(event);
      await notifyUser(event.userId, title, message, type);
    }
  });
}

export async function stopNotificationConsumer() {
  await stopConsumer(consumer);
  consumer = null;
}
