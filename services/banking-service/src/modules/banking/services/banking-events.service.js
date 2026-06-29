import { buildDomainEvent, kafkaTopics } from "@finboard/contracts";
import { publishEvent } from "@finboard/kafka";

export async function publishBankVerifiedEvent({ userId, account, verification }, log) {
  return publishEvent(
    kafkaTopics.bankVerified,
    buildDomainEvent({
      eventType: kafkaTopics.bankVerified,
      action: "BANK_VERIFIED",
      userId,
      resourceType: "bank_account",
      resourceId: account.id,
      details: {
        accountNumber: account.accountNumber,
        ifsc: account.ifsc,
        verificationId: verification.id,
        status: verification.status
      }
    }),
    log
  );
}
