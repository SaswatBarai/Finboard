import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import AdminAuditScreen from "./admin-audit-screen";

const mockSearchParams = new URLSearchParams();

vi.mock("next/navigation", () => ({
  useSearchParams: () => mockSearchParams,
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() })
}));

vi.mock("@/features/auth/context/auth-context", () => ({
  useAuth: () => ({
    token: "test-token",
    ready: true,
    user: { role: "admin", email: "admin@finboard.local" }
  })
}));

vi.mock("@/features/kyc/api/kyc-api", () => ({
  kycApi: {
    adminList: vi.fn().mockResolvedValue([
      {
        _id: "kyc-app-001",
        name: "Anurag Swarnakar",
        status: "approved"
      }
    ])
  }
}));

vi.mock("../components/audit-trail", () => ({
  AuditTrail: ({ resourceId }) => <div>Audit trail for {resourceId}</div>
}));

function renderWithClient(ui) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } }
  });

  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}

describe("AdminAuditScreen", () => {
  beforeEach(() => {
    mockSearchParams.delete("kycId");
  });

  it("renders audit explorer and preselects application from query param", async () => {
    mockSearchParams.set("kycId", "kyc-app-001");

    renderWithClient(<AdminAuditScreen />);

    expect(await screen.findByText("KYC audit trail lookup")).toBeInTheDocument();
    expect(await screen.findByText("Audit trail for kyc-app-001")).toBeInTheDocument();
  });
});
