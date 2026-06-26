"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Reveal, SectionInner, SectionShell } from "./primitives";

export default function CtaSection() {
  return (
    <SectionShell tone="white">
      <SectionInner>
        <Reveal>
          <div className="relative overflow-hidden rounded-[36px] bg-[var(--fb-ink)] px-6 py-12 md:px-12 md:py-16">
            <div className="pointer-events-none absolute -right-10 top-0 size-56 rounded-full bg-[var(--fb-primary)]/20 blur-3xl" aria-hidden />
            <div className="relative max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--fb-primary)]/70">Ready when you are</p>
              <h2 className="mt-4 text-4xl font-black tracking-tight text-[var(--fb-primary)] md:text-5xl">
                Start the onboarding journey in under five minutes.
              </h2>
              <p className="mt-4 text-lg leading-relaxed text-[var(--fb-primary)]/75">
                Create an account, complete KYC, verify a bank, and place your first demo investment — all in one
                cohesive product surface.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button
                  asChild
                  className="h-12 gap-2 rounded-2xl bg-[var(--fb-primary)] px-6 text-base font-semibold text-[var(--fb-on-primary)] hover:bg-[var(--fb-primary-active)]"
                >
                  <Link href="/signup">
                    Get started free
                    <ArrowRight className="size-4" aria-hidden />
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="h-12 rounded-2xl border-[var(--fb-primary)]/40 bg-transparent px-6 text-base font-semibold text-[var(--fb-primary)] hover:bg-[var(--fb-primary)]/10"
                >
                  <Link href="/admin/login">Admin demo login</Link>
                </Button>
              </div>
            </div>
          </div>
        </Reveal>
      </SectionInner>
    </SectionShell>
  );
}
