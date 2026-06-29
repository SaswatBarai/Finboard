"use client";

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { faqItems } from "../data/content";
import { DisplayHeading, Eyebrow, Reveal, SectionInner, SectionShell } from "./primitives";

export default function FaqSection() {
  return (
    <SectionShell id="faq" tone="soft" aria-labelledby="faq-heading">
      <SectionInner className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
        <Reveal className="min-w-0">
          <Eyebrow>FAQ</Eyebrow>
          <DisplayHeading id="faq-heading" className="mt-4 text-3xl sm:text-4xl md:text-5xl">
            Questions investors ask first.
          </DisplayHeading>
        </Reveal>

        <Reveal delay={0.1} className="min-w-0">
          <Accordion className="rounded-[24px] border border-[var(--fb-ink)]/10 bg-card px-1 sm:rounded-[28px] sm:px-2">
            {faqItems.map((item, index) => (
              <AccordionItem key={item.q} value={`item-${index}`} className="border-[var(--fb-ink)]/8 px-3 sm:px-4">
                <AccordionTrigger className="py-4 text-left text-sm font-semibold text-[var(--fb-ink)] hover:no-underline sm:py-5 sm:text-base">
                  {item.q}
                </AccordionTrigger>
                <AccordionContent className="pb-5 text-sm leading-relaxed text-[var(--fb-body)]">{item.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </Reveal>
      </SectionInner>
    </SectionShell>
  );
}
