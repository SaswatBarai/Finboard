export { SERVICE_PORTS, getServiceUrls } from "./services/service-urls.js";
export { registerLocalNotificationHandler, notifyUser } from "./clients/notification-client.js";
export { registerLocalAuditHandler, auditEvent, audit } from "./clients/audit-client.js";
export {
  registerLocalProfileHandler,
  createInitialProfile,
  getProfileByUserId,
  updateProfileKycStatus
} from "./clients/profile-client.js";
export { registerLocalAuthHandler, getUserById, getUsersByIds, listUsersByRole } from "./clients/auth-client.js";
export { registerLocalBankingHandler, debitForInvestment, getLinkedAccount } from "./clients/banking-client.js";
export {
  registerLocalOcrHandler,
  registerLocalVerifyKycHandler,
  processDocumentOcr,
  verifyKycWithAi
} from "./clients/ocr-client.js";
export { registerLocalIdentityHandler, lookupIdentity } from "./clients/identity-client.js";
export {
  registerLocalPortfolioHandler,
  listPortfolioHoldings,
  createPortfolioHolding,
  updatePortfolioHolding,
  listAllPortfolioHoldings
} from "./clients/portfolio-client.js";
export { kafkaTopics, buildDomainEvent } from "./events/topics.js";
export { kycSubmittedEventSchema } from "./events/kyc-events.js";
export { requireAuth, requireAdmin, requireRole } from "./middleware/auth.middleware.js";
