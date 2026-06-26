"use client";

import { useReducedMotion } from "framer-motion";

export function useLandingMotion() {
  const reduce = useReducedMotion();

  return {
    reduce,
    fadeUp: reduce
      ? {}
      : {
          initial: { opacity: 0, y: 28 },
          whileInView: { opacity: 1, y: 0 },
          viewport: { once: true, margin: "-80px" },
          transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] }
        },
    fadeIn: reduce
      ? {}
      : {
          initial: { opacity: 0 },
          whileInView: { opacity: 1 },
          viewport: { once: true, margin: "-60px" },
          transition: { duration: 0.5 }
        },
    stagger: reduce ? 0 : 0.08,
    spring: reduce ? { duration: 0 } : { type: "spring", stiffness: 120, damping: 18 }
  };
}
