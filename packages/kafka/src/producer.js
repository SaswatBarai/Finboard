import { Kafka } from "kafkajs";
import { getKafkaConfig } from "./config.js";

let producer = null;
let producerClientId = null;

export function isKafkaEnabled() {
  return getKafkaConfig().enabled;
}

export async function getProducer(log) {
  const config = getKafkaConfig();
  if (!config.enabled) {
    return null;
  }

  if (!producer || producerClientId !== config.clientId) {
    if (producer) {
      await producer.disconnect().catch(() => {});
    }

    const kafka = new Kafka({
      clientId: config.clientId,
      brokers: config.brokers
    });
    producer = kafka.producer();
    producerClientId = config.clientId;
    await producer.connect();
    log?.info?.("Kafka producer connected");
  }

  return producer;
}

export async function publishEvent(topic, event, log) {
  const activeProducer = await getProducer(log);
  if (!activeProducer) {
    return false;
  }

  const payload = {
    ...event,
    occurredAt: event.occurredAt || new Date().toISOString()
  };

  await activeProducer.send({
    topic,
    messages: [
      {
        key: String(event.resourceId || event.userId || ""),
        value: JSON.stringify(payload)
      }
    ]
  });

  return true;
}

export async function disconnectProducer() {
  if (!producer) {
    return;
  }

  await producer.disconnect().catch(() => {});
  producer = null;
  producerClientId = null;
}
