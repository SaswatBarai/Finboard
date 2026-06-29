import { ProtectedRoute } from "@/features/auth";
import AdminKycDetailScreen from "@/features/admin/kyc/screens/admin-kyc-detail-screen";
import { buildMetadata } from "@/lib/seo/site";

export async function generateMetadata({ params }) {
  const { id } = await params;

  return buildMetadata({
    title: "KYC application",
    path: `/admin/kyc/${id}`,
    noindex: true
  });
}

export default async function AdminKycDetailPage({ params }) {
  const { id } = await params;

  return (
    <ProtectedRoute requiredRole={["admin", "rta_admin"]}>
      <AdminKycDetailScreen applicationId={id} />
    </ProtectedRoute>
  );
}
