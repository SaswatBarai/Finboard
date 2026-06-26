"use client";

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { faqItems } from "../data/content";
import { DisplayHeading, Eyebrow, Reveal, SectionInner, SectionShell } from "./primitives";

export default function FaqSection() {
  return (
    <SectionShell id="faq" tone="soft">
      <SectionInner className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
        <Reveal>
          <Eyebrow>FAQ</Eyebrow>
          <DisplayHeading className="mt-4 text-4xl md:text-5xl">Questions investors and engineers ask first.</DisplayHeading>
        </Reveal>

        <Reveal delay={0.1}>
          <Accordion className="rounded-[28px] border border-[var(--fb-ink)]/10 bg-white px-2">
            {faqItems.map((item, index) => (
              <AccordionItem key={item.q} value={`item-${index}`} className="border-[var(--fb-ink)]/8 px-4">
                <AccordionTrigger className="py-5 text-left text-base font-semibold text-[var(--fb-ink)] hover:no-underline">
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
