export const navLinks = [
  { href: "#journey", label: "Journey", id: "journey", index: "01" },
  { href: "#banking", label: "Banking", id: "banking", index: "02" },
  { href: "#invest", label: "Invest", id: "invest", index: "03" },
  { href: "#security", label: "Security", id: "security", index: "04" },
  { href: "#faq", label: "FAQ", id: "faq", index: "05" }
];

export const navSectionIds = navLinks.map((link) => link.id);

export const problemStats = [
  { value: "14+", label: "days average onboarding in legacy stacks" },
  { value: "63%", label: "drop-off before first investment" },
  { value: "7+", label: "disconnected systems per investor" }
];

export const kycSteps = [
  { id: "upload", title: "Document capture", detail: "PAN & Aadhaar uploaded once", status: "done" },
  { id: "ocr", title: "OCR extraction", detail: "Tesseract + structured parsing", status: "done" },
  { id: "match", title: "Identity match", detail: "Cross-check against verified dataset", status: "active" },
  { id: "review", title: "RTA review", detail: "Human approval with audit trail", status: "pending" },
  { id: "unlock", title: "Invest", detail: "Bank link → portfolio live", status: "pending" }
];

export const trustMetrics = [
  { value: "Rs. 2", label: "penny-drop verification" },
  { value: "<45s", label: "auto refund window" },
  { value: "256-bit", label: "JWT session security" },
  { value: "100%", label: "audit on KYC actions" }
];

export const testimonials = [
  {
    quote:
      "We replaced three internal tools with Finboard's demo stack. The KYC review screen alone saved our ops team hours every week.",
    name: "Priya Menon",
    role: "Head of Operations",
    org: "Demo AMC Partners"
  },
  {
    quote:
      "The onboarding narrative — verify identity, link bank, invest — is exactly how we explain the product to institutional clients.",
    name: "Arjun Kulkarni",
    role: "Product Lead",
    org: "Finboard Labs"
  }
];

export const faqItems = [
  {
    q: "Is this connected to real banks or exchanges?",
    a: "No. Finboard is a learning and demo platform. Banking, UPI, brokers, and payment rails are simulated with PostgreSQL ledger data and MongoDB user records."
  },
  {
    q: "How does KYC verification work?",
    a: "Investors upload PAN and Aadhaar documents. The platform runs OCR extraction, validates against a seeded identity dataset, and routes applications to RTA admins for approval."
  },
  {
    q: "What happens after KYC is approved?",
    a: "Users complete bank verification via a Rs. 2 debit that is automatically refunded. Once linked, stocks, mutual funds, and SIP flows unlock against the dummy core banking module."
  },
  {
    q: "Who can access the admin dashboard?",
    a: "Seeded roles include platform admin, RTA admin (KYC review), and AMC admin (mutual fund order approval). Each role sees scoped modules."
  }
];

export const techStack = [
  "Next.js 16",
  "Express modular monolith",
  "MongoDB + PostgreSQL",
  "Tesseract OCR",
  "Prisma ledger",
  "TanStack Query"
];
