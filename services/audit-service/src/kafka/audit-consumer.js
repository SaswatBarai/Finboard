import { startConsumer, stopConsumer } from "@finboard/kafka";
import { kafkaTopics } from "@finboard/contracts";
import { writeAuditLog } from "../modules/audit/services/audit.service.js";

const subscribedTopics = Object.values(kafkaTopics);

let consumer = null;

export async function startAuditConsumer(log) {
  consumer = await startConsumer({
    groupId: "audit-service",
    topics: subscribedTopics,
    log,
    eachMessage: async ({ topic, event }) => {
      await writeAuditLog({
        actorId: event.userId,
        actorRole: "system",
        action: event.action || topic.toUpperCase().replace(/\./g, "_"),
        resourceType: event.resourceType || "unknown",
        resourceId: event.resourceId || event.userId,
        details: {
          eventType: topic,
          ...event.details
        },
        ipAddress: "kafka",
        userAgent: "kafka-consumer"
      });
    }
  });
}

export async function stopAuditConsumer() {
  await stopConsumer(consumer);
  consumer = null;
}
