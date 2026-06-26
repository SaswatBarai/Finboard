import Link from "next/link";
import { Badge } from "@/components/ui/badge";

const footerGroups = [
  ["Platform", ["Stocks", "Mutual Funds", "Banking", "KYC", "Documents"]],
  ["Operations", ["RTA Console", "AMC Desk", "Audit Trail", "OCR Review", "Folio Records"]],
  ["Resources", ["Risk Disclosure", "Demo Data", "API Status", "Security", "Support"]]
];

function linkFor(label) {
  if (label === "Banking") return "/banking";
  if (label === "KYC") return "/kyc";
  if (label === "Documents") return "/documents";
  return "/dashboard";
}

export default function Footer() {
  return (
    <footer className="mt-8 bg-[var(--ink)] text-[var(--canvas-soft)]">
      <div className="mx-auto grid max-w-7xl gap-10 px-6 py-12 lg:grid-cols-[1fr_1.3fr]">
        <section className="space-y-4">
          <Link href="/dashboard" className="inline-flex items-center gap-2 text-lg font-semibold text-white">
            <span className="size-9 rounded-full bg-primary" />
            Finboard
          </Link>
          <p className="max-w-md text-sm text-[var(--canvas-soft)]/80">
            A simulated investor onboarding, KYC, banking, RTA, AMC, and market operations platform for learning enterprise fintech workflows.
          </p>
          <div className="flex flex-wrap gap-2">
            {["MongoDB Auth", "PostgreSQL Banking", "OCR Assisted KYC"].map((item) => (
              <Badge key={item} variant="outline" className="rounded-full border-white/20 bg-transparent text-white">
                {item}
              </Badge>
            ))}
          </div>
        </section>

        <nav className="grid gap-8 sm:grid-cols-3" aria-label="Footer navigation">
          {footerGroups.map(([title, links]) => (
            <div key={title} className="space-y-3">
              <strong className="text-sm text-white">{title}</strong>
              <div className="flex flex-col gap-2">
                {links.map((label) => (
                  <Link key={label} href={linkFor(label)} className="text-sm text-[var(--canvas-soft)]/75 hover:text-white">
                    {label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </nav>
      </div>
      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-6 py-4 text-xs text-[var(--canvas-soft)]/70 sm:flex-row sm:items-center sm:justify-between">
          <span>Finboard Simulation Suite</span>
          <span>For demo and education only. No real bank, exchange, broker, RTA, or AMC integration.</span>
        </div>
      </div>
    </footer>
  );
}
