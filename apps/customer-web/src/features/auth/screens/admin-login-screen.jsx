"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { toast } from "sonner";
import AuthShell from "../components/auth-shell";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getDefaultAdminRoute } from "@/features/admin/config/admin-nav.config";
import { api } from "@/lib/api";
import { getAuthErrorMessage } from "../lib/auth-errors";
import { useAuth } from "../context/auth-context";

const ADMIN_ROLES = [
  { value: "rta_admin", label: "RTA Admin — KYC and investor records" },
  { value: "amc_admin", label: "AMC Admin — schemes, SIPs, AUM" },
  { value: "admin", label: "Super Admin — all modules" },
];

export default function AdminLoginPage() {
  const [form, setForm] = useState({ email: "", password: "", adminRole: "rta_admin" });
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const selectedRole =
    ADMIN_ROLES.find((role) => role.value === form.adminRole) ?? ADMIN_ROLES[0];

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
      router.push(getDefaultAdminRoute(response.data.user.role));
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
          <Label htmlFor="admin-role" className="auth-field-label">
            Admin role
          </Label>
          <DropdownMenu>
            <DropdownMenuTrigger
              id="admin-role"
              render={
                <Button
                  type="button"
                  variant="outline"
                  className="h-11 w-full justify-between rounded-xl border-foreground/20 bg-card px-4 text-left text-base font-normal md:text-sm"
                />
              }
            >
              <span className="truncate">{selectedRole.label}</span>
              <ChevronDown className="size-4 shrink-0 text-muted-foreground" aria-hidden />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-(--anchor-width)">
              <DropdownMenuRadioGroup
                value={form.adminRole}
                onValueChange={(value) => setForm((current) => ({ ...current, adminRole: value }))}
              >
                {ADMIN_ROLES.map((role) => (
                  <DropdownMenuRadioItem key={role.value} value={role.value} closeOnClick>
                    {role.label}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
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
    </AuthShell>
  );
}
