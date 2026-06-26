"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import AuthShell from "../components/auth-shell";
import { AuthFooterText, AuthLink } from "../components/auth-primitives";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api, getApiError } from "@/lib/api";
import { useAuth } from "../context/auth-context";

export default function SigninPage() {
  const [form, setForm] = useState({ email: "", password: "", phone: "", otp: "" });
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [loading, setLoading] = useState(false);
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

  async function passwordSignin(event) {
    event.preventDefault();
    setLoading(true);
    try {
      const response = await api.post("/auth/signin", {
        email: form.email,
        password: form.password
      });
      login(response.data);
      router.push("/dashboard");
    } catch (error) {
      toast.error(getApiError(error));
    } finally {
      setLoading(false);
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
      toast.success("OTP sent");
    } catch (error) {
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
      const response = await api.post("/auth/verify-otp", { phone: form.phone.trim(), otp: form.otp.trim() });

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

  async function otpSignin(event) {
    event.preventDefault();
    if (!otpSent) {
      toast.error("Send OTP first");
      return;
    }

    if (!otpVerified && !(await verifyOtp())) {
      return;
    }

    setLoading(true);
    try {
      const response = await api.post("/auth/phone-login", { phone: form.phone.trim(), otp: form.otp });
      login(response.data);
      router.push("/dashboard");
    } catch (error) {
      toast.error(getApiError(error));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell title="Sign in" subtitle="Use password sign-in or Twilio phone OTP for quick access.">
      <Tabs defaultValue="password">
        <TabsList className="auth-tabs-list">
          <TabsTrigger value="password" className="auth-tabs-trigger">
            Email
          </TabsTrigger>
          <TabsTrigger value="otp" className="auth-tabs-trigger">
            Phone OTP
          </TabsTrigger>
        </TabsList>

        <TabsContent value="password">
          <form className="space-y-4 pt-2" onSubmit={passwordSignin}>
            <div className="space-y-2">
              <Label htmlFor="email" className="auth-field-label">
                Email
              </Label>
              <Input id="email" name="email" type="email" value={form.email} onChange={updateField} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="auth-field-label">
                Password
              </Label>
              <Input id="password" name="password" type="password" value={form.password} onChange={updateField} required />
            </div>
            <Button className="w-full" size="lg" disabled={loading} type="submit">
              {loading ? "Checking..." : "Sign in"}
            </Button>
          </form>
        </TabsContent>

        <TabsContent value="otp">
          <form className="space-y-4 pt-2" onSubmit={otpSignin}>
            <div className="space-y-2">
              <Label htmlFor="phone" className="auth-field-label">
                Phone number
              </Label>
              <div className="flex gap-2">
                <Input id="phone" name="phone" value={form.phone} onChange={updateField} placeholder="+919876543210" required />
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
                <Input id="otp" name="otp" inputMode="numeric" value={form.otp} onChange={updateField} required />
                <Button type="button" variant="secondary" size="sm" onClick={verifyOtp} disabled={loading || !otpSent || otpVerified}>
                  {otpVerified ? "Verified" : "Verify"}
                </Button>
              </div>
            </div>
            <Button className="w-full" size="lg" disabled={loading} type="submit">
              {loading ? "Verifying..." : "Sign in with OTP"}
            </Button>
          </form>
        </TabsContent>
      </Tabs>

      <AuthFooterText>
        New here? <AuthLink href="/signup">Create account</AuthLink>
      </AuthFooterText>
    </AuthShell>
  );
}
