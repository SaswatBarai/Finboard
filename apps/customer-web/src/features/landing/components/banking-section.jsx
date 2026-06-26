"use client";

import { ArrowDownLeft, ArrowUpRight, RefreshCw } from "lucide-react";
import { DisplayHeading, Eyebrow, Reveal, SectionInner, SectionShell } from "./primitives";

export default function BankingSection() {
  return (
    <SectionShell id="banking" tone="pale">
      <SectionInner>
        <div className="grid gap-12 lg:grid-cols-[1fr_1.05fr] lg:items-start">
          <Reveal>
            <Eyebrow>Core banking simulation</Eyebrow>
            <DisplayHeading className="mt-4 text-4xl md:text-5xl">
              Link accounts with a penny-drop investors actually understand.
            </DisplayHeading>
            <p className="mt-6 text-lg leading-relaxed text-[var(--fb-body)]">
              PostgreSQL + Prisma powers a dummy ledger with verification debits, automatic refunds, transfers, and
              beneficiaries — isolated from MongoDB onboarding data.
            </p>
          </Reveal>

          <Reveal delay={0.1}>
            <div className="rounded-[28px] border border-[var(--fb-ink)]/10 bg-white p-6 md:p-8">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm text-[var(--fb-mute)]">Finboard Demo Bank</p>
                  <p className="mt-1 text-2xl font-black text-[var(--fb-ink)]">₹48,234.50</p>
                </div>
                <span className="rounded-full bg-[var(--fb-primary-pale)] px-3 py-1 text-xs font-semibold text-[var(--fb-positive-deep)]">
                  Verified
                </span>
              </div>

              <div className="mt-8 space-y-3">
                {[
                  { icon: ArrowDownLeft, label: "Verification debit", amount: "- ₹2.00", tone: "neutral" },
                  { icon: RefreshCw, label: "Auto refund", amount: "+ ₹2.00", tone: "positive" },
                  { icon: ArrowUpRight, label: "MF purchase routed to AMC", amount: "- ₹5,000", tone: "neutral" }
                ].map((row) => (
                  <div
                    key={row.label}
                    className="flex items-center justify-between rounded-2xl bg-[var(--fb-canvas-soft)] px-4 py-3"
                  >
                    <div className="flex items-center gap-3">
                      <row.icon className="size-4 text-[var(--fb-ink-deep)]" aria-hidden />
                      <span className="text-sm font-medium text-[var(--fb-ink)]">{row.label}</span>
                    </div>
                    <span
                      className={`text-sm font-bold ${
                        row.tone === "positive" ? "text-[var(--fb-positive-deep)]" : "text-[var(--fb-ink)]"
                      }`}
                    >
                      {row.amount}
                    </span>
                  </div>
                ))}
              </div>

              <p className="mt-6 text-xs leading-relaxed text-[var(--fb-mute)]">
                Refund job runs every 30 seconds — verifications move from REFUND_PENDING to REFUNDED automatically.
              </p>
            </div>
          </Reveal>
        </div>
      </SectionInner>
    </SectionShell>
  );
}
