import { describe, expect, it } from "vitest";
import {
  getAdminNavItemsForRole,
  getDefaultAdminRoute,
  isAdminNavItemActive
} from "./admin-nav.config";

describe("admin-nav.config", () => {
  it("returns KYC and Audit only for rta_admin", () => {
    const items = getAdminNavItemsForRole("rta_admin");

    expect(items.map((item) => item.id)).toEqual(["kyc", "audit"]);
  });

  it("returns AMC only for amc_admin", () => {
    const items = getAdminNavItemsForRole("amc_admin");

    expect(items.map((item) => item.id)).toEqual(["amc"]);
  });

  it("returns all modules for platform admin", () => {
    const items = getAdminNavItemsForRole("admin");

    expect(items.map((item) => item.id)).toEqual(["kyc", "audit", "banking", "amc"]);
  });

  it("returns default admin route from first nav item", () => {
    expect(getDefaultAdminRoute("admin")).toBe("/admin/kyc");
    expect(getDefaultAdminRoute("rta_admin")).toBe("/admin/kyc");
    expect(getDefaultAdminRoute("amc_admin")).toBe("/admin/amc");
  });

  it("marks nested admin routes as active", () => {
    expect(isAdminNavItemActive("/admin/kyc/kyc-app-001", "/admin/kyc")).toBe(true);
    expect(isAdminNavItemActive("/admin/kyc", "/admin/audit")).toBe(false);
  });
});
