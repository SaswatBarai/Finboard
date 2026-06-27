"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  CheckCircle2,
  Circle,
  FileText,
  Loader2,
  ScanLine,
  ShieldCheck,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { kycSteps } from "../data/content";
import { Reveal } from "./primitives";
import { cn } from "@/lib/utils";

const STEP_ICONS = {
  upload: FileText,
  ocr: ScanLine,
  match: ShieldCheck,
  review: Loader2,
  unlock: TrendingUp,
};

const STEP_DURATION_MS = 3400;

const STAGE_ENTER = { opacity: 0, scale: 0.97 };
const STAGE_VISIBLE = { opacity: 1, scale: 1 };
const STAGE_EXIT = { opacity: 0, scale: 0.97 };
const STAGE_TRANSITION = { duration: 0.3, ease: [0.22, 1, 0.36, 1] };

function DocumentStage({ step, reduce }) {
  const Icon = STEP_ICONS[step.id] || FileText;

  if (step.id === "upload") {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
        <div className="flex size-12 items-center justify-center rounded-xl bg-[var(--fb-primary)]/15 ring-1 ring-[var(--fb-primary)]/25">
          <FileText className="size-5 text-[var(--fb-primary)]" aria-hidden />
        </div>
        <div>
          <p className="text-sm font-semibold text-[var(--fb-ink)]">PAN & Aadhaar uploaded</p>
          <p className="mt-1 text-xs text-[var(--fb-mute)]">Ready for automatic reading</p>
        </div>
        <CheckCircle2 className="size-5 text-[var(--fb-positive)]" aria-hidden />
      </div>
    );
  }

  if (step.id === "ocr") {
    return (
      <div className="flex h-full flex-col">
        <div className="relative flex-1 overflow-hidden rounded-xl border border-[var(--fb-ink)]/10 bg-card p-3 shadow-inner sm:p-4">
          <div className="mb-3 flex items-center justify-between gap-2">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--fb-mute)]">
              PAN card
            </span>
            {!reduce && (
              <span className="flex items-center gap-1 text-[10px] font-semibold text-[var(--fb-primary)]">
                <Sparkles className="size-3" aria-hidden />
                Reading…
              </span>
            )}
          </div>

          <div className="space-y-2">
            <div className="h-2 w-4/5 max-w-[200px] rounded-full bg-[var(--fb-ink)]/8" />
            <div className="h-2 w-3/5 max-w-[140px] rounded-full bg-[var(--fb-ink)]/8" />
            <div className="mt-2 flex gap-2">
              <div className="h-12 w-10 shrink-0 rounded-lg bg-[var(--fb-ink)]/6 sm:h-14 sm:w-11" />
              <div className="flex flex-1 flex-col justify-center gap-1.5">
                <div className="h-2 w-full rounded-full bg-[var(--fb-ink)]/8" />
                <div className="h-2 w-4/5 rounded-full bg-[var(--fb-ink)]/8" />
                <div className="h-2 w-3/5 rounded-full bg-[var(--fb-ink)]/8" />
              </div>
            </div>
          </div>

          {!reduce && (
            <motion.div
              className="pointer-events-none absolute inset-x-0 h-8 bg-gradient-to-b from-transparent via-[var(--fb-primary)]/45 to-transparent"
              style={{ filter: "blur(1px)" }}
              animate={{ top: ["-10%", "110%"] }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              aria-hidden
            />
          )}

          <div className="mt-3 overflow-hidden rounded-full bg-[var(--fb-ink)]/8">
            <motion.div
              className="h-1.5 rounded-full bg-gradient-to-r from-[var(--fb-primary)] via-[var(--fb-primary-active)] to-[var(--fb-primary)]"
              initial={false}
              animate={reduce ? { width: "72%" } : { width: ["18%", "72%", "94%", "72%"] }}
              transition={
                reduce
                  ? { duration: 0 }
                  : { duration: 2.4, repeat: Infinity, ease: "easeInOut" }
              }
            />
          </div>
        </div>

        <p className="mt-2 text-center text-xs font-medium text-[var(--fb-body)]">
          Extracting name, PAN number &amp; date of birth
        </p>
      </div>
    );
  }

  if (step.id === "match") {
    return (
      <div className="flex h-full flex-col justify-center gap-2">
        {[
          { label: "Name", value: "Adya Sharma" },
          { label: "PAN", value: "ABCDE1234F" },
          { label: "DOB", value: "12 Aug 1991" },
        ].map((field, index) => (
          <motion.div
            key={field.label}
            initial={reduce ? false : { opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="flex items-center justify-between gap-2 rounded-lg bg-card px-3 py-2 ring-1 ring-[var(--fb-ink)]/8"
          >
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-wider text-[var(--fb-mute)]">{field.label}</p>
              <p className="truncate text-sm font-semibold text-[var(--fb-ink)]">{field.value}</p>
            </div>
            <CheckCircle2 className="size-4 shrink-0 text-[var(--fb-positive)]" aria-hidden />
          </motion.div>
        ))}
      </div>
    );
  }

  if (step.id === "review") {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="flex items-center gap-3 rounded-xl bg-card p-3 ring-1 ring-[var(--fb-ink)]/8 sm:p-4">
          <div className="relative flex size-11 shrink-0 items-center justify-center rounded-full bg-[var(--fb-primary)]/15 sm:size-12">
            <ShieldCheck className="size-5 text-[var(--fb-primary)]" aria-hidden />
            {!reduce && (
              <motion.span
                className="absolute inset-0 rounded-full ring-2 ring-[var(--fb-primary)]/40"
                animate={{ scale: [1, 1.15, 1], opacity: [0.6, 0, 0.6] }}
                transition={{ duration: 2, repeat: Infinity }}
                aria-hidden
              />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-[var(--fb-ink)]">Under compliance review</p>
            <p className="mt-0.5 text-xs text-[var(--fb-mute)]">Usually approved in under 2 minutes</p>
            {!reduce && (
              <div className="mt-2 flex items-center gap-1.5 text-xs font-medium text-[var(--fb-primary)]">
                <Loader2 className="size-3.5 animate-spin" aria-hidden />
                Review in progress…
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
      <motion.div
        className="flex size-14 items-center justify-center rounded-2xl bg-[var(--fb-primary)] shadow-[0_0_32px_-4px_rgba(159,232,112,0.55)] sm:size-16"
        animate={reduce ? undefined : { scale: [1, 1.05, 1] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      >
        <Icon className="size-7 text-[var(--fb-on-primary)]" aria-hidden />
      </motion.div>
      <div>
        <p className="text-sm font-bold text-[var(--fb-ink)]">You&apos;re cleared to invest</p>
        <p className="mt-0.5 text-xs text-[var(--fb-mute)]">Portfolio unlocks when your bank is linked</p>
      </div>
    </div>
  );
}

function PipelineVisual() {
  const reduce = useReducedMotion();
  const [active, setActive] = useState(0);
  const activeStep = kycSteps[active];
  const progressPercent = (active / Math.max(kycSteps.length - 1, 1)) * 100;

  useEffect(() => {
    if (reduce) return undefined;
    const id = window.setInterval(() => {
      setActive((current) => (current + 1) % kycSteps.length);
    }, STEP_DURATION_MS);
    return () => window.clearInterval(id);
  }, [reduce]);

  return (
    <div className="relative min-w-0 rounded-[20px] border border-[var(--fb-ink)]/8 bg-card p-4 shadow-[0_16px_64px_-24px_rgba(14,15,12,0.18)] sm:p-6">
      <div className="mb-4 flex items-center justify-between gap-2 sm:mb-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--fb-mute)]">
          Live pipeline
        </p>
        <span className="flex shrink-0 items-center gap-1.5 text-[11px] font-semibold text-[var(--fb-positive-deep)]">
          <span className="relative flex size-2">
            {!reduce && (
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-[var(--fb-positive)]/70" />
            )}
            <span className="relative inline-flex size-2 rounded-full bg-[var(--fb-positive)]" />
          </span>
          Demo mode
        </span>
      </div>

      <div className="relative mb-4 h-[200px] overflow-hidden rounded-2xl bg-[var(--fb-canvas-soft)] sm:mb-5 sm:h-[210px]">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={activeStep.id}
            className="absolute inset-0 p-3 sm:p-4"
            initial={reduce ? false : STAGE_ENTER}
            animate={STAGE_VISIBLE}
            exit={reduce ? undefined : STAGE_EXIT}
            transition={STAGE_TRANSITION}
          >
            <DocumentStage step={activeStep} reduce={reduce} />
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="mb-1 flex items-center justify-between gap-2 text-[10px] font-semibold uppercase tracking-wider text-[var(--fb-mute)]">
        <span>Your progress</span>
        <span className="tabular-nums text-[var(--fb-ink)]">
          {active + 1}/{kycSteps.length}
        </span>
      </div>

      <div className="mb-4 h-1.5 overflow-hidden rounded-full bg-[var(--fb-ink)]/8">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-[var(--fb-positive)] to-[var(--fb-primary)]"
          initial={false}
          animate={{ width: `${Math.max(progressPercent, 8)}%` }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>

      <ol className="space-y-0" aria-label="KYC pipeline steps">
        {kycSteps.map((step, index) => {
          const isActive = index === active;
          const isDone = index < active;
          const isLast = index === kycSteps.length - 1;
          const StepIcon = STEP_ICONS[step.id] || Circle;

          return (
            <li key={step.id} className="flex gap-0">
              {/* Connector column — circle + line segment */}
              <div className="flex w-7 shrink-0 flex-col items-center sm:w-8">
                <span
                  className={cn(
                    "relative z-[1] flex size-6 shrink-0 items-center justify-center rounded-full transition-all duration-300",
                    isDone && "bg-[var(--fb-positive)] text-white",
                    isActive && "bg-[var(--fb-primary)] text-[var(--fb-on-primary)] ring-[3px] ring-[var(--fb-primary)]/20",
                    !isDone && !isActive && "bg-[var(--fb-ink)]/10 text-[var(--fb-mute)]"
                  )}
                >
                  {isDone ? (
                    <CheckCircle2 className="size-3.5" aria-hidden />
                  ) : (
                    <StepIcon
                      className={cn("size-3.5", isActive && step.id === "review" && !reduce && "animate-spin")}
                      aria-hidden
                    />
                  )}
                </span>
                {!isLast && (
                  <div className="relative flex w-0.5 flex-1">
                    <span className="absolute inset-0 rounded-full bg-[var(--fb-ink)]/10" aria-hidden />
                    <motion.span
                      className="absolute left-0 top-0 w-full rounded-full bg-gradient-to-b from-[var(--fb-positive)] to-[var(--fb-primary)]"
                      initial={false}
                      animate={{ height: isDone ? "100%" : isActive ? "50%" : "0%" }}
                      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                      aria-hidden
                    />
                  </div>
                )}
              </div>

              {/* Content */}
              <div
                className={cn(
                  "min-w-0 flex-1 rounded-xl py-1.5 pl-1.5 pr-2 transition-colors duration-300 sm:py-2 sm:pl-2 sm:pr-3",
                  isActive && "bg-[var(--fb-canvas-soft)]",
                  !isLast && "pb-3 sm:pb-4"
                )}
              >
                <div className="flex items-center gap-2">
                  <p
                    className={cn(
                      "flex-1 text-xs font-medium leading-snug sm:text-sm",
                      isDone || isActive ? "text-[var(--fb-ink)]" : "text-[var(--fb-mute)]"
                    )}
                  >
                    {step.title}
                  </p>
                  {isActive && (
                    <motion.span
                      layoutId="pipeline-active-pill"
                      className="shrink-0 rounded-full bg-[var(--fb-primary-pale)] px-2 py-0.5 text-[10px] font-semibold text-[var(--fb-positive-deep)]"
                    >
                      Now
                    </motion.span>
                  )}
                  {isDone && (
                    <span className="shrink-0 text-[10px] font-medium text-[var(--fb-positive)]">
                      Done
                    </span>
                  )}
                </div>
                {isActive && (
                  <motion.p
                    initial={reduce ? false : { opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="mt-0.5 text-[11px] leading-snug text-[var(--fb-body)] sm:text-xs"
                  >
                    {step.detail}
                  </motion.p>
                )}
              </div>
            </li>
          );
        })}
      </ol>

      <div className="mt-4 grid grid-cols-3 gap-2 border-t border-[var(--fb-ink)]/6 pt-4 sm:mt-5 sm:gap-3 sm:pt-5">
        {[
          { label: "Document accuracy", value: "94.2%" },
          { label: "Typical review", value: "< 2 min" },
          { label: "Time to invest", value: "~4 min" },
        ].map((metric, index) => (
          <div
            key={metric.label}
            className={cn(
              "min-w-0 text-center sm:text-left",
              index > 0 && "border-l border-[var(--fb-ink)]/8 pl-2 sm:border-l-0 sm:pl-0"
            )}
          >
            <p className="text-[9px] font-semibold uppercase leading-tight tracking-wide text-[var(--fb-mute)] sm:text-[10px]">
              {metric.label}
            </p>
            <p className="mt-0.5 text-xs font-bold text-[var(--fb-ink)] sm:mt-1 sm:text-sm">{metric.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function HeroSection() {
  const reduce = useReducedMotion();

  return (
    <section className="relative overflow-hidden lg:max-h-[calc(100vh-4rem)]">
      <div className="relative mx-auto grid min-w-0 max-w-[1200px] gap-10 px-4 pb-16 pt-8 sm:gap-12 sm:px-5 sm:pb-20 sm:pt-10 md:px-8 md:pb-28 md:pt-12 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-16 lg:pb-32 lg:pt-14">
        <div className="min-w-0">
          <Reveal>
            <h1 className="text-[clamp(2.25rem,7vw,5.5rem)] font-black leading-[0.92] tracking-[-0.045em] text-[var(--fb-ink)] sm:max-w-[14ch]">
              Onboard
              <span className="block text-[var(--fb-ink-deep)]">investors</span>
              <span className="block text-[var(--fb-body)]">without the friction.</span>
            </h1>
          </Reveal>

          <Reveal delay={0.1}>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-[var(--fb-body)] md:text-xl">
              Verify your identity, link your bank account, and start investing —
              all in one place, in minutes.
            </p>
          </Reveal>

          <Reveal delay={0.18}>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
              <Button
                asChild
                className="h-11 w-full gap-2 rounded-2xl bg-[var(--fb-primary)] px-6 text-base font-semibold text-[var(--fb-on-primary)] hover:bg-[var(--fb-primary-active)] sm:h-12 sm:w-auto"
              >
                <Link href="/signup">
                  Create investor account
                  <ArrowRight className="size-4" aria-hidden />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="h-11 w-full rounded-2xl border-[var(--fb-ink)] bg-card px-6 text-base font-semibold text-[var(--fb-ink)] hover:bg-[var(--card)]/80 sm:h-12 sm:w-auto"
              >
                <Link href="/signin">View live demo</Link>
              </Button>
            </div>
          </Reveal>

          <Reveal delay={0.24}>
            <dl className="mt-8 grid grid-cols-3 border-t border-[var(--fb-ink)]/10 pt-6 sm:mt-10 sm:max-w-lg sm:pt-8">
              {[
                { k: "< 5 min", v: "from signup to first investment" },
                { k: "₹2", v: "bank verification, refunded instantly" },
                { k: "100%", v: "secure, audited onboarding" },
              ].map((item, index) => (
                <div
                  key={item.v}
                  className={cn(
                    "flex min-w-0 flex-col items-center px-2 text-center sm:items-start sm:px-0 sm:text-left",
                    index > 0 && "border-l border-[var(--fb-ink)]/10 sm:border-l-0"
                  )}
                >
                  <dt className="text-lg font-black leading-none tracking-tight text-[var(--fb-ink)] sm:text-2xl">
                    {item.k}
                  </dt>
                  <dd className="mt-1.5 text-[10px] font-medium leading-snug text-[var(--fb-mute)] sm:mt-1 sm:text-xs sm:uppercase sm:tracking-wider">
                    {item.v}
                  </dd>
                </div>
              ))}
            </dl>
          </Reveal>
        </div>

        <Reveal delay={reduce ? 0 : 0.15} className="min-w-0">
          <PipelineVisual />
        </Reveal>
      </div>

      {!reduce && (
        <motion.div
          aria-hidden
          className="absolute bottom-0 left-1/2 h-px w-[min(90%,900px)] -translate-x-1/2 bg-gradient-to-r from-transparent via-[var(--fb-ink)]/15 to-transparent"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 0.4, duration: 1.2 }}
        />
      )}
    </section>
  );
}
