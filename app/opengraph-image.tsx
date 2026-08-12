import { ImageResponse } from "next/og";
import { EVENT } from "@/lib/event";

export const runtime = "nodejs";
export const alt = `${EVENT.name} ${EVENT.year} — ${EVENT.mainDays}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * The preview card WhatsApp and friends show when the link is pasted into the
 * group. Built from the same tiger mark as the favicon.
 *
 * Satori (which renders this) supports a narrow slice of CSS, so the artwork
 * goes in as a data-URI image rather than inline SVG elements.
 */
const TIGER = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <circle cx="17" cy="19" r="9.5" fill="#f59e0b"/>
  <circle cx="47" cy="19" r="9.5" fill="#f59e0b"/>
  <circle cx="17" cy="19" r="4.5" fill="#7c2d12"/>
  <circle cx="47" cy="19" r="4.5" fill="#7c2d12"/>
  <circle cx="32" cy="35" r="20" fill="#f59e0b"/>
  <g stroke="#7c2d12" stroke-width="3.4" stroke-linecap="round">
    <path d="M24 19 L26 27"/><path d="M32 17 L32 26"/><path d="M40 19 L38 27"/>
  </g>
  <g stroke="#7c2d12" stroke-width="3" stroke-linecap="round">
    <path d="M13 33 L20 35"/><path d="M51 33 L44 35"/>
  </g>
  <ellipse cx="32" cy="43" rx="12" ry="8.5" fill="#fef3c7"/>
  <path d="M28 39 h8 l-4 4.5 Z" fill="#7c2d12"/>
  <path d="M32 43.5 v3" stroke="#7c2d12" stroke-width="2" stroke-linecap="round"/>
  <circle cx="24" cy="33" r="3.6" fill="#0a1e18"/>
  <circle cx="40" cy="33" r="3.6" fill="#0a1e18"/>
  <circle cx="25.2" cy="31.8" r="1.3" fill="#fff"/>
  <circle cx="41.2" cy="31.8" r="1.3" fill="#fff"/>
</svg>`;

export default function Image() {
  const tigerSrc = `data:image/svg+xml;base64,${Buffer.from(TIGER).toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "0 80px",
          background:
            "radial-gradient(ellipse 90% 70% at 50% 0%, #1b4a36 0%, #061310 70%)",
          color: "#f4efe2",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={tigerSrc} width={150} height={150} alt="" />
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div
              style={{
                fontSize: 26,
                letterSpacing: 6,
                textTransform: "uppercase",
                color: "#5ee2a0",
              }}
            >
              {`School reunion · ${EVENT.year}`}
            </div>
            <div style={{ fontSize: 76, fontWeight: 800, lineHeight: 1.05 }}>
              Tadoba calls us back.
            </div>
          </div>
        </div>

        <div style={{ display: "flex", height: 10, marginTop: 44 }}>
          {Array.from({ length: 34 }, (_, i) => (
            <div
              key={i}
              style={{
                width: 22,
                height: 10,
                marginRight: 12,
                borderRadius: 4,
                background: i % 2 === 0 ? "#f97316" : "#1b4a36",
              }}
            />
          ))}
        </div>

        <div style={{ marginTop: 36, fontSize: 38, color: "#b8b3a4" }}>
          {`${EVENT.mainDays} · ${EVENT.venue}`}
        </div>
      </div>
    ),
    size,
  );
}
