import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const highlights = ["JWT protected API", "Twilio SMS OTP", "MongoDB user profile"];

export default function AuthShell({ title, subtitle, children, variant = "investor" }) {
  const heroTitle = variant === "admin" ? "Operations console" : "Secure KYC onboarding";
  const heroCopy =
    variant === "admin"
      ? "RTA and AMC administrators review investor identity, scheme orders, and compliance workflows from one controlled entry point."
      : "Verify phone ownership with OTP, create a protected account, and continue into your investor dashboard.";

  return (
    <main className="min-h-screen bg-background">
      <header className="border-b border-foreground/10 bg-card lg:hidden">
        <div className="mx-auto flex h-16 max-w-lg items-center gap-3 px-6">
          <Link href="/" className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <span className="size-9 rounded-full bg-primary" />
            Finboard
          </Link>
        </div>
      </header>

      <div className="grid min-h-[calc(100vh-4rem)] lg:min-h-screen lg:grid-cols-2">
        <section className="relative hidden flex-col justify-between bg-secondary p-10 lg:flex xl:p-16">
          <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-foreground">
            <span className="size-9 rounded-full bg-primary" />
            Finboard
          </Link>

          <div className="space-y-6">
            <div className="flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <ShieldCheck className="size-8" />
            </div>
            <div className="space-y-4">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                {variant === "admin" ? "Admin access" : "Investor access"}
              </p>
              <h1 className="display-md max-w-lg">{heroTitle}</h1>
              <p className="body-lg max-w-md">{heroCopy}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {highlights.map((item) => (
                <Badge key={item} variant="outline" className="rounded-full border-foreground/10 bg-card px-3 py-1 font-medium">
                  {item}
                </Badge>
              ))}
            </div>
          </div>

          <p className="text-sm text-muted-foreground">Demo environment only. No live banking or exchange connectivity.</p>
        </section>

        <section className="flex items-center justify-center px-6 py-10 sm:px-10 lg:bg-card">
          <div className="auth-form-card w-full max-w-md space-y-6">
            <div className="space-y-2 lg:hidden">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                {variant === "admin" ? "Admin access" : "Investor access"}
              </p>
              <h1 className="display-sm">{title}</h1>
              <p className="text-base text-muted-foreground">{subtitle}</p>
            </div>

            <div className="hidden space-y-2 lg:block">
              <h2 className="display-sm">{title}</h2>
              <p className="text-base text-muted-foreground">{subtitle}</p>
            </div>

            <div className="space-y-4">{children}</div>
          </div>
        </section>
      </div>
    </main>
  );
}
