import { LandingPage } from "@/features/landing";
import { LandingJsonLd } from "@/components/seo/landing-json-ld";
import { buildMetadata } from "@/lib/seo/site";

export const metadata = buildMetadata({
  path: "/"
});

export default function HomePage() {
  return (
    <>
      <LandingJsonLd />
      <LandingPage />
    </>
  );
}
