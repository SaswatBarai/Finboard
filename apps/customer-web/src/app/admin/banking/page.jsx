import { ProtectedRoute } from "@/features/auth";
import { BankingAdminScreen } from "@/features/admin";
import { buildMetadata } from "@/lib/seo/site";

export const metadata = buildMetadata({ title: "Banking admin", path: "/admin/banking", noindex: true });

export default function AdminBankingPage() {
  return (
    <ProtectedRoute requiredRole={["admin"]}>
      <BankingAdminScreen />
    </ProtectedRoute>
  );
}
