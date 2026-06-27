"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import AuthShell from "../components/auth-shell";
import { AuthFooterText, AuthLink } from "../components/auth-primitives";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api } from "@/lib/api";
import { getAuthErrorMessage } from "../lib/auth-errors";
import { useAuth } from "../context/auth-context";

export default function AdminLoginPage() {
  const [form, setForm] = useState({ email: "", password: "", adminRole: "rta_admin" });
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  function updateField(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  async function submit(event) {
    event.preventDefault();
    setLoading(true);
    try {
      const response = await api.post("/auth/admin/signin", form);
      login(response.data);
      toast.success("Admin signed in");
      router.push(response.data.user.role === "amc_admin" ? "/admin/amc" : "/admin/dashboard");
    } catch (error) {
      toast.error(getAuthErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      variant="admin"
      title="Admin sign in"
      subtitle="Seeded admin access for RTA investor records and AMC scheme operations."
    >
      <form className="space-y-4" onSubmit={submit}>
        <div className="space-y-2">
          <Label className="auth-field-label">Admin role</Label>
          <Select value={form.adminRole} onValueChange={(value) => setForm((current) => ({ ...current, adminRole: value }))}>
            <SelectTrigger className="h-11 rounded-xl border-foreground/20 bg-card">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="rta_admin">RTA Admin - KYC and investor records</SelectItem>
              <SelectItem value="amc_admin">AMC Admin - schemes, SIPs, AUM</SelectItem>
              <SelectItem value="admin">Super Admin - all modules</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="email" className="auth-field-label">
            Admin email
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
          {loading ? "Checking..." : "Open admin dashboard"}
        </Button>
      </form>

      <div className="auth-note space-y-2">
        <strong className="block text-sm font-semibold">Seeded demo logins</strong>
        <p>RTA: rta.admin@finboard.local / RtaAdmin@12345</p>
        <p>AMC: amc.admin@finboard.local / AmcAdmin@12345</p>
        <p>Super: admin@finboard.local / Admin@12345</p>
      </div>

      <AuthFooterText>
        Customer login? <AuthLink href="/signin">Go to sign in</AuthLink>
      </AuthFooterText>
    </AuthShell>
  );
}
