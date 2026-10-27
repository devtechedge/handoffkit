import { ImageResponse } from "next/og";

export const alt = "HandoffKit, client-ready handover packs for automation agencies";
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
          justifyContent: "space-between",
          backgroundColor: "#f6f1e7",
          padding: "64px",
          fontFamily: "Arial, sans-serif",
          color: "#1e2a28",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "18px" }}>
          <div
            style={{
              width: "56px",
              height: "56px",
              borderRadius: "16px",
              backgroundColor: "#0b6f68",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#ffffff",
              fontSize: "30px",
              fontWeight: 700,
            }}
          >
            H
          </div>
          <div style={{ fontSize: "32px", fontWeight: 700 }}>HandoffKit</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <div style={{ fontSize: "76px", fontWeight: 700, letterSpacing: "-3px", lineHeight: 1.02 }}>
            Hand over the workflow.
          </div>
          <div
            style={{
              fontSize: "76px",
              fontWeight: 700,
              letterSpacing: "-3px",
              lineHeight: 1.02,
              color: "#0b6f68",
            }}
          >
            Not the mess.
          </div>
          <div style={{ fontSize: "27px", color: "#5e6b66", marginTop: "10px" }}>
            Client-ready n8n handover packs, AI registers and runbooks.
          </div>
        </div>

        <div style={{ display: "flex", gap: "12px" }}>
          {["Readiness score", "AI register", "Data map", "Runbook"].map((label) => (
            <div
              key={label}
              style={{
                display: "flex",
                padding: "10px 18px",
                borderRadius: "999px",
                backgroundColor: "#ffffff",
                border: "1px solid #dcd3c4",
                fontSize: "20px",
                color: "#1e2a28",
              }}
            >
              {label}
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size },
  );
}
