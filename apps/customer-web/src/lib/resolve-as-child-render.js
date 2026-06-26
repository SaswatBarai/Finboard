import * as React from "react";

function inferNativeButton(element) {
  if (element.type === "button") {
    return true;
  }

  if (element.props?.nativeButton === true) {
    return true;
  }

  if (element.props?.nativeButton === false || element.props?.asChild) {
    return false;
  }

  const typeName = element.type?.displayName || element.type?.name || "";

  return typeName === "Button";
}

export function resolveAsChildRender({
  asChild = false,
  children,
  render,
  nativeButton,
  componentName,
}) {
  let resolvedRender = render;
  let resolvedChildren = children;

  if (asChild) {
    const child = React.Children.only(children);

    if (!React.isValidElement(child)) {
      throw new Error(`${componentName}: asChild requires a single valid React element child.`);
    }

    resolvedRender = child;
    resolvedChildren = undefined;
  }

  const usesCustomRender = Boolean(resolvedRender);
  const resolvedNativeButton =
    nativeButton ?? (usesCustomRender ? inferNativeButton(resolvedRender) : true);

  return {
    resolvedRender,
    resolvedChildren,
    resolvedNativeButton,
  };
}
