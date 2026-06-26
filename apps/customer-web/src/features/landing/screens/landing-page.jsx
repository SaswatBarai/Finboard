"use client";

import BankingSection from "../components/banking-section";
import CtaSection from "../components/cta-section";
import FaqSection from "../components/faq-section";
import HeroSection from "../components/hero-section";
import InvestmentSection from "../components/investment-section";
import KycJourneySection from "../components/kyc-journey-section";
import LandingFooter from "../components/landing-footer";
import LandingNav from "../components/landing-nav";
import OcrSection from "../components/ocr-section";
import PlatformPreviewSection from "../components/platform-preview-section";
import PlatformShiftSection from "../components/platform-shift-section";
import ProblemSection from "../components/problem-section";
import SecuritySection from "../components/security-section";
import TechSection from "../components/tech-section";
import TestimonialsSection from "../components/testimonials-section";
import TrustSection from "../components/trust-section";

export default function LandingPage() {
  return (
    <div className="landing-theme light min-h-screen bg-[var(--fb-canvas-soft)] text-[var(--fb-ink)]">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-xl focus:bg-white focus:px-4 focus:py-2 focus:text-[var(--fb-ink)]"
      >
        Skip to content
      </a>
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
      <LandingFooter />
    </div>
  );
}
