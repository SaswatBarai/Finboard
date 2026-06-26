"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import AuthShell from "../components/auth-shell";
import { AuthFooterText, AuthLink } from "../components/auth-primitives";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api, getApiError } from "@/lib/api";
import { useAuth } from "../context/auth-context";

const initialForm = {
  name: "",
  email: "",
  phone: "",
  password: "",
  otp: ""
};

export default function SignupPage() {
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  function updateField(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
    if (event.target.name === "phone") {
      setOtpSent(false);
    }
    if (event.target.name === "phone" || event.target.name === "otp") {
      setOtpVerified(false);
    }
  }

  async function sendOtp() {
    if (!form.phone.startsWith("+")) {
      toast.error("Use country code format, for example +919876543210");
      return;
    }

    setLoading(true);
    try {
      const response = await api.post("/auth/send-otp", { phone: form.phone.trim() });
      setOtpSent(true);
      setOtpVerified(false);
      if (response.data.devOtp) {
        setForm((current) => ({ ...current, otp: response.data.devOtp }));
      }
      toast.success("OTP sent to your phone");
    } catch (error) {
      setOtpSent(false);
      toast.error(getApiError(error));
    } finally {
      setLoading(false);
    }
  }

  async function verifyOtp() {
    if (!otpSent) {
      toast.error("Send OTP first");
      return false;
    }

    setLoading(true);
    try {
      const response = await api.post("/auth/verify-otp", {
        phone: form.phone.trim(),
        otp: form.otp.trim()
      });

      if (!response.data.approved) {
        toast.error("Invalid or expired OTP");
        return false;
      }

      setOtpVerified(true);
      toast.success("Phone number verified");
      return true;
    } catch (error) {
      toast.error(getApiError(error));
      return false;
    } finally {
      setLoading(false);
    }
  }

  async function submit(event) {
    event.preventDefault();

    if (!otpSent) {
      toast.error("Send OTP before creating the account");
      return;
    }

    if (!otpVerified && !(await verifyOtp())) {
      return;
    }

    setLoading(true);
    try {
      const response = await api.post("/auth/signup", {
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        password: form.password,
        otp: form.otp
      });
      login(response.data);
      toast.success("Account created securely");
      router.push("/dashboard");
    } catch (error) {
      toast.error(getApiError(error));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell title="Create your account" subtitle="Twilio SMS OTP is required before the account is stored in MongoDB.">
      <form className="space-y-4" onSubmit={submit}>
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
          <div className="flex gap-2">
            <Input id="phone" name="phone" value={form.phone} onChange={updateField} required placeholder="+919876543210" />
            <Button type="button" variant="secondary" size="sm" onClick={sendOtp} disabled={loading || otpSent}>
              {otpSent ? "Sent" : "Send OTP"}
            </Button>
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="otp" className="auth-field-label">
            OTP
          </Label>
          <div className="flex gap-2">
            <Input id="otp" name="otp" inputMode="numeric" value={form.otp} onChange={updateField} required placeholder="6-digit OTP" />
            <Button type="button" variant="secondary" size="sm" onClick={verifyOtp} disabled={loading || !otpSent || otpVerified}>
              {otpVerified ? "Verified" : "Verify"}
            </Button>
          </div>
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
          {loading ? "Securing account..." : "Sign up and continue"}
        </Button>
      </form>
      <AuthFooterText>
        Already registered? <AuthLink href="/signin">Sign in</AuthLink>
      </AuthFooterText>
    </AuthShell>
  );
}
