"use client";

import Link from "next/link";
import { PieChart, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DisplayHeading, Eyebrow, Reveal, SectionInner, SectionShell } from "./primitives";

const holdings = [
  { symbol: "NIFTYBEES", alloc: 42, tone: "bg-[var(--fb-primary)]" },
  { symbol: "HDFCBANK", alloc: 28, tone: "bg-[var(--fb-ink)]" },
  { symbol: "PARAGPARIKH", alloc: 18, tone: "bg-[var(--fb-accent-cyan)]" },
  { symbol: "CASH", alloc: 12, tone: "bg-[var(--fb-canvas-soft)] border border-[var(--fb-ink)]/10" }
];

export default function InvestmentSection() {
  return (
    <SectionShell id="invest" tone="white">
      <SectionInner>
        <div className="grid gap-14 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
          <Reveal delay={0.08}>
            <div className="relative overflow-hidden rounded-[32px] bg-[var(--fb-ink)] p-8 text-[var(--fb-primary)]">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--fb-primary)]/60">Portfolio preview</p>
              <p className="mt-4 text-4xl font-black tracking-tight">₹2,84,120</p>
              <p className="mt-1 flex items-center gap-1 text-sm text-[var(--fb-primary)]/75">
                <TrendingUp className="size-4" aria-hidden /> +12.4% since KYC approval
              </p>

              <div className="mt-8 flex h-4 overflow-hidden rounded-full">
                {holdings.map((h) => (
                  <div key={h.symbol} className={`${h.tone} h-full`} style={{ width: `${h.alloc}%` }} title={h.symbol} />
                ))}
              </div>

              <ul className="mt-6 space-y-2">
                {holdings.map((h) => (
                  <li key={h.symbol} className="flex items-center justify-between text-sm">
                    <span className="font-medium">{h.symbol}</span>
                    <span className="text-[var(--fb-primary)]/70">{h.alloc}%</span>
                  </li>
                ))}
              </ul>

              <PieChart className="absolute -bottom-6 -right-6 size-32 text-[var(--fb-primary)]/10" aria-hidden />
            </div>
          </Reveal>

          <Reveal>
            <Eyebrow>Investment engine</Eyebrow>
            <DisplayHeading className="mt-4 text-4xl md:text-5xl">
              Unlock stocks, mutual funds, and SIPs after compliance — not before.
            </DisplayHeading>
            <p className="mt-6 text-lg leading-relaxed text-[var(--fb-body)]">
              Purchases debit the linked bank account in PostgreSQL, create MongoDB portfolio holdings, and route mutual
              fund orders to AMC admins for approval — mirroring real RTA workflows.
            </p>
            <Button
              asChild
              className="mt-8 h-12 rounded-2xl bg-[var(--fb-primary)] px-6 text-base font-semibold text-[var(--fb-on-primary)] hover:bg-[var(--fb-primary-active)]"
            >
              <Link href="/dashboard">Explore demo dashboard</Link>
            </Button>
          </Reveal>
        </div>
      </SectionInner>
    </SectionShell>
  );
}
