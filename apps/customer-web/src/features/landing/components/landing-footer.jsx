"use client";

import Link from "next/link";
import { navLinks } from "../data/content";

export default function LandingFooter() {
  return (
    <footer className="bg-[var(--fb-ink)] text-[var(--fb-canvas-soft)]">
      <div className="mx-auto grid max-w-[1200px] gap-10 px-5 py-16 md:grid-cols-[1.2fr_1fr_1fr] md:px-8">
        <div>
          <p className="text-2xl font-black tracking-tight text-[var(--fb-primary)]">Finboard</p>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-[var(--fb-canvas-soft)]/80">
            A demo-grade fintech platform for KYC onboarding, dummy core banking, and investment flows — built for
            learning and product storytelling.
          </p>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--fb-primary)]/60">Explore</p>
          <ul className="mt-4 space-y-2">
            {navLinks.map((link) => (
              <li key={link.href}>
                <a href={link.href} className="text-sm text-[var(--fb-canvas-soft)]/85 hover:text-[var(--fb-primary)]">
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--fb-primary)]/60">Product</p>
          <ul className="mt-4 space-y-2 text-sm text-[var(--fb-canvas-soft)]/85">
            <li><Link href="/signup" className="hover:text-[var(--fb-primary)]">Sign up</Link></li>
            <li><Link href="/signin" className="hover:text-[var(--fb-primary)]">Sign in</Link></li>
            <li><Link href="/dashboard" className="hover:text-[var(--fb-primary)]">Dashboard</Link></li>
            <li><Link href="/admin/login" className="hover:text-[var(--fb-primary)]">Admin</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-[var(--fb-primary)]/10">
        <p className="mx-auto max-w-[1200px] px-5 py-6 text-xs text-[var(--fb-canvas-soft)]/60 md:px-8">
          © {new Date().getFullYear()} Finboard. Demo platform — not connected to real financial institutions.
        </p>
      </div>
    </footer>
  );
}
