import { SignupScreen } from "@/features/auth";
import { buildMetadata } from "@/lib/seo/site";

export const metadata = buildMetadata({ title: "Create account", path: "/signup", noindex: true });

export default function SignupPage() {
  return <SignupScreen />;
}
