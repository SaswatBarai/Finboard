import { ProtectedRoute } from "@/features/auth";
import { DocumentsScreen } from "@/features/documents";
import { buildMetadata } from "@/lib/seo/site";

export const metadata = buildMetadata({ title: "Documents", path: "/documents", noindex: true });

export default function DocumentsPage() {
  return (
    <ProtectedRoute>
      <DocumentsScreen />
    </ProtectedRoute>
  );
}
