"use client";

import { LogOut, Menu } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  ADMIN_ROLE_LABELS,
  getAdminNavItemsForRole,
  isAdminNavItemActive
} from "@/features/admin/config/admin-nav.config";
import { useAuth } from "@/features/auth/context/auth-context";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

function NavLinks({ items, pathname, onNavigate, className }) {
  return (
    <nav className={cn("flex items-center gap-1", className)}>
      {items.map((item) => (
        <Link
          key={item.id}
          href={item.href}
          onClick={onNavigate}
          className={buttonVariants({
            variant: isAdminNavItemActive(pathname, item.href) ? "secondary" : "ghost",
            size: "sm"
          })}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}

export default function AdminNavbar() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const navItems = getAdminNavItemsForRole(user?.role);

  function signOut() {
    logout();
    router.push("/admin/login");
  }

  if (!user) {
    return null;
  }

  return (
    <header className="sticky top-0 z-50 border-b border-foreground/10 bg-card">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-6">
        <Link href={navItems[0]?.href || "/admin"} className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <span className="size-9 rounded-full bg-primary" />
          <span className="hidden sm:inline">Admin Console</span>
        </Link>

        <NavLinks items={navItems} pathname={pathname} className="hidden md:flex" />

        <div className="flex-1" />

        <Badge variant="secondary" className="hidden rounded-full sm:inline-flex">
          {ADMIN_ROLE_LABELS[user.role] || user.role}
        </Badge>
        <span className="hidden max-w-[180px] truncate text-sm text-muted-foreground lg:inline">{user.email}</span>

        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger
            render={
              <Button variant="ghost" size="icon" className="md:hidden" aria-label="Open admin modules" />
            }
          >
            <Menu className="size-5" />
          </SheetTrigger>
          <SheetContent side="left" className="w-72">
            <SheetHeader>
              <SheetTitle>Admin modules</SheetTitle>
            </SheetHeader>
            <div className="mt-4 space-y-2">
              <Badge variant="secondary" className="rounded-full">
                {ADMIN_ROLE_LABELS[user.role] || user.role}
              </Badge>
              <NavLinks
                items={navItems}
                pathname={pathname}
                className="flex-col items-stretch"
                onNavigate={() => setMobileOpen(false)}
              />
            </div>
          </SheetContent>
        </Sheet>

        <Button variant="outline" size="sm" onClick={signOut}>
          <LogOut className="size-4" />
          <span className="hidden sm:inline">Log out</span>
        </Button>
      </div>
    </header>
  );
}
