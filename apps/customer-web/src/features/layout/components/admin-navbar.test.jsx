import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import AdminNavbar from "./admin-navbar";

afterEach(() => {
  cleanup();
});

vi.mock("next/navigation", () => ({
  usePathname: () => "/admin/kyc",
  useRouter: () => ({ push: vi.fn() })
}));

vi.mock("@/features/auth/context/auth-context", () => ({
  useAuth: vi.fn()
}));

import { useAuth } from "@/features/auth/context/auth-context";

function getDesktopNav() {
  const navs = screen.getAllByRole("navigation");
  return navs.find((nav) => nav.className.includes("md:flex")) || navs[0];
}

describe("AdminNavbar", () => {
  it("shows role-filtered links for rta_admin", () => {
    useAuth.mockReturnValue({
      user: { role: "rta_admin", email: "rta.admin@finboard.local" },
      logout: vi.fn()
    });

    render(<AdminNavbar />);

    const desktopNav = getDesktopNav();

    expect(within(desktopNav).getByRole("link", { name: "KYC Review" })).toBeInTheDocument();
    expect(within(desktopNav).getByRole("link", { name: "Audit" })).toBeInTheDocument();
    expect(within(desktopNav).queryByRole("link", { name: "Banking" })).not.toBeInTheDocument();
    expect(screen.getByText("RTA Admin")).toBeInTheDocument();
  });

  it("shows all platform admin modules", () => {
    useAuth.mockReturnValue({
      user: { role: "admin", email: "admin@finboard.local" },
      logout: vi.fn()
    });

    render(<AdminNavbar />);

    const desktopNav = getDesktopNav();

    expect(within(desktopNav).getByRole("link", { name: "KYC Review" })).toBeInTheDocument();
    expect(within(desktopNav).getByRole("link", { name: "Audit" })).toBeInTheDocument();
    expect(within(desktopNav).getByRole("link", { name: "Banking" })).toBeInTheDocument();
    expect(within(desktopNav).getByRole("link", { name: "AMC" })).toBeInTheDocument();
  });
});
