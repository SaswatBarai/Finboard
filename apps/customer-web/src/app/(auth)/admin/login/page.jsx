import { AdminLoginScreen } from "@/features/auth";
import { buildMetadata } from "@/lib/seo/site";

export const metadata = buildMetadata({ title: "Admin sign in", path: "/admin/login", noindex: true });

export default function AdminLoginPage() {
  return <AdminLoginScreen />;
}
