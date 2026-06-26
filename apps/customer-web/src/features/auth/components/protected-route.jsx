"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "../context/auth-context";

export default function ProtectedRoute({ children, requiredRole }) {
  const { token, user, ready } = useAuth();
  const router = useRouter();
  const allowedRoles = Array.isArray(requiredRole) ? requiredRole : requiredRole ? [requiredRole] : [];
  const needsAdmin =
    allowedRoles.length > 0 &&
    allowedRoles.some((role) => ["admin", "rta_admin", "amc_admin"].includes(role));

  useEffect(() => {
    if (!ready) {
      return;
    }

    if (!token) {
      router.replace(needsAdmin ? "/admin/login" : "/signin");
      return;
    }

    if (allowedRoles.length && !allowedRoles.includes(user?.role)) {
      router.replace("/dashboard");
    }
  }, [ready, token, user, allowedRoles, needsAdmin, router]);

  if (!ready) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 p-6">
        <Skeleton className="h-8 w-64" />
        <p className="text-sm text-muted-foreground">Preparing your secure session...</p>
      </div>
    );
  }

  if (!token) {
    return null;
  }

  if (allowedRoles.length && !allowedRoles.includes(user?.role)) {
    return null;
  }

  return children;
}
