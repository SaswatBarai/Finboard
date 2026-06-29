import GuestRoute from "@/features/auth/components/guest-route";
import { NOINDEX_METADATA } from "@/lib/seo/site";

export const metadata = NOINDEX_METADATA;

export default function AuthLayout({ children }) {
  return (
    <div className="auth-theme min-h-screen bg-background text-foreground">
      <GuestRoute>{children}</GuestRoute>
    </div>
  );
}
