import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { AuditTrail } from "./audit-trail";
import { auditApi } from "../api/audit-api";

vi.mock("../api/audit-api", () => ({
  auditApi: {
    byResource: vi.fn()
  }
}));

function renderWithClient(ui) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } }
  });

  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}

describe("AuditTrail", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders empty audit state", async () => {
    auditApi.byResource.mockResolvedValue([]);

    renderWithClient(<AuditTrail resourceType="kyc" resourceId="demo-id" />);

    expect(await screen.findByText("Audit Trail")).toBeInTheDocument();
    expect(await screen.findByText("No audit events recorded yet.")).toBeInTheDocument();
  });

  it("renders populated entries with action labels and AI score", async () => {
    auditApi.byResource.mockResolvedValue([
      {
        _id: "audit-1",
        action: "KYC_SUBMITTED",
        actorRole: "system",
        createdAt: "2026-06-27T07:33:49.207Z",
        details: {
          status: "pending_admin_review",
          aiVerification: {
            overallScore: 100,
            recommendation: "approve",
            verificationSource: "rules_fallback"
          }
        }
      },
      {
        _id: "audit-2",
        action: "KYC_APPROVED",
        actorRole: "admin",
        actorId: "admin-user-id",
        createdAt: "2026-06-27T07:34:25.962Z",
        details: { remarks: "Looks good" }
      }
    ]);

    renderWithClient(<AuditTrail resourceType="kyc" resourceId="demo-id" />);

    expect(await screen.findByText("KYC Submitted")).toBeInTheDocument();
    expect(await screen.findByText("KYC Approved")).toBeInTheDocument();
    expect(await screen.findByText(/AI score: 100%/)).toBeInTheDocument();
    expect(await screen.findByText(/Remarks: Looks good/)).toBeInTheDocument();
  });

  it("renders error state when audit fetch fails", async () => {
    auditApi.byResource.mockRejectedValue({
      response: { data: { message: "This admin role is not allowed to access this module" } }
    });

    renderWithClient(<AuditTrail resourceType="kyc" resourceId="demo-id" />);

    expect(
      await screen.findByText("This admin role is not allowed to access this module")
    ).toBeInTheDocument();
  });
});
