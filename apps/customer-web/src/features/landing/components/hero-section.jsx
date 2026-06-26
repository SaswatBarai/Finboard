"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { kycSteps } from "../data/content";
import { Reveal } from "./primitives";

function PipelineVisual() {
  const reduce = useReducedMotion();
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (reduce) return undefined;
    const id = window.setInterval(() => {
      setActive((current) => (current + 1) % kycSteps.length);
    }, 3200);
    return () => window.clearInterval(id);
  }, [reduce]);

  return (
    <div className="relative">
      <div className="absolute -right-8 -top-8 size-40 rounded-full bg-[var(--fb-primary)]/30 blur-3xl" aria-hidden />
      <div className="absolute -bottom-10 -left-6 size-32 rounded-full bg-[var(--fb-accent-cyan)]/20 blur-3xl" aria-hidden />

      <div className="relative rounded-[28px] border border-[var(--fb-ink)]/10 bg-white p-6 shadow-[0_24px_80px_-40px_rgba(14,15,12,0.35)] md:p-8">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--fb-mute)]">Live pipeline</p>
            <p className="mt-1 text-lg font-semibold text-[var(--fb-ink)]">Identity → Invest</p>
          </div>
          <Badge className="rounded-full border-0 bg-[var(--fb-primary-pale)] px-3 py-1 text-[var(--fb-positive-deep)]">
            Demo mode
          </Badge>
        </div>

        <ol className="space-y-3" aria-label="KYC pipeline steps">
          {kycSteps.map((step, index) => {
            const isActive = index === active;
            const isDone = step.status === "done" || index < active;

            return (
              <motion.li
                key={step.id}
                layout={!reduce}
                className={`relative overflow-hidden rounded-2xl border px-4 py-3 transition-colors ${
                  isActive
                    ? "border-[var(--fb-ink)] bg-[var(--fb-canvas-soft)]"
                    : "border-transparent bg-[var(--fb-canvas-soft)]/60"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-[var(--fb-ink)]">{step.title}</p>
                    <p className="mt-0.5 text-sm text-[var(--fb-body)]">{step.detail}</p>
                  </div>
                  <span
                    className={`mt-0.5 size-2.5 shrink-0 rounded-full ${
                      isDone ? "bg-[var(--fb-positive)]" : isActive ? "bg-[var(--fb-primary)]" : "bg-[var(--fb-mute)]/40"
                    }`}
                    aria-hidden
                  />
                </div>
                {isActive && !reduce ? (
                  <motion.div
                    className="absolute inset-x-0 bottom-0 h-0.5 bg-[var(--fb-primary)]"
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ duration: 2.8, ease: "linear" }}
                    style={{ transformOrigin: "left" }}
                  />
                ) : null}
              </motion.li>
            );
          })}
        </ol>

        <div className="mt-6 grid grid-cols-3 gap-3 border-t border-[var(--fb-ink)]/8 pt-5">
          {[
            { label: "OCR confidence", value: "94.2%" },
            { label: "Review queue", value: "12 pending" },
            { label: "Time to invest", value: "4 min" }
          ].map((item) => (
            <div key={item.label} className="rounded-xl bg-[var(--fb-primary-pale)]/70 px-3 py-2">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--fb-mute)]">{item.label}</p>
              <p className="mt-1 text-sm font-bold text-[var(--fb-ink-deep)]">{item.value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function HeroSection() {
  const reduce = useReducedMotion();

  return (
    <section className="relative overflow-hidden bg-[var(--fb-canvas-soft)] pt-6 md:pt-10">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(159,232,112,0.18),transparent_42%),radial-gradient(circle_at_80%_0%,rgba(56,200,255,0.08),transparent_35%)]" />

      <div className="relative mx-auto grid max-w-[1200px] gap-12 px-5 pb-20 pt-8 md:px-8 md:pb-28 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-16 lg:pb-32">
        <div>
          <Reveal>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[var(--fb-ink)]/10 bg-white/70 px-3 py-1.5 text-sm text-[var(--fb-body)] backdrop-blur-sm">
              <ShieldCheck className="size-4 text-[var(--fb-positive-deep)]" aria-hidden />
              KYC · Banking · Investments — one coherent journey
            </div>
          </Reveal>

          <Reveal delay={0.05}>
            <h1 className="max-w-[14ch] text-[clamp(2.75rem,8vw,5.5rem)] font-black leading-[0.92] tracking-[-0.045em] text-[var(--fb-ink)]">
              Onboard
              <span className="block text-[var(--fb-ink-deep)]">investors</span>
              <span className="block text-[var(--fb-body)]">without the friction.</span>
            </h1>
          </Reveal>

          <Reveal delay={0.12}>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-[var(--fb-body)] md:text-xl">
              Finboard is a premium demo platform for identity verification, RTA review, dummy core banking, and
              investment flows — designed like a modern fintech product, not a compliance PDF.
            </p>
          </Reveal>

          <Reveal delay={0.18}>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Button
                asChild
                className="h-12 gap-2 rounded-2xl bg-[var(--fb-primary)] px-6 text-base font-semibold text-[var(--fb-on-primary)] hover:bg-[var(--fb-primary-active)]"
              >
                <Link href="/signup">
                  Create investor account
                  <ArrowRight className="size-4" aria-hidden />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="h-12 rounded-2xl border-[var(--fb-ink)] bg-white px-6 text-base font-semibold text-[var(--fb-ink)] hover:bg-white/80"
              >
                <Link href="/signin">View live demo</Link>
              </Button>
            </div>
          </Reveal>

          <Reveal delay={0.24}>
            <dl className="mt-12 grid max-w-lg grid-cols-3 gap-4 border-t border-[var(--fb-ink)]/10 pt-8">
              {[
                { k: "4 min", v: "demo onboarding" },
                { k: "2 DBs", v: "Mongo + Postgres" },
                { k: "3 roles", v: "admin · RTA · AMC" }
              ].map((item) => (
                <div key={item.v}>
                  <dt className="text-2xl font-black tracking-tight text-[var(--fb-ink)]">{item.k}</dt>
                  <dd className="mt-1 text-xs font-medium uppercase tracking-wider text-[var(--fb-mute)]">{item.v}</dd>
                </div>
              ))}
            </dl>
          </Reveal>
        </div>

        <Reveal delay={reduce ? 0 : 0.15}>
          <PipelineVisual />
        </Reveal>
      </div>

      {!reduce ? (
        <motion.div
          aria-hidden
          className="absolute bottom-0 left-1/2 h-px w-[min(90%,900px)] -translate-x-1/2 bg-gradient-to-r from-transparent via-[var(--fb-ink)]/15 to-transparent"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 0.4, duration: 1.2 }}
        />
      ) : null}
    </section>
  );
}
