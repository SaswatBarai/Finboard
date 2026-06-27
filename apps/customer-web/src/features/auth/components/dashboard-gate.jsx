"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getDefaultAdminRoute } from "@/features/admin/config/admin-nav.config";
import { DashboardScreen } from "@/features/dashboard";
import { useAuth } from "../context/auth-context";

export default function DashboardGate() {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      return;
    }

    if (["admin", "rta_admin", "amc_admin"].includes(user.role)) {
      router.replace(getDefaultAdminRoute(user.role));
      return;
    }
  }, [user, router]);

  if (["admin", "rta_admin", "amc_admin"].includes(user?.role)) {
    return null;
  }

  return <DashboardScreen />;
}
