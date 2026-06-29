import { ProtectedRoute } from "@/features/auth";
import { AmcAdminScreen } from "@/features/admin";
import { buildMetadata } from "@/lib/seo/site";

export const metadata = buildMetadata({ title: "AMC operations", path: "/admin/amc", noindex: true });

export default function AmcAdminPage() {
  return (
    <ProtectedRoute requiredRole={["admin", "amc_admin"]}>
      <AmcAdminScreen />
    </ProtectedRoute>
  );
}
