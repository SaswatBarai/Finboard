"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowUpRight, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { navLinks, navSectionIds } from "../data/content";
import { scrollToSection, useActiveSection } from "../lib/use-active-section";

function FinboardMark({ compact = false }) {
  return (
    <Link href="/" className="group relative flex items-center gap-3">
      <span
        className={cn(
          "relative flex shrink-0 items-center justify-center overflow-hidden rounded-[14px] bg-[var(--fb-ink)] transition-transform duration-300 group-hover:scale-[1.03]",
          compact ? "size-8" : "size-10"
        )}
        aria-hidden
      >
        <span className="absolute inset-x-1 bottom-1.5 top-2 rounded-md bg-[var(--fb-primary)]/90" />
        <span className="absolute inset-x-2.5 bottom-2.5 top-3.5 rounded-sm bg-[var(--fb-primary)]" />
      </span>
      <span className="flex flex-col leading-none">
        <span
          className={cn(
            "font-black tracking-[-0.04em] text-[var(--fb-ink)]",
            compact ? "text-base" : "text-lg"
          )}
        >
          Finboard
        </span>
        {!compact ? (
          <span className="mt-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--fb-mute)]">
            KYC · Banking · Invest
          </span>
        ) : null}
      </span>
    </Link>
  );
}

function NavLinkItem({ link, active, onNavigate, onSelect, variant = "desktop" }) {
  const isActive = active === link.id;

  const handleClick = (event) => {
    event.preventDefault();
    onSelect(link.id);
    scrollToSection(link.id);
    onNavigate?.();
  };

  if (variant === "mobile") {
    return (
      <a
        href={link.href}
        onClick={handleClick}
        className="group flex items-end justify-between border-b border-[var(--fb-ink)]/8 py-5"
      >
        <span className="flex flex-col gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--fb-mute)]">
            {link.index}
          </span>
          <span className="text-3xl font-black tracking-[-0.03em] text-[var(--fb-ink)]">{link.label}</span>
        </span>
        <ArrowUpRight
          className={cn(
            "size-5 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5",
            isActive ? "text-[var(--fb-positive-deep)]" : "text-[var(--fb-mute)]"
          )}
          aria-hidden
        />
      </a>
    );
  }

  return (
    <a
      href={link.href}
      onClick={handleClick}
      aria-current={isActive ? "true" : undefined}
      className={cn(
        "relative rounded-full px-3.5 py-2 text-[13px] font-semibold tracking-[-0.01em] transition-colors duration-200 xl:px-4",
        isActive ? "text-[var(--fb-ink)]" : "text-[var(--fb-body)] hover:text-[var(--fb-ink)]"
      )}
    >
      {isActive ? (
        <motion.span
          layoutId="landing-nav-active"
          className="absolute inset-0 rounded-full bg-[var(--fb-primary-pale)] ring-1 ring-[var(--fb-ink)]/6"
          transition={{ type: "spring", stiffness: 380, damping: 32 }}
        />
      ) : null}
      <span className="relative">{link.label}</span>
    </a>
  );
}

export default function LandingNav() {
  const reduce = useReducedMotion();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { active, setManualActive } = useActiveSection(navSectionIds);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 48);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header data-landing-nav className="sticky top-0 z-50 px-4 pt-3 md:px-6 md:pt-4">
      <div className="mx-auto max-w-[1180px]">
        <AnimatePresence initial={false}>
          {!scrolled && !reduce ? (
            <motion.div
              key="nav-ribbon"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="mb-3 flex items-center justify-center gap-2.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--fb-mute)]">
                <span className="relative flex size-2" aria-hidden>
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-[var(--fb-positive)] opacity-30" />
                  <span className="relative size-2 rounded-full bg-[var(--fb-positive)]" />
                </span>
                Live demo platform
                <span className="text-[var(--fb-ink)]/20">·</span>
                Mongo + Postgres
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>

        <div
          className={cn(
            "flex items-center justify-between gap-3 transition-all duration-500 ease-out",
            scrolled
              ? "rounded-[22px] border border-[var(--fb-ink)]/10 bg-white/92 px-3 py-2.5 shadow-[0_16px_48px_-24px_rgba(14,15,12,0.35)] backdrop-blur-xl md:px-4"
              : "rounded-[22px] border border-transparent bg-white/55 px-2 py-2 backdrop-blur-sm md:px-3"
          )}
        >
          <FinboardMark compact={scrolled} />

          <nav
            className="absolute left-1/2 hidden -translate-x-1/2 items-center rounded-full border border-[var(--fb-ink)]/8 bg-[var(--fb-canvas-soft)]/80 p-1 lg:flex"
            aria-label="Primary"
          >
            {navLinks.map((link) => (
              <NavLinkItem key={link.id} link={link} active={active} onSelect={setManualActive} />
            ))}
          </nav>

          <div className="flex items-center gap-1.5 sm:gap-2">
            <Link
              href="/signin"
              className="hidden rounded-full px-3 py-2 text-sm font-semibold text-[var(--fb-body)] transition-colors hover:text-[var(--fb-ink)] sm:inline-flex"
            >
              Sign in
            </Link>
            <Button
              asChild
              className="hidden h-10 gap-1.5 rounded-full bg-[var(--fb-ink)] px-4 text-sm font-semibold text-[var(--fb-primary)] hover:bg-[var(--fb-ink-deep)] sm:inline-flex"
            >
              <Link href="/signup">
                Open demo
                <ArrowUpRight className="size-3.5" aria-hidden />
              </Link>
            </Button>

            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger
                render={
                  <Button
                    variant="outline"
                    size="icon"
                    className="rounded-full border-[var(--fb-ink)]/12 bg-white text-[var(--fb-ink)] lg:hidden"
                    aria-label="Open menu"
                  />
                }
              >
                <Menu className="size-4" />
              </SheetTrigger>
              <SheetContent
                side="right"
                className="flex h-full w-full flex-col border-[var(--fb-ink)]/10 bg-[var(--fb-canvas-soft)] p-0 sm:max-w-md"
              >
                <SheetHeader className="border-b border-[var(--fb-ink)]/8 px-6 py-5 text-left">
                  <SheetTitle className="font-black tracking-[-0.03em] text-[var(--fb-ink)]">Navigate</SheetTitle>
                  <SheetDescription className="text-[var(--fb-body)]">
                    Walk through the product story section by section.
                  </SheetDescription>
                </SheetHeader>

                <nav className="flex flex-col px-6" aria-label="Mobile">
                  {navLinks.map((link) => (
                    <NavLinkItem
                      key={link.id}
                      link={link}
                      active={active}
                      onSelect={setManualActive}
                      variant="mobile"
                      onNavigate={() => setMobileOpen(false)}
                    />
                  ))}
                </nav>

                <div className="mt-auto border-t border-[var(--fb-ink)]/8 px-6 py-6">
                  <Button
                    asChild
                    className="h-12 w-full gap-2 rounded-2xl bg-[var(--fb-primary)] text-base font-semibold text-[var(--fb-on-primary)] hover:bg-[var(--fb-primary-active)]"
                  >
                    <Link href="/signup" onClick={() => setMobileOpen(false)}>
                      Start onboarding
                      <ArrowUpRight className="size-4" aria-hidden />
                    </Link>
                  </Button>
                  <Link
                    href="/signin"
                    onClick={() => setMobileOpen(false)}
                    className="mt-4 block text-center text-sm font-semibold text-[var(--fb-body)] hover:text-[var(--fb-ink)]"
                  >
                    Already have an account? Sign in
                  </Link>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
