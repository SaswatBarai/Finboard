"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useLandingMotion } from "../lib/motion";

export function Reveal({ children, className, delay = 0, as = "div" }) {
  const { fadeUp, reduce } = useLandingMotion();
  const Comp = motion[as] || motion.div;

  if (reduce) {
    return <div className={className}>{children}</div>;
  }

  return (
    <Comp
      className={className}
      initial={fadeUp.initial}
      whileInView={fadeUp.whileInView}
      viewport={fadeUp.viewport}
      transition={{ ...fadeUp.transition, delay }}
    >
      {children}
    </Comp>
  );
}

export function Eyebrow({ children, className }) {
  return (
    <p
      className={cn(
        "text-xs font-semibold uppercase tracking-[0.22em] text-[var(--fb-mute)]",
        className
      )}
    >
      {children}
    </p>
  );
}

export function DisplayHeading({ children, className, as: Tag = "h2", ...props }) {
  return (
    <Tag
      className={cn(
        "font-black tracking-[-0.04em] text-[var(--fb-ink)] [font-family:var(--font-display)]",
        className
      )}
      {...props}
    >
      {children}
    </Tag>
  );
}

export function SectionShell({ id, children, className, tone = "soft", ...props }) {
  const tones = {
    soft: "bg-[var(--fb-canvas-soft)]",
    white: "bg-card",
    ink: "bg-[#0e0f0c] text-[var(--fb-primary)]",
    pale: "bg-[var(--fb-primary-pale)]"
  };

  return (
    <section id={id} className={cn("relative overflow-hidden", tones[tone], className)} {...props}>
      {children}
    </section>
  );
}

export function SectionInner({ children, className }) {
  return (
    <div
      className={cn(
        "mx-auto w-full min-w-0 max-w-[1200px] px-4 py-14 sm:px-5 sm:py-20 md:px-8 md:py-28 lg:py-32",
        className
      )}
    >
      {children}
    </div>
  );
}
