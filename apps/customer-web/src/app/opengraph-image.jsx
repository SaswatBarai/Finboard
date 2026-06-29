import { ImageResponse } from "next/og";
import { SITE_TAGLINE } from "@/lib/seo/site";

export const alt = "Finboard — KYC, Banking & Investments";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "center",
          background: "#0e0f0c",
          padding: "80px"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "32px" }}>
          <div
            style={{
              width: 96,
              height: 96,
              borderRadius: 24,
              background: "#0e0f0c",
              border: "2px solid rgba(159,232,112,0.3)",
              display: "flex",
              alignItems: "flex-end",
              justifyContent: "center",
              gap: 8,
              padding: "20px 16px"
            }}
          >
            <div style={{ width: 14, height: 24, borderRadius: 4, background: "#9fe870", opacity: 0.38 }} />
            <div style={{ width: 14, height: 40, borderRadius: 4, background: "#9fe870", opacity: 0.68 }} />
            <div style={{ width: 14, height: 56, borderRadius: 4, background: "#9fe870", opacity: 1 }} />
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div
              style={{
                fontSize: 72,
                fontWeight: 900,
                color: "#f5f5f0",
                letterSpacing: "-0.04em",
                lineHeight: 1
              }}
            >
              Finboard
            </div>
            <div
              style={{
                marginTop: 16,
                fontSize: 28,
                fontWeight: 600,
                color: "rgba(245,245,240,0.6)",
                letterSpacing: "0.15em",
                textTransform: "uppercase"
              }}
            >
              {SITE_TAGLINE}
            </div>
          </div>
        </div>
        <div
          style={{
            marginTop: 48,
            fontSize: 32,
            color: "rgba(245,245,240,0.75)",
            maxWidth: 800,
            lineHeight: 1.4
          }}
        >
          Onboard investors without the friction.
        </div>
      </div>
    ),
    { ...size }
  );
}
