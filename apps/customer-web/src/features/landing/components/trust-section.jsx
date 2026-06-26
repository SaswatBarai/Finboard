"use client";

import { trustMetrics } from "../data/content";
import { DisplayHeading, Eyebrow, Reveal, SectionInner, SectionShell } from "./primitives";

export default function TrustSection() {
  return (
    <SectionShell tone="soft">
      <SectionInner className="text-center">
        <Reveal>
          <Eyebrow>Trust indicators</Eyebrow>
          <DisplayHeading className="mx-auto mt-4 max-w-3xl text-4xl md:text-5xl">
            Built for demos today. Architected for production tomorrow.
          </DisplayHeading>
        </Reveal>

        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {trustMetrics.map((item, index) => (
            <Reveal
              key={item.label}
              delay={index * 0.07}
              className="rounded-[28px] bg-white px-5 py-8 text-left shadow-[0_12px_40px_-24px_rgba(14,15,12,0.2)]"
            >
              <p className="text-3xl font-black tracking-tight text-[var(--fb-ink)]">{item.value}</p>
              <p className="mt-2 text-sm leading-relaxed text-[var(--fb-body)]">{item.label}</p>
            </Reveal>
          ))}
        </div>
      </SectionInner>
    </SectionShell>
  );
}
