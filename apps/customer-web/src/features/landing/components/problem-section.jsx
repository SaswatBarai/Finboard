"use client";

import { AlertTriangle, Layers3, Timer } from "lucide-react";
import { problemStats } from "../data/content";
import { DisplayHeading, Eyebrow, Reveal, SectionInner, SectionShell } from "./primitives";

const pains = [
  {
    icon: Timer,
    title: "Onboarding measured in weeks",
    body: "Legacy KYC stacks treat identity, documents, banking, and investing as separate procurement projects — investors feel every handoff."
  },
  {
    icon: Layers3,
    title: "Ops teams live in spreadsheets",
    body: "RTA reviewers chase files across email, shared drives, and ticket queues. There is no single narrative of what happened to an application."
  },
  {
    icon: AlertTriangle,
    title: "Trust erodes before the first rupee moves",
    body: "When verification feels opaque, investors abandon before bank linking — even when the product behind the gate is excellent."
  }
];

export default function ProblemSection() {
  return (
    <SectionShell tone="white">
      <SectionInner>
        <div className="grid gap-14 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
          <Reveal>
            <Eyebrow>The problem</Eyebrow>
            <DisplayHeading className="mt-4 text-4xl leading-[1.02] md:text-5xl lg:text-[3.25rem]">
              Traditional KYC was built for auditors — not investors.
            </DisplayHeading>
            <p className="mt-6 max-w-md text-lg leading-relaxed text-[var(--fb-body)]">
              Most platforms optimize for checkbox compliance. Finboard optimizes for momentum: verify identity, approve
              with context, link a bank account, unlock the portfolio — in one continuous story.
            </p>
          </Reveal>

          <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
            {problemStats.map((stat, index) => (
              <Reveal key={stat.label} delay={index * 0.08} className="rounded-3xl bg-[var(--fb-canvas-soft)] p-5">
                <p className="text-3xl font-black tracking-tight text-[var(--fb-ink)]">{stat.value}</p>
                <p className="mt-2 text-sm leading-relaxed text-[var(--fb-body)]">{stat.label}</p>
              </Reveal>
            ))}
          </div>
        </div>

        <div className="mt-16 grid gap-5 md:grid-cols-3">
          {pains.map((item, index) => (
            <Reveal
              key={item.title}
              delay={index * 0.1}
              className="group rounded-[28px] border border-[var(--fb-ink)]/8 bg-[var(--fb-canvas-soft)] p-6 transition-transform hover:-translate-y-1"
            >
              <item.icon className="size-5 text-[var(--fb-ink-deep)]" aria-hidden />
              <h3 className="mt-4 text-xl font-bold tracking-tight text-[var(--fb-ink)]">{item.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-[var(--fb-body)]">{item.body}</p>
            </Reveal>
          ))}
        </div>
      </SectionInner>
    </SectionShell>
  );
}
