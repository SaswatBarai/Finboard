import { ProtectedRoute } from "@/features/auth";
import { AdminKycScreen } from "@/features/admin";

export default function AdminDashboardPage() {
  return (
    <ProtectedRoute requiredRole={["admin", "rta_admin"]}>
      <AdminKycScreen />
    </ProtectedRoute>
  );
}
