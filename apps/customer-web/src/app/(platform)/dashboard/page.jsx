import { DashboardGate, ProtectedRoute } from "@/features/auth";
import { buildMetadata } from "@/lib/seo/site";

export const metadata = buildMetadata({ title: "Dashboard", path: "/dashboard", noindex: true });

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardGate />
    </ProtectedRoute>
  );
}
