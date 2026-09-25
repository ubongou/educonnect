import { ImageResponse } from "next/og";

export const alt =
  "Masani: online tutoring from vetted Nigerian teachers for families in the UK, US and Canada";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * The link preview shown when any page is shared on WhatsApp, Facebook,
 * LinkedIn or X. Nigerian families abroad share recommendations in WhatsApp
 * groups more than anywhere else, so this card is often the first thing a
 * parent sees of Masani.
 */
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 80px",
          background: "#04131c",
          color: "#ffffff",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <div
            style={{
              width: 22,
              height: 22,
              borderRadius: 999,
              background: "#ff693f",
            }}
          />
          <div style={{ fontSize: 40, fontWeight: 700, letterSpacing: -1 }}>Masani</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div
            style={{
              fontSize: 68,
              fontWeight: 700,
              lineHeight: 1.05,
              letterSpacing: -2,
              maxWidth: 980,
            }}
          >
            Online tutoring for Nigerian families abroad
          </div>
          <div style={{ fontSize: 30, color: "#42dbfd" }}>
            One to one lessons with vetted Nigerian teachers · UK · US · Canada
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 24 }}>
          <div
            style={{
              background: "#fcb936",
              color: "#04131c",
              padding: "10px 20px",
              borderRadius: 999,
              fontWeight: 700,
            }}
          >
            MIT Social Innovation Fellowship 2025
          </div>
          <div style={{ color: "rgba(255,255,255,0.7)" }}>joinmasani.com</div>
        </div>
      </div>
    ),
    size,
  );
}
