import { ProtectedRoute } from "@/features/auth";
import { AdminAuditScreen } from "@/features/audit";
import { buildMetadata } from "@/lib/seo/site";

export const metadata = buildMetadata({ title: "Audit log", path: "/admin/audit", noindex: true });

export default function AdminAuditPage() {
  return (
    <ProtectedRoute requiredRole={["admin", "rta_admin"]}>
      <AdminAuditScreen />
    </ProtectedRoute>
  );
}
