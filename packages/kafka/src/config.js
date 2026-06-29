export function getKafkaConfig(overrides = {}) {
  const brokers = (process.env.KAFKA_BROKERS || process.env.KAFKA_BROKER || "")
    .split(",")
    .map((broker) => broker.trim())
    .filter(Boolean);

  return {
    brokers,
    clientId: process.env.KAFKA_CLIENT_ID || overrides.clientId || "finboard",
    enabled: brokers.length > 0
  };
}
