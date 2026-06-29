import { ProtectedRoute } from "@/features/auth";
import { ProfileScreen } from "@/features/profile";
import { buildMetadata } from "@/lib/seo/site";

export const metadata = buildMetadata({ title: "Profile", path: "/profile", noindex: true });

export default function ProfilePage() {
  return (
    <ProtectedRoute>
      <ProfileScreen />
    </ProtectedRoute>
  );
}
