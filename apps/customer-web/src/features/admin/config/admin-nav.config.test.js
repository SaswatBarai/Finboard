import { describe, expect, it } from "vitest";
import {
  ADMIN_NAV_ITEMS,
  getAdminNavItemsForRole,
  getHubModulesForRole,
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

    expect(items.map((item) => item.id)).toEqual(["home", "kyc", "audit", "banking", "amc"]);
  });

  it("excludes home from hub modules", () => {
    const modules = getHubModulesForRole("admin");

    expect(modules.map((item) => item.id)).toEqual(["kyc", "audit", "banking", "amc"]);
    expect(ADMIN_NAV_ITEMS.length).toBeGreaterThan(modules.length);
  });

  it("marks nested admin routes as active", () => {
    expect(isAdminNavItemActive("/admin/kyc/kyc-app-001", "/admin/kyc")).toBe(true);
    expect(isAdminNavItemActive("/admin/dashboard", "/admin/dashboard")).toBe(true);
    expect(isAdminNavItemActive("/admin/kyc", "/admin/dashboard")).toBe(false);
  });
});
