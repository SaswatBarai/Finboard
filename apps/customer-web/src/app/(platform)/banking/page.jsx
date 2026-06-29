import { ProtectedRoute } from "@/features/auth";
import { BankingScreen } from "@/features/banking";
import { buildMetadata } from "@/lib/seo/site";

export const metadata = buildMetadata({ title: "Banking", path: "/banking", noindex: true });

export default function BankingPage() {
  return (
    <ProtectedRoute requiredRole={["user"]}>
      <BankingScreen />
    </ProtectedRoute>
  );
}
