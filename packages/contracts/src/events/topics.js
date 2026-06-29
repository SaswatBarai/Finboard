export const kafkaTopics = {
  kycSubmitted: "kyc.submitted",
  kycApproved: "kyc.approved",
  kycRejected: "kyc.rejected",
  bankVerified: "bank.verified",
  bankTransferCompleted: "bank.transfer.completed",
  orderPlaced: "order.placed",
  orderApproved: "order.approved",
  orderRejected: "order.rejected",
  sipCreated: "sip.created"
};

export function buildDomainEvent({ eventType, action, userId, resourceType, resourceId, details = {} }) {
  return {
    eventType,
    action,
    userId: String(userId),
    resourceType,
    resourceId: String(resourceId),
    details
  };
}
