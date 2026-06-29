import { SITE_NAME, SITE_TAGLINE } from "@/lib/seo/site";

export default function manifest() {
  return {
    name: `${SITE_NAME} — ${SITE_TAGLINE}`,
    short_name: SITE_NAME,
    description: "Investor onboarding, identity verification, and demo investment platform",
    start_url: "/",
    display: "standalone",
    background_color: "#0e0f0c",
    theme_color: "#0e0f0c",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml"
      },
      {
        src: "/apple-icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable"
      }
    ]
  };
}
