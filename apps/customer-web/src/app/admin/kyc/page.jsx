import { ProtectedRoute } from "@/features/auth";
import { AdminKycScreen } from "@/features/admin";
import { buildMetadata } from "@/lib/seo/site";

export const metadata = buildMetadata({ title: "KYC review", path: "/admin/kyc", noindex: true });

export default function AdminKycPage() {
  return (
    <ProtectedRoute requiredRole={["admin", "rta_admin"]}>
      <AdminKycScreen />
    </ProtectedRoute>
  );
}
