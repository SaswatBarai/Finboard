import { describe, expect, it } from "vitest";
import * as React from "react";

import { resolveAsChildRender } from "./resolve-as-child-render";

function Button(props) {
  return React.createElement("button", { type: "button", ...props });
}

describe("resolveAsChildRender", () => {
  it("uses nativeButton for button children", () => {
    const result = resolveAsChildRender({
      asChild: true,
      children: React.createElement(Button, { "aria-label": "Profile" }),
      componentName: "DropdownMenuTrigger",
    });

    expect(result.resolvedNativeButton).toBe(true);
    expect(result.resolvedChildren).toBeUndefined();
  });

  it("uses non-native button for div children", () => {
    const result = resolveAsChildRender({
      asChild: true,
      children: React.createElement("div", null, "Search"),
      componentName: "PopoverTrigger",
    });

    expect(result.resolvedNativeButton).toBe(false);
  });
});
