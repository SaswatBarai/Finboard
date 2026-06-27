"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import AuthShell from "../components/auth-shell";
import { AuthFooterText, AuthLink } from "../components/auth-primitives";
import { getAuthErrorMessage, isPendingVerificationConflict } from "../lib/auth-errors";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api";
import { useAuth } from "../context/auth-context";

const initialForm = {
  name: "",
  email: "",
  phone: "",
  password: "",
  otp: ""
};

const steps = [
  { number: 1, label: "Your details" },
  { number: 2, label: "Verify OTP" }
];

export default function SignupPage() {
  const [form, setForm] = useState(initialForm);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  function updateField(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  function goToVerificationStep() {
    setOtpSent(true);
    setStep(2);
  }

  async function submitDetails(event) {
    event.preventDefault();

    if (!form.phone.startsWith("+")) {
      toast.error("Use country code format, for example +919876543210");
      return;
    }

    setLoading(true);
    try {
      await api.post("/auth/signup", {
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        password: form.password
      });

      goToVerificationStep();
      toast.success("Account created. Enter the OTP sent to your phone.");
    } catch (error) {
      if (isPendingVerificationConflict(error)) {
        goToVerificationStep();
        toast.message(getAuthErrorMessage(error));
        return;
      }

      toast.error(getAuthErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }

  async function resendOtp() {
    setLoading(true);
    try {
      await api.post("/auth/send-otp", { phone: form.phone.trim() });
      setOtpSent(true);
      toast.success("OTP sent again");
    } catch (error) {
      toast.error(getAuthErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }

  async function verifyAndComplete(event) {
    event.preventDefault();

    setLoading(true);
    try {
      const response = await api.post("/auth/verify-otp", {
        phone: form.phone.trim(),
        otp: form.otp.trim()
      });

      if (!response.data.approved) {
        toast.error("Invalid or expired OTP");
        return;
      }

      if (!response.data.registrationComplete || !response.data.token) {
        toast.error("Registration could not be completed. Check the OTP and try again.");
        return;
      }

      login(response.data);
      toast.success("Registration complete");
      router.push("/dashboard");
    } catch (error) {
      toast.error(getAuthErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell title="Create your account" subtitle="Enter your details, then verify the OTP sent to your phone.">
      <div className="mb-6 flex items-center justify-center gap-8">
        {steps.map((item) => (
          <div key={item.number} className="flex flex-col items-center gap-1 text-center">
            <span
              className={`flex size-8 items-center justify-center rounded-full text-sm font-semibold ${
                step >= item.number ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              }`}
            >
              {item.number}
            </span>
            <span className={`text-xs ${step === item.number ? "font-medium text-foreground" : "text-muted-foreground"}`}>
              {item.label}
            </span>
          </div>
        ))}
      </div>

      {step === 1 ? (
        <form className="space-y-4" onSubmit={submitDetails}>
          <div className="space-y-2">
            <Label htmlFor="name" className="auth-field-label">
              Full name
            </Label>
            <Input id="name" name="name" value={form.name} onChange={updateField} required minLength={2} placeholder="Enter your name" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email" className="auth-field-label">
              Email
            </Label>
            <Input id="email" name="email" type="email" value={form.email} onChange={updateField} required placeholder="you@example.com" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone" className="auth-field-label">
              Phone number
            </Label>
            <Input id="phone" name="phone" value={form.phone} onChange={updateField} required placeholder="+919876543210" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password" className="auth-field-label">
              Password
            </Label>
            <Input
              id="password"
              name="password"
              type="password"
              value={form.password}
              onChange={updateField}
              required
              minLength={8}
              placeholder="Minimum 8 characters"
            />
          </div>
          <Button className="w-full" size="lg" disabled={loading} type="submit">
            {loading ? "Creating account..." : "Sign up and send OTP"}
          </Button>
        </form>
      ) : (
        <form className="space-y-4" onSubmit={verifyAndComplete}>
          <div className="rounded-lg border border-foreground/10 bg-muted/40 p-4 text-sm">
            <p className="font-medium text-foreground">{form.name}</p>
            <p className="text-muted-foreground">{form.email}</p>
            <p className="text-muted-foreground">{form.phone}</p>
            {otpSent ? (
              <p className="mt-2 text-primary">OTP sent to your phone. Enter the code from SMS to finish registration.</p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="otp" className="auth-field-label">
              Enter OTP
            </Label>
            <Input id="otp" name="otp" inputMode="numeric" value={form.otp} onChange={updateField} required placeholder="6-digit OTP" />
          </div>
          <div className="flex gap-2">
            <Button className="flex-1" variant="outline" type="button" onClick={() => setStep(1)}>
              Back
            </Button>
            <Button className="flex-1" variant="secondary" type="button" onClick={resendOtp} disabled={loading}>
              Resend OTP
            </Button>
          </div>
          <Button className="w-full" size="lg" disabled={loading} type="submit">
            {loading ? "Verifying..." : "Verify OTP and complete registration"}
          </Button>
        </form>
      )}
      <AuthFooterText>
        Already registered? <AuthLink href="/signin">Sign in</AuthLink>
      </AuthFooterText>
    </AuthShell>
  );
}
