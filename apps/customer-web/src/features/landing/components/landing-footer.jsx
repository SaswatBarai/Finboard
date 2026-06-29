"use client";

import Link from "next/link";
import { FinboardMark } from "@/components/ui/finboard-logo";
import { navLinks, techStack } from "../data/content";

const productLinks = [
  { href: "/signup", label: "Sign up" },
  { href: "/signin", label: "Sign in" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/admin/login", label: "Admin" }
];

function FooterColumn({ title, children }) {
  return (
    <div className="min-w-0">
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--fb-primary)]/60">
        {title}
      </p>
      {children}
    </div>
  );
}

export default function LandingFooter() {
  return (
    <footer className="overflow-hidden bg-[#0e0f0c]">
      <div
        className="pointer-events-none h-px bg-gradient-to-r from-transparent via-[var(--fb-primary)]/30 to-transparent"
        aria-hidden
      />

      <div className="mx-auto max-w-[1200px] px-4 py-10 sm:px-5 sm:py-14 md:px-8">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)] lg:items-start lg:gap-16 xl:gap-20">
          {/* Brand */}
          <section className="border-b border-[var(--fb-primary)]/10 pb-8 sm:pb-10 lg:border-b-0 lg:pb-0">
            <Link href="/" className="inline-flex items-center gap-2.5 transition-opacity hover:opacity-90">
              <FinboardMark size={36} />
              <span className="text-xl font-black tracking-tight text-[var(--fb-primary)] sm:text-2xl">
                Finboard
              </span>
            </Link>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-[#e8ebe6]/75">
              From identity verification to your first investment — Finboard gives you a fast, secure,
              and fully auditable path to the markets.
            </p>
          </section>

          {/* Link columns — spread across the full right half on large screens */}
          <nav
            className="grid grid-cols-2 gap-8 border-t border-[var(--fb-primary)]/10 pt-8 sm:gap-10 sm:pt-10 md:grid-cols-3 lg:border-t-0 lg:pt-0"
            aria-label="Footer navigation"
          >
            <FooterColumn title="Explore">
              <ul className="mt-3 space-y-1 sm:mt-4 sm:space-y-2">
                {navLinks.map((link) => (
                  <li key={link.href}>
                    <a
                      href={link.href}
                      className="block py-1.5 text-sm text-[#e8ebe6]/80 transition-colors duration-200 hover:text-[var(--fb-primary)]"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </FooterColumn>

            <FooterColumn title="Product">
              <ul className="mt-3 space-y-1 sm:mt-4 sm:space-y-2">
                {productLinks.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="block py-1.5 text-sm text-[#e8ebe6]/80 transition-colors duration-200 hover:text-[var(--fb-primary)]"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </FooterColumn>

            <FooterColumn title="Trust">
              <ul className="col-span-2 mt-3 space-y-1 sm:mt-4 sm:space-y-2 md:col-span-1">
                {techStack.map((item) => (
                  <li
                    key={item}
                    className="flex items-center gap-2 py-1.5 text-sm text-[#e8ebe6]/80"
                  >
                    <span
                      className="size-1 shrink-0 rounded-full bg-[var(--fb-primary)]/70"
                      aria-hidden
                    />
                    {item}
                  </li>
                ))}
              </ul>
            </FooterColumn>
          </nav>
        </div>
      </div>

      <div className="border-t border-[var(--fb-primary)]/10">
        <div className="mx-auto flex max-w-[1200px] flex-col gap-2 px-4 py-5 text-[11px] leading-relaxed text-[#e8ebe6]/50 sm:flex-row sm:items-center sm:justify-between sm:px-5 sm:py-6 md:px-8 md:text-xs">
          <span>© {new Date().getFullYear()} Finboard</span>
          <span className="text-center sm:text-right">
            For demonstration purposes — transaction values are simulated.
          </span>
        </div>
      </div>
    </footer>
  );
}
