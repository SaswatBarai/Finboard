import { describe, expect, it } from "vitest";
import { cn } from "./utils";

describe("cn", () => {
  it("merges class names", () => {
    const hidden = false;
    expect(cn("px-2", "py-1", hidden && "hidden", "text-sm")).toBe("px-2 py-1 text-sm");
  });
});
