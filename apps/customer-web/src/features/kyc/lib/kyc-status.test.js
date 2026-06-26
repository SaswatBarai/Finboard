import { describe, expect, it } from "vitest";

import {
  canSubmitKyc,
  getKycStatusPresentation,
  isKycInProgress,
  KYC_APPLICATION_STATUS
} from "./kyc-status";

describe("kyc-status", () => {
  it("allows submit when there is no application", () => {
    expect(canSubmitKyc(null)).toBe(true);
  });

  it("blocks submit while pending admin review", () => {
    expect(
      canSubmitKyc({ status: KYC_APPLICATION_STATUS.PENDING_ADMIN_REVIEW })
    ).toBe(false);
    expect(isKycInProgress(KYC_APPLICATION_STATUS.PENDING_ADMIN_REVIEW)).toBe(true);
  });

  it("blocks submit after approval", () => {
    expect(canSubmitKyc({ status: KYC_APPLICATION_STATUS.APPROVED })).toBe(false);
  });

  it("allows resubmit after rejection or failed checks", () => {
    expect(canSubmitKyc({ status: KYC_APPLICATION_STATUS.REJECTED })).toBe(true);
    expect(canSubmitKyc({ status: KYC_APPLICATION_STATUS.FAILED })).toBe(true);
  });

  it("shows in progress messaging for pending review", () => {
    const status = getKycStatusPresentation({
      status: KYC_APPLICATION_STATUS.PENDING_ADMIN_REVIEW
    });

    expect(status.label).toBe("In Progress");
    expect(status.description).toContain("under admin review");
  });
});
