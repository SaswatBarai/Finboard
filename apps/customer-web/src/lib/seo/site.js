export const SITE_NAME = "Finboard";
export const SITE_TITLE = "Finboard — KYC, Banking & Investments";
export const SITE_DESCRIPTION =
  "Premium demo fintech platform for investor onboarding, identity verification, dummy core banking, and portfolio flows.";
export const SITE_TAGLINE = "KYC · Banking · Invest";

export function getSiteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}

/**
 * @param {{
 *   title?: string;
 *   description?: string;
 *   path?: string;
 *   noindex?: boolean;
 * }} options
 */
export function buildMetadata({ title, description = SITE_DESCRIPTION, path = "", noindex = false } = {}) {
  const canonicalPath = path.startsWith("/") ? path : `/${path}`;

  return {
    ...(title ? { title } : {}),
    description,
    alternates: {
      canonical: canonicalPath || "/"
    },
    openGraph: {
      type: "website",
      locale: "en_IN",
      siteName: SITE_NAME,
      title: title ? `${title} · ${SITE_NAME}` : SITE_TITLE,
      description,
      url: canonicalPath || "/"
    },
    twitter: {
      card: "summary_large_image",
      title: title ? `${title} · ${SITE_NAME}` : SITE_TITLE,
      description
    },
    ...(noindex ? { robots: { index: false, follow: false } } : {})
  };
}

export const NOINDEX_METADATA = {
  robots: { index: false, follow: false }
};
