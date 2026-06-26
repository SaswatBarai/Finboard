"use client";

import { ScanLine, Sparkles } from "lucide-react";
import { DisplayHeading, Eyebrow, Reveal, SectionInner, SectionShell } from "./primitives";

export default function OcrSection() {
  return (
    <SectionShell tone="white">
      <SectionInner className="grid gap-12 lg:grid-cols-2 lg:items-center">
        <Reveal>
          <Eyebrow>OCR intelligence</Eyebrow>
          <DisplayHeading className="mt-4 text-4xl md:text-5xl">
            Documents become structured data — not dead PDFs.
          </DisplayHeading>
          <p className="mt-6 text-lg leading-relaxed text-[var(--fb-body)]">
            Tesseract.js reads uploaded PAN and Aadhaar images locally. When configured, OpenRouter adds structured JSON
            extraction on top — with regex fallback when the network is unavailable.
          </p>
          <ul className="mt-8 space-y-3 text-sm text-[var(--fb-body)]">
            <li className="flex gap-2"><ScanLine className="mt-0.5 size-4 shrink-0" /> Local OCR — no cloud dependency required</li>
            <li className="flex gap-2"><Sparkles className="mt-0.5 size-4 shrink-0" /> Optional LLM parsing for name + ID fields</li>
            <li className="flex gap-2"><ScanLine className="mt-0.5 size-4 shrink-0" /> Mismatch flags surfaced to admins</li>
          </ul>
        </Reveal>

        <Reveal delay={0.12}>
          <div className="rounded-[28px] border border-[var(--fb-ink)] bg-white p-6 font-mono text-sm shadow-[0_20px_60px_-30px_rgba(14,15,12,0.25)]">
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--fb-mute)]">Extracted preview</p>
            <pre className="mt-4 overflow-x-auto whitespace-pre-wrap rounded-2xl bg-[var(--fb-canvas-soft)] p-4 text-[13px] leading-relaxed text-[var(--fb-ink)]">
{`{
  "type": "pan",
  "extracted": {
    "name": "ADYA SHARMA",
    "panNumber": "ABCDE1234F"
  },
  "extractionSource": "tesseract_openrouter",
  "match": true
}`}
            </pre>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-[var(--fb-primary-pale)] px-3 py-2">
                <p className="text-[10px] uppercase tracking-wider text-[var(--fb-mute)]">Raw OCR</p>
                <p className="mt-1 text-xs text-[var(--fb-ink)]">INCOME TAX DEPARTMENT · GOVT OF INDIA</p>
              </div>
              <div className="rounded-xl bg-[var(--fb-canvas-soft)] px-3 py-2">
                <p className="text-[10px] uppercase tracking-wider text-[var(--fb-mute)]">Confidence path</p>
                <p className="mt-1 text-xs text-[var(--fb-ink)]">Regex fallback if LLM unavailable</p>
              </div>
            </div>
          </div>
        </Reveal>
      </SectionInner>
    </SectionShell>
  );
}
