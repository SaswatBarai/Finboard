import { describe, expect, it } from "vitest";
import { statusLabel, statusBadgeClass, isKycReviewable } from "@/features/admin/kyc/components/kyc-review-panel";

describe("kyc-review-panel helpers", () => {
  it("maps known statuses to labels", () => {
    expect(statusLabel("pending_admin_review")).toBe("Pending Review");
    expect(statusLabel("approved")).toBe("Approved");
  });

  it("returns badge classes for approved status", () => {
    expect(statusBadgeClass("approved")).toContain("primary-pale");
  });

  it("allows review actions only while pending admin review", () => {
    expect(isKycReviewable("pending_admin_review")).toBe(true);
    expect(isKycReviewable("approved")).toBe(false);
    expect(isKycReviewable("rejected")).toBe(false);
  });
});
