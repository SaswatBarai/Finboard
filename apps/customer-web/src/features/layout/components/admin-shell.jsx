"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "../../auth/context/auth-context";

export default function AdminShell({ title, logo = "A", children }) {
  const { user, logout } = useAuth();
  const router = useRouter();

  function signOut() {
    logout();
    router.push("/admin/login");
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-foreground/10 bg-card">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-6">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
              {logo}
            </span>
            <strong className="text-lg font-semibold text-foreground">{title}</strong>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-muted-foreground sm:inline">{user?.email}</span>
            <Button variant="outline" size="sm" onClick={signOut}>
              <LogOut className="size-4" />
              Log out
            </Button>
          </div>
        </div>
      </header>
      <div className="mx-auto max-w-7xl px-6 py-8">
        {children}
      </div>
    </div>
  );
}

export function AdminSection({ title, description, action, children }) {
  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
          {title ? <h2 className="text-xl font-semibold tracking-tight">{title}</h2> : null}
        </div>
        {action}
      </div>
      <Separator />
      {children}
    </section>
  );
}
