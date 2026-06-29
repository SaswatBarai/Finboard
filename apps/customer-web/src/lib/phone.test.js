import { describe, expect, it } from "vitest";
import { isValidE164Phone } from "./phone";

describe("isValidE164Phone", () => {
  it("accepts valid international numbers", () => {
    expect(isValidE164Phone("+919876543210")).toBe(true);
    expect(isValidE164Phone("+12025550123")).toBe(true);
  });

  it("rejects numbers without country code", () => {
    expect(isValidE164Phone("9876543210")).toBe(false);
    expect(isValidE164Phone("")).toBe(false);
  });
});
