import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AuditTrail } from "./audit-trail";

vi.mock("../api/audit-api", () => ({
  auditApi: {
    byResource: vi.fn().mockResolvedValue([])
  }
}));

function renderWithClient(ui) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } }
  });

  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}

describe("AuditTrail", () => {
  it("renders empty audit state", async () => {
    renderWithClient(<AuditTrail resourceType="kyc" resourceId="demo-id" />);

    expect(await screen.findByText("Audit Trail")).toBeInTheDocument();
    expect(await screen.findByText("No audit events recorded yet.")).toBeInTheDocument();
  });
});
