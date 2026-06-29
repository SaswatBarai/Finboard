import AdminNavbar from "@/features/layout/components/admin-navbar";
import { NOINDEX_METADATA } from "@/lib/seo/site";

export const metadata = NOINDEX_METADATA;

export default function AdminLayout({ children }) {
  return (
    <div className="min-h-screen bg-background">
      <AdminNavbar />
      {children}
    </div>
  );
}
