import { Kafka } from "kafkajs";
import { getKafkaConfig } from "./config.js";

export async function startConsumer({ groupId, topics, eachMessage, log }) {
  const config = getKafkaConfig({ clientId: groupId });
  if (!config.enabled) {
    log?.info?.("Kafka disabled — consumer not started");
    return null;
  }

  const kafka = new Kafka({
    clientId: `${config.clientId}-consumer`,
    brokers: config.brokers
  });

  const consumer = kafka.consumer({ groupId });
  await consumer.connect();
  await consumer.subscribe({ topics, fromBeginning: false });
  log?.info?.(`Kafka consumer subscribed: ${topics.join(", ")}`);

  await consumer.run({
    eachMessage: async ({ topic, message }) => {
      if (!message.value) {
        return;
      }

      let event;
      try {
        event = JSON.parse(message.value.toString());
      } catch (error) {
        log?.warn?.(`Invalid Kafka payload on ${topic}: ${error.message}`);
        return;
      }

      await eachMessage({ topic, event });
    }
  });

  return consumer;
}

export async function stopConsumer(consumer) {
  if (!consumer) {
    return;
  }

  await consumer.disconnect().catch(() => {});
}
