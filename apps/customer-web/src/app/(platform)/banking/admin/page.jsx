import { ProtectedRoute } from "@/features/auth";
import { BankingAdminScreen } from "@/features/admin";

export default function BankingAdminPage() {
  return (
    <ProtectedRoute requiredRole={["admin", "rta_admin"]}>
      <BankingAdminScreen />
    </ProtectedRoute>
  );
}
