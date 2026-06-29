export const SERVICE_PORTS = {
  gateway: 4000,
  auth: 4001,
  profile: 4002,
  kyc: 4003,
  document: 4004,
  banking: 4005,
  investment: 4006,
  notification: 4007,
  audit: 4008
};

export function getServiceUrls() {
  const host = process.env.SERVICE_HOST || "127.0.0.1";
  const url = (envKey, port) => process.env[envKey] || `http://${host}:${port}`;

  return {
    gateway: url("GATEWAY_URL", SERVICE_PORTS.gateway),
    auth: url("AUTH_SERVICE_URL", SERVICE_PORTS.auth),
    profile: url("PROFILE_SERVICE_URL", SERVICE_PORTS.profile),
    kyc: url("KYC_SERVICE_URL", SERVICE_PORTS.kyc),
    document: url("DOCUMENT_SERVICE_URL", SERVICE_PORTS.document),
    ocr: url("DOCUMENT_SERVICE_URL", SERVICE_PORTS.document),
    banking: url("BANKING_SERVICE_URL", SERVICE_PORTS.banking),
    investment: url("INVESTMENT_SERVICE_URL", SERVICE_PORTS.investment),
    notification: url("NOTIFICATION_SERVICE_URL", SERVICE_PORTS.notification),
    audit: url("AUDIT_SERVICE_URL", SERVICE_PORTS.audit)
  };
}
