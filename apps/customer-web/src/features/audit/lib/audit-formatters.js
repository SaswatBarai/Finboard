export const ACTION_LABELS = {
  KYC_SUBMITTED: "KYC Submitted",
  KYC_APPROVED: "KYC Approved",
  KYC_REJECTED: "KYC Rejected"
};

export function actionLabel(action) {
  return ACTION_LABELS[action] || action;
}

export function actionTone(action) {
  if (action === "KYC_APPROVED") {
    return "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400";
  }
  if (action === "KYC_REJECTED") {
    return "border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-400";
  }
  return "border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-400";
}

export function formatActor(entry) {
  const role = entry.actorRole || "system";
  if (entry.actorId && role !== "system") {
    return `${role} (${String(entry.actorId).slice(-8)})`;
  }
  return role;
}

export function formatDetailsSummary(details) {
  if (!details || typeof details !== "object") {
    return null;
  }

  const parts = [];
  if (details.status) parts.push(`Status: ${details.status}`);
  if (details.remarks) parts.push(`Remarks: ${details.remarks}`);
  if (details.checks) parts.push("Automated checks captured");

  return parts.length ? parts.join(" · ") : null;
}

export function formatAiVerificationSummary(aiVerification) {
  if (!aiVerification || typeof aiVerification !== "object") {
    return null;
  }

  const parts = [];
  if (aiVerification.overallScore != null) {
    parts.push(`AI score: ${aiVerification.overallScore}%`);
  }
  if (aiVerification.recommendation) {
    parts.push(`Recommendation: ${aiVerification.recommendation}`);
  }
  if (aiVerification.verificationSource) {
    parts.push(`Source: ${aiVerification.verificationSource}`);
  }

  return parts.length ? parts.join(" · ") : null;
}
