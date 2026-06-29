import { ProtectedRoute } from "@/features/auth";
import AdminAuditDetailScreen from "@/features/audit/screens/admin-audit-detail-screen";
import { buildMetadata } from "@/lib/seo/site";

export async function generateMetadata({ params }) {
  const { id } = await params;

  return buildMetadata({
    title: "Audit event",
    path: `/admin/audit/${id}`,
    noindex: true
  });
}

export default async function AdminAuditDetailPage({ params }) {
  const { id } = await params;

  return (
    <ProtectedRoute requiredRole={["admin", "rta_admin"]}>
      <AdminAuditDetailScreen applicationId={id} />
    </ProtectedRoute>
  );
}
