"use client";

import { motion, useReducedMotion } from "framer-motion";
import { DisplayHeading, Eyebrow, Reveal, SectionInner, SectionShell } from "./primitives";

const shifts = [
  {
    n: "01",
    title: "One modular platform",
    copy: "Auth, profile, KYC, banking, and investments share a single Express monolith today — extracted into microservices when you scale."
  },
  {
    n: "02",
    title: "Hybrid persistence by design",
    copy: "MongoDB for flexible onboarding documents. PostgreSQL for ledger-grade banking. Each datastore does what it does best."
  },
  {
    n: "03",
    title: "Human review with machine speed",
    copy: "OCR extracts PAN and Aadhaar fields automatically. RTA admins approve with documents, checks, and audit context side by side."
  }
];

export default function PlatformShiftSection() {
  const reduce = useReducedMotion();

  return (
    <SectionShell tone="ink" className="text-[var(--fb-primary)]">
      <SectionInner>
        <div className="grid gap-12 lg:grid-cols-[1fr_1.2fr] lg:items-end">
          <Reveal>
            <Eyebrow className="text-[var(--fb-primary)]/70">The shift</Eyebrow>
            <DisplayHeading className="mt-4 text-4xl text-[var(--fb-primary)] md:text-5xl lg:text-[3.5rem]">
              Compliance that feels like product.
            </DisplayHeading>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="max-w-xl text-lg leading-relaxed text-[var(--fb-primary)]/80">
              Finboard replaces fragmented onboarding with a single investor journey — engineered for demo realism and
              production-grade patterns underneath.
            </p>
          </Reveal>
        </div>

        <div className="mt-16 space-y-0">
          {shifts.map((item, index) => (
            <Reveal key={item.n} delay={index * 0.08}>
              <motion.div
                className="grid gap-4 border-t border-[var(--fb-primary)]/20 py-8 md:grid-cols-[120px_1fr_1.2fr] md:items-start"
                whileHover={reduce ? undefined : { x: 6 }}
              >
                <p className="text-sm font-semibold tracking-[0.3em] text-[var(--fb-primary)]/60">{item.n}</p>
                <h3 className="text-2xl font-bold tracking-tight text-[var(--fb-primary)]">{item.title}</h3>
                <p className="text-base leading-relaxed text-[var(--fb-primary)]/75">{item.copy}</p>
              </motion.div>
            </Reveal>
          ))}
        </div>
      </SectionInner>
    </SectionShell>
  );
}
