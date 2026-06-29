import { ProtectedRoute } from "@/features/auth";
import { KycScreen } from "@/features/kyc";
import { buildMetadata } from "@/lib/seo/site";

export const metadata = buildMetadata({ title: "KYC verification", path: "/kyc", noindex: true });

export default function KycPage() {
  return (
    <ProtectedRoute>
      <KycScreen />
    </ProtectedRoute>
  );
}
