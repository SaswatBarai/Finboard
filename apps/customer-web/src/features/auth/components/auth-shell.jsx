import Link from "next/link";
import { ShieldCheck, Lock, Zap } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { FinboardMark } from "@/components/ui/finboard-logo";
import { ThemeSelector } from "@/components/theme-selector";

const INVESTOR_TRUST = [
  { icon: ShieldCheck, label: "Identity verified securely"  },
  { icon: Lock,        label: "End-to-end encryption"      },
  { icon: Zap,         label: "Account ready in minutes"   },
];

const ADMIN_TRUST = [
  { icon: ShieldCheck, label: "Role-based access control"  },
  { icon: Lock,        label: "Full audit trail"           },
  { icon: Zap,         label: "Compliance workflows"       },
];

function LeftPanel({ variant }) {
  const isAdmin = variant === "admin";
  const trust   = isAdmin ? ADMIN_TRUST : INVESTOR_TRUST;

  return (
    <section className="relative hidden flex-col justify-between overflow-hidden bg-[#0e0f0c] p-10 lg:flex xl:p-16">
      {/* Ambient glows */}
      <div className="pointer-events-none absolute -left-24 -top-24 size-80 rounded-full bg-[var(--fb-primary)]/10 blur-[90px]" aria-hidden />
      <div className="pointer-events-none absolute -bottom-16 right-0 size-64 rounded-full bg-[var(--fb-accent-cyan)]/8 blur-[70px]" aria-hidden />

      {/* Logo */}
      <Link href="/" className="group relative z-10 inline-flex items-center gap-2.5">
        <span className="transition-transform duration-300 group-hover:scale-[1.04]">
          <FinboardMark size={36} />
        </span>
        <span className="text-[17px] font-black tracking-[-0.045em] text-[var(--fb-primary)]">
          Finboard
        </span>
      </Link>

      {/* Hero content */}
      <div className="relative z-10 space-y-8">
        {/* Icon badge */}
        <div className="flex size-14 items-center justify-center rounded-[18px] bg-[var(--fb-primary)]/12 ring-1 ring-[var(--fb-primary)]/20">
          <ShieldCheck className="size-7 text-[var(--fb-primary)]" aria-hidden />
        </div>

        {/* Copy */}
        <div className="space-y-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[var(--fb-primary)]/55">
            {isAdmin ? "Admin access" : "Investor access"}
          </p>
          <h1 className="max-w-[22ch] text-[2.1rem] font-black leading-[1.04] tracking-[-0.04em] text-white">
            {isAdmin
              ? "Compliance and review, in one place."
              : "From identity to investment — in minutes."}
          </h1>
          <p className="max-w-[36ch] text-[15px] leading-relaxed text-white/60">
            {isAdmin
              ? "Review investor applications, approve accounts, and manage compliance workflows — all with a full audit trail."
              : "Verify your identity, link your bank account, and start investing — without waiting days or switching between apps."}
          </p>
        </div>

        <Separator className="bg-[var(--fb-primary)]/12" />

        {/* Trust indicators */}
        <ul className="space-y-3.5">
          {trust.map(({ icon: Icon, label }) => (
            <li key={label} className="flex items-center gap-3 text-sm text-white/65">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-[10px] bg-[var(--fb-primary)]/10 ring-1 ring-[var(--fb-primary)]/18">
                <Icon className="size-3.5 text-[var(--fb-primary)]" aria-hidden />
              </span>
              {label}
            </li>
          ))}
        </ul>
      </div>

      {/* Footer note */}
      <p className="relative z-10 text-[11px] text-white/25">
        For demonstration purposes — transaction values are simulated.
      </p>
    </section>
  );
}

export default function AuthShell({ title, subtitle, children, variant = "investor" }) {
  return (
    <main className="min-h-screen bg-[var(--fb-canvas-soft)]">

      {/* Mobile top bar */}
      <header className="border-b border-[var(--fb-ink)]/8 bg-card lg:hidden">
        <div className="mx-auto flex h-14 max-w-lg items-center justify-between px-6">
          <Link href="/" className="inline-flex items-center gap-2.5">
            <FinboardMark size={30} />
            <span className="text-[15px] font-black tracking-[-0.04em] text-[var(--fb-ink)]">
              Finboard
            </span>
          </Link>
          <ThemeSelector />
        </div>
      </header>

      <div className="grid min-h-[calc(100vh-3.5rem)] lg:min-h-screen lg:grid-cols-2">
        <LeftPanel variant={variant} />

        {/* Right — form column */}
        <section className="flex items-center justify-center px-5 py-12 sm:px-8 lg:px-12">
          <div className="w-full max-w-[420px]">

            {/* Mobile eyebrow */}
            <p className="mb-5 text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--fb-mute)] lg:hidden">
              {variant === "admin" ? "Admin access" : "Investor access"}
            </p>

            {/* Form card — elevated surface */}
            <div className="overflow-hidden rounded-[28px] border border-border bg-card shadow-[0_20px_64px_-24px_rgba(14,15,12,0.2)] dark:shadow-[0_0_0_1px_rgba(232,235,230,0.08)]">

              {/* Card header */}
              <div className="border-b border-[var(--fb-ink)]/6 px-7 pb-5 pt-7">
                <h2 className="text-[1.6rem] font-black leading-tight tracking-[-0.04em] text-[var(--fb-ink)]">
                  {title}
                </h2>
                <p className="mt-1.5 text-sm leading-relaxed text-[var(--fb-body)]">
                  {subtitle}
                </p>
              </div>

              {/* Card body */}
              <div className="px-7 pb-7 pt-5">
                {children}
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
