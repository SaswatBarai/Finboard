"use client";

import { ADMIN_ROLE_LABELS } from "@/features/admin/config/admin-nav.config";
import { AdminShell } from "@/features/layout";
import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/features/auth/context/auth-context";

export default function AdminHubScreen() {
  const { user } = useAuth();

  return (
    <AdminShell title="Welcome" description="Finboard operations workspace">
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-card">
        <CardHeader>
          <CardDescription>Admin home</CardDescription>
          <CardTitle className="text-2xl">Welcome, {user?.name || "Admin"}</CardTitle>
          <p className="text-sm text-muted-foreground">
            Signed in as {user?.email}. Use the top navbar to switch between admin modules.
          </p>
          <Badge variant="secondary" className="w-fit rounded-full">
            {ADMIN_ROLE_LABELS[user?.role] || user?.role}
          </Badge>
        </CardHeader>
      </Card>
    </AdminShell>
  );
}
