import { getSiteUrl } from "@/lib/seo/site";

export default function robots() {
  const siteUrl = getSiteUrl();

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/admin",
        "/admin/",
        "/dashboard",
        "/signin",
        "/signup",
        "/profile",
        "/banking",
        "/documents",
        "/kyc",
        "/stocks",
        "/admin/login"
      ]
    },
    sitemap: `${siteUrl}/sitemap.xml`
  };
}
