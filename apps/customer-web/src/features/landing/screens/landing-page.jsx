"use client";

import BankingSection from "../components/banking-section";
import CtaSection from "../components/cta-section";
import FaqSection from "../components/faq-section";
import HeroSection from "../components/hero-section";
import InvestmentSection from "../components/investment-section";
import KycJourneySection from "../components/kyc-journey-section";
import LandingFooter from "../components/landing-footer";
import LandingMobileSidebar from "../components/landing-mobile-sidebar";
import LandingNav from "../components/landing-nav";
import OcrSection from "../components/ocr-section";
import PlatformPreviewSection from "../components/platform-preview-section";
import PlatformShiftSection from "../components/platform-shift-section";
import ProblemSection from "../components/problem-section";
import SecuritySection from "../components/security-section";
import TechSection from "../components/tech-section";
import TestimonialsSection from "../components/testimonials-section";
import TrustSection from "../components/trust-section";
import { SmoothScrollProvider } from "../lib/smooth-scroll";
import { SidebarProvider } from "@/components/ui/sidebar";
import { navSectionIds } from "../data/content";
import { useActiveSection } from "../lib/use-active-section";

function LandingPageContent() {
  const { active, setManualActive } = useActiveSection(navSectionIds);

  return (
    <>
      <LandingMobileSidebar active={active} onSelect={setManualActive} />
      <div className="landing-theme min-h-screen w-full min-w-0 overflow-x-hidden bg-[var(--fb-canvas-soft)] text-[var(--fb-ink)]">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-xl focus:bg-card focus:px-4 focus:py-2 focus:text-[var(--fb-ink)]"
        >
          Skip to content
        </a>
        <div className="relative">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 h-[min(100vh,960px)] bg-[var(--fb-canvas-soft)]"
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(159,232,112,0.18),transparent_42%),radial-gradient(circle_at_80%_0%,rgba(56,200,255,0.08),transparent_35%)]" />
          </div>
          <LandingNav />
          <main id="main-content">
            <HeroSection />
            <ProblemSection />
            <PlatformShiftSection />
            <KycJourneySection />
            <OcrSection />
            <BankingSection />
            <InvestmentSection />
            <TrustSection />
            <PlatformPreviewSection />
            <SecuritySection />
            <TechSection />
            <TestimonialsSection />
            <FaqSection />
            <CtaSection />
          </main>
        </div>
        <LandingFooter />
      </div>
    </>
  );
}

export default function LandingPage() {
  return (
    <SmoothScrollProvider>
      <SidebarProvider defaultOpen={false} className="!min-h-0 w-full">
        <LandingPageContent />
      </SidebarProvider>
    </SmoothScrollProvider>
  );
}
