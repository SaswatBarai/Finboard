"use client";

import Link from "next/link";
import { DisplayHeading, Eyebrow, Reveal, SectionInner, SectionShell } from "./primitives";

const screens = [
  { title: "Investor dashboard", href: "/dashboard", meta: "Market watchlists + portfolio gate" },
  { title: "KYC submission", href: "/kyc", meta: "PAN/Aadhaar upload flow" },
  { title: "RTA review", href: "/admin/kyc", meta: "Approve / reject with OCR context" },
  { title: "Banking", href: "/banking", meta: "Verify · transfer · ledger" }
];

export default function PlatformPreviewSection() {
  return (
    <SectionShell tone="white">
      <SectionInner>
        <Reveal>
          <Eyebrow>Platform preview</Eyebrow>
          <DisplayHeading className="mt-4 max-w-2xl text-4xl md:text-5xl">
            Skip the slide deck — walk through the live product.
          </DisplayHeading>
        </Reveal>

        <div className="mt-12 grid gap-5 md:grid-cols-2">
          {screens.map((screen, index) => (
            <Reveal
              key={screen.title}
              delay={index * 0.08}
              className={`group relative overflow-hidden rounded-[28px] border border-[var(--fb-ink)]/10 p-6 ${
                index === 0 ? "md:col-span-2 md:grid md:grid-cols-[1fr_1.2fr] md:items-center md:gap-8 md:p-8" : "bg-[var(--fb-canvas-soft)]"
              }`}
            >
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--fb-mute)]">Live route</p>
                <h3 className="mt-2 text-2xl font-bold tracking-tight text-[var(--fb-ink)]">{screen.title}</h3>
                <p className="mt-2 text-sm text-[var(--fb-body)]">{screen.meta}</p>
                <Link
                  href={screen.href}
                  className="mt-4 inline-flex text-sm font-semibold text-[var(--fb-ink-deep)] underline-offset-4 hover:underline"
                >
                  Open screen →
                </Link>
              </div>
              <div
                className={`mt-6 rounded-2xl bg-[var(--fb-ink)] p-4 md:mt-0 ${
                  index === 0 ? "min-h-[180px]" : "min-h-[120px]"
                }`}
                aria-hidden
              >
                <div className="flex gap-2">
                  <span className="size-2 rounded-full bg-[var(--fb-primary)]/80" />
                  <span className="size-2 rounded-full bg-[var(--fb-primary)]/40" />
                  <span className="size-2 rounded-full bg-[var(--fb-primary)]/20" />
                </div>
                <div className="mt-4 space-y-2">
                  <div className="h-3 w-2/3 rounded-full bg-[var(--fb-primary)]/25" />
                  <div className="h-3 w-1/2 rounded-full bg-[var(--fb-primary)]/15" />
                  <div className="h-16 rounded-xl bg-[var(--fb-primary)]/10" />
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </SectionInner>
    </SectionShell>
  );
}
