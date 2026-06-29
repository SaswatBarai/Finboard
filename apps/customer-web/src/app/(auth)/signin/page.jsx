import { SigninScreen } from "@/features/auth";
import { buildMetadata } from "@/lib/seo/site";

export const metadata = buildMetadata({ title: "Sign in", path: "/signin", noindex: true });

export default function SigninPage() {
  return <SigninScreen />;
}
