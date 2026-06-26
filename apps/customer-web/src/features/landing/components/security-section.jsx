"use client";

import { Lock, Server, Shield } from "lucide-react";
import { DisplayHeading, Eyebrow, Reveal, SectionInner, SectionShell } from "./primitives";

const pillars = [
  {
    icon: Shield,
    title: "Role-scoped access",
    body: "JWT middleware enforces user, admin, RTA, and AMC roles on every protected route — mirrored on the frontend with ProtectedRoute."
  },
  {
    icon: Lock,
    title: "Audit on every KYC decision",
    body: "Submit, approve, and reject events write append-only audit records with actor, IP, and user-agent context."
  },
  {
    icon: Server,
    title: "Secrets stay in env",
    body: "Database URLs, JWT secrets, Twilio keys, and OpenRouter tokens live in environment configuration — never in source."
  }
];

export default function SecuritySection() {
  return (
    <SectionShell id="security" tone="ink">
      <SectionInner>
        <Reveal>
          <Eyebrow className="text-[var(--fb-primary)]/70">Security & compliance</Eyebrow>
          <DisplayHeading className="mt-4 max-w-2xl text-4xl text-[var(--fb-primary)] md:text-5xl">
            Trust is engineered — not marketed.
          </DisplayHeading>
        </Reveal>

        <div className="mt-12 grid gap-5 lg:grid-cols-3">
          {pillars.map((item, index) => (
            <Reveal
              key={item.title}
              delay={index * 0.08}
              className="rounded-[28px] border border-[var(--fb-primary)]/15 bg-[var(--fb-ink-deep)]/40 p-6"
            >
              <item.icon className="size-5 text-[var(--fb-primary)]" aria-hidden />
              <h3 className="mt-4 text-xl font-bold text-[var(--fb-primary)]">{item.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-[var(--fb-primary)]/75">{item.body}</p>
            </Reveal>
          ))}
        </div>
      </SectionInner>
    </SectionShell>
  );
}
