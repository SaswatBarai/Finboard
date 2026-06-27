import * as React from "react";
import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva } from "class-variance-authority";

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-3xl border border-transparent bg-clip-padding text-sm font-semibold whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:not-aria-[haspopup]:brightness-95 disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-[var(--primary-active)]",
        outline:
          "border-foreground/20 bg-card text-foreground hover:bg-secondary aria-expanded:bg-secondary",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-[color-mix(in_srgb,var(--secondary),var(--foreground)_6%)] aria-expanded:bg-secondary",
        ghost:
          "rounded-2xl hover:bg-secondary hover:text-foreground aria-expanded:bg-secondary",
        destructive:
          "bg-destructive/10 text-destructive hover:bg-destructive/20 focus-visible:border-destructive/40 focus-visible:ring-destructive/20",
        link: "rounded-none text-foreground underline-offset-4 hover:underline",
      },
      size: {
        default:
          "h-12 gap-2 px-6 text-base has-data-[icon=inline-end]:pr-5 has-data-[icon=inline-start]:pl-5",
        xs: "h-8 gap-1 rounded-2xl px-3 text-xs has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-10 gap-1.5 rounded-3xl px-4 text-sm has-data-[icon=inline-end]:pr-3 has-data-[icon=inline-start]:pl-3 [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-12 gap-2 px-8 text-base has-data-[icon=inline-end]:pr-6 has-data-[icon=inline-start]:pl-6",
        icon: "size-11 rounded-full",
        "icon-xs":
          "size-8 rounded-full [&_svg:not([class*='size-'])]:size-3",
        "icon-sm":
          "size-10 rounded-full",
        "icon-lg": "size-12 rounded-full",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function isLinkChild(child) {
  return React.isValidElement(child) && (child.type === "a" || typeof child.props?.href === "string");
}

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  render,
  nativeButton,
  children,
  ...props
}) {
  let resolvedRender = render;
  let resolvedChildren = children;

  if (asChild) {
    const child = React.Children.only(children);
    if (!React.isValidElement(child)) {
      throw new Error("Button: asChild requires a single valid React element child.");
    }

    if (isLinkChild(child)) {
      return React.cloneElement(child, {
        ...props,
        "data-slot": "button",
        className: cn(buttonVariants({ variant, size, className }), child.props.className)
      });
    }

    resolvedRender = child;
    resolvedChildren = child.props.children;
  }

  const usesCustomRender = Boolean(resolvedRender);

  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      render={resolvedRender}
      nativeButton={usesCustomRender ? false : nativeButton ?? true}
      {...props}
    >
      {resolvedChildren}
    </ButtonPrimitive>
  );
}

export { Button, buttonVariants }
