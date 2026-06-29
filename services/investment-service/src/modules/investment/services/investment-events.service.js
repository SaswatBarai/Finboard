import { buildDomainEvent, kafkaTopics } from "@finboard/contracts";
import { publishEvent } from "@finboard/kafka";

export async function publishOrderPlacedEvent(holding, log) {
  return publishEvent(
    kafkaTopics.orderPlaced,
    buildDomainEvent({
      eventType: kafkaTopics.orderPlaced,
      action: "ORDER_PLACED",
      userId: holding.userId,
      resourceType: "investment",
      resourceId: holding._id || holding.id,
      details: {
        symbol: holding.symbol,
        assetType: holding.assetType,
        quantity: holding.quantity,
        totalAmount: holding.totalAmount,
        orderStatus: holding.orderStatus
      }
    }),
    log
  );
}

export async function publishSipCreatedEvent(holding, log) {
  return publishEvent(
    kafkaTopics.sipCreated,
    buildDomainEvent({
      eventType: kafkaTopics.sipCreated,
      action: "SIP_CREATED",
      userId: holding.userId,
      resourceType: "investment",
      resourceId: holding._id || holding.id,
      details: {
        symbol: holding.symbol,
        sipAmount: holding.sipAmount,
        sipDate: holding.sipDate
      }
    }),
    log
  );
}

export async function publishOrderStatusEvent(holding, status, log) {
  const topic = status === "successful" ? kafkaTopics.orderApproved : status === "rejected" ? kafkaTopics.orderRejected : null;
  if (!topic) {
    return false;
  }

  return publishEvent(
    topic,
    buildDomainEvent({
      eventType: topic,
      action: status === "successful" ? "ORDER_APPROVED" : "ORDER_REJECTED",
      userId: holding.userId,
      resourceType: "investment",
      resourceId: holding._id || holding.id,
      details: {
        symbol: holding.symbol,
        orderStatus: status
      }
    }),
    log
  );
}
