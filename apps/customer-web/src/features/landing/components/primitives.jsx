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

export function DisplayHeading({ children, className, as: Tag = "h2" }) {
  return (
    <Tag
      className={cn(
        "font-black tracking-[-0.04em] text-[var(--fb-ink)] [font-family:var(--font-sans)]",
        className
      )}
    >
      {children}
    </Tag>
  );
}

export function SectionShell({ id, children, className, tone = "soft" }) {
  const tones = {
    soft: "bg-[var(--fb-canvas-soft)]",
    white: "bg-white",
    ink: "bg-[var(--fb-ink)] text-[var(--fb-primary)]",
    pale: "bg-[var(--fb-primary-pale)]"
  };

  return (
    <section id={id} className={cn("relative overflow-hidden", tones[tone], className)}>
      {children}
    </section>
  );
}

export function SectionInner({ children, className }) {
  return <div className={cn("mx-auto w-full max-w-[1200px] px-5 py-20 md:px-8 md:py-28 lg:py-32", className)}>{children}</div>;
}
