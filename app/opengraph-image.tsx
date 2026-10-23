import { ImageResponse } from "next/og"

export const alt = "PredictX - Web3 Football Prediction Markets"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          background: "linear-gradient(135deg, #0a0e27 0%, #1a1f3a 50%, #0a0e27 100%)",
          color: "#ffffff",
        }}
      >
        <div style={{ fontSize: 120, fontWeight: 900, letterSpacing: "-2px" }}>PredictX</div>
        <div style={{ marginTop: 24, fontSize: 44, color: "#00d9ff" }}>Web3 Football Prediction Markets</div>
        <div style={{ marginTop: 32, fontSize: 30, color: "#c8cce0", maxWidth: 900 }}>
          Stake on football match events, vote on outcomes, and win proportional rewards from the pool
        </div>
      </div>
    ),
    size,
  )
}
