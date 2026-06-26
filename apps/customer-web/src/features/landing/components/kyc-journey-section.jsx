"use client";

import { CheckCircle2, FileSearch, Landmark, LineChart, Upload, UserCheck } from "lucide-react";
import { DisplayHeading, Eyebrow, Reveal, SectionInner, SectionShell } from "./primitives";

const journey = [
  { icon: Upload, label: "Upload PAN & Aadhaar", detail: "Validated multipart capture" },
  { icon: FileSearch, label: "OCR extraction", detail: "Tesseract + structured parsing" },
  { icon: UserCheck, label: "Identity match", detail: "Seeded dataset + admin review" },
  { icon: CheckCircle2, label: "KYC approved", detail: "Profile status unlocked" },
  { icon: Landmark, label: "Bank verified", detail: "Rs. 2 debit + auto refund" },
  { icon: LineChart, label: "Invest", detail: "Stocks, MF, SIP" }
];

export default function KycJourneySection() {
  return (
    <SectionShell id="journey" tone="soft">
      <SectionInner>
        <div className="max-w-2xl">
          <Reveal>
            <Eyebrow>KYC journey</Eyebrow>
            <DisplayHeading className="mt-4 text-4xl md:text-5xl">
              From document upload to first investment — visualized.
            </DisplayHeading>
          </Reveal>
        </div>

        <div className="mt-14 overflow-x-auto pb-2">
          <ol className="flex min-w-[720px] gap-0 md:min-w-0 md:grid md:grid-cols-6">
            {journey.map((step, index) => (
              <Reveal key={step.label} delay={index * 0.06} className="relative flex-1 px-2 md:px-3">
                {index < journey.length - 1 ? (
                  <span
                    className="absolute left-[calc(50%+20px)] top-6 hidden h-px w-[calc(100%-40px)] bg-[var(--fb-ink)]/15 md:block"
                    aria-hidden
                  />
                ) : null}
                <div className="flex flex-col items-center text-center">
                  <div className="flex size-12 items-center justify-center rounded-2xl border border-[var(--fb-ink)]/10 bg-white shadow-sm">
                    <step.icon className="size-5 text-[var(--fb-ink-deep)]" aria-hidden />
                  </div>
                  <p className="mt-4 text-sm font-bold text-[var(--fb-ink)]">{step.label}</p>
                  <p className="mt-1 text-xs leading-relaxed text-[var(--fb-body)]">{step.detail}</p>
                </div>
              </Reveal>
            ))}
          </ol>
        </div>

        <Reveal delay={0.2}>
          <div className="mt-16 grid overflow-hidden rounded-[32px] bg-[var(--fb-ink)] lg:grid-cols-[1.1fr_0.9fr]">
            <div className="p-8 md:p-10">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--fb-primary)]/70">Admin view</p>
              <h3 className="mt-3 text-3xl font-black tracking-tight text-[var(--fb-primary)]">
                Side-by-side review, not blind approval.
              </h3>
              <p className="mt-4 max-w-lg text-base leading-relaxed text-[var(--fb-primary)]/75">
                RTA admins compare entered PAN/Aadhaar, seeded identity data, and OCR output in one screen — with
                approve/reject actions that write notifications and audit entries automatically.
              </p>
            </div>
            <div className="bg-[var(--fb-primary-pale)] p-6 md:p-8">
              <div className="space-y-3 rounded-2xl bg-white p-4">
                {["Name match", "PAN dataset", "Aadhaar dataset", "OCR PAN", "OCR Aadhaar"].map((check, i) => (
                  <div key={check} className="flex items-center justify-between text-sm">
                    <span className="font-medium text-[var(--fb-ink)]">{check}</span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                        i < 4 ? "bg-[var(--fb-primary-pale)] text-[var(--fb-positive-deep)]" : "bg-[var(--fb-canvas-soft)] text-[var(--fb-mute)]"
                      }`}
                    >
                      {i < 4 ? "Matched" : "Review"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Reveal>
      </SectionInner>
    </SectionShell>
  );
}
