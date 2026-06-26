export const KYC_APPLICATION_STATUS = {
  PENDING_ADMIN_REVIEW: "pending_admin_review",
  APPROVED: "approved",
  REJECTED: "rejected",
  FAILED: "failed",
  REUPLOAD_REQUESTED: "reupload_requested"
};

const RESUBMITTABLE_STATUSES = new Set([
  KYC_APPLICATION_STATUS.REJECTED,
  KYC_APPLICATION_STATUS.FAILED,
  KYC_APPLICATION_STATUS.REUPLOAD_REQUESTED
]);

export function canSubmitKyc(application) {
  if (!application) {
    return true;
  }

  return RESUBMITTABLE_STATUSES.has(application.status);
}

export function isKycInProgress(status) {
  return status === KYC_APPLICATION_STATUS.PENDING_ADMIN_REVIEW;
}

export function getKycStatusPresentation(application) {
  if (!application) {
    return {
      label: "Not Submitted",
      description: "Submit your PAN and Aadhaar details to start KYC verification.",
      tone: "default"
    };
  }

  const map = {
    [KYC_APPLICATION_STATUS.PENDING_ADMIN_REVIEW]: {
      label: "In Progress",
      description: "Your KYC is under admin review. Please wait for approval before submitting again.",
      tone: "warning"
    },
    [KYC_APPLICATION_STATUS.APPROVED]: {
      label: "Approved",
      description: "Your KYC is approved. You can proceed to banking and investments.",
      tone: "success"
    },
    [KYC_APPLICATION_STATUS.REJECTED]: {
      label: "Rejected",
      description: application.adminRemarks
        ? `Admin remarks: ${application.adminRemarks}. You can submit a new application.`
        : "Admin rejected your KYC. You can submit a new application.",
      tone: "danger"
    },
    [KYC_APPLICATION_STATUS.FAILED]: {
      label: "Verification Failed",
      description:
        application.failureReason ||
        "Automatic checks failed. Correct your details and submit again.",
      tone: "danger"
    },
    [KYC_APPLICATION_STATUS.REUPLOAD_REQUESTED]: {
      label: "Reupload Required",
      description: "Please upload corrected documents and submit again.",
      tone: "warning"
    }
  };

  return (
    map[application.status] || {
      label: application.status.replaceAll("_", " "),
      description: "Review your application status below.",
      tone: "default"
    }
  );
}
