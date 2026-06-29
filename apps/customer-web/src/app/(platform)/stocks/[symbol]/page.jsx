import { ProtectedRoute } from "@/features/auth";
import { StockDetailScreen } from "@/features/investments";
import { buildMetadata } from "@/lib/seo/site";

export async function generateMetadata({ params }) {
  const { symbol } = await params;
  const label = symbol?.toUpperCase() ?? "Stock";

  return buildMetadata({
    title: label,
    path: `/stocks/${symbol}`,
    noindex: true
  });
}

export default function StockDetailPage() {
  return (
    <ProtectedRoute>
      <StockDetailScreen />
    </ProtectedRoute>
  );
}
