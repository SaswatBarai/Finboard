"use client";

import { techStack } from "../data/content";
import { Eyebrow, Reveal, SectionInner, SectionShell } from "./primitives";

export default function TechSection() {
  return (
    <SectionShell tone="white">
      <SectionInner className="flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
        <Reveal>
          <Eyebrow>Technology</Eyebrow>
          <p className="mt-3 max-w-md text-2xl font-bold tracking-tight text-[var(--fb-ink)]">
            Modular monolith today. Microservices roadmap tomorrow.
          </p>
        </Reveal>
        <Reveal delay={0.1}>
          <ul className="flex flex-wrap gap-2 md:max-w-xl md:justify-end">
            {techStack.map((item) => (
              <li
                key={item}
                className="rounded-full border border-[var(--fb-ink)]/10 bg-[var(--fb-canvas-soft)] px-4 py-2 text-sm font-semibold text-[var(--fb-ink)]"
              >
                {item}
              </li>
            ))}
          </ul>
        </Reveal>
      </SectionInner>
    </SectionShell>
  );
}
