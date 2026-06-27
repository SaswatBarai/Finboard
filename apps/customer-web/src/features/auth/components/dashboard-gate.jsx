"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { DashboardScreen } from "@/features/dashboard";
import { useAuth } from "../context/auth-context";

export default function DashboardGate() {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      return;
    }

    if (["admin", "rta_admin"].includes(user.role)) {
      router.replace(user.role === "rta_admin" ? "/admin/kyc" : "/admin/dashboard");
      return;
    }

    if (user.role === "amc_admin") {
      router.replace("/admin/amc");
    }
  }, [user, router]);

  if (["admin", "rta_admin", "amc_admin"].includes(user?.role)) {
    return null;
  }

  return <DashboardScreen />;
}
