import type { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "PredictX - Web3 Football Prediction Markets",
    short_name: "PredictX",
    description: "Stake on football match events, vote on outcomes, and win proportional rewards from the pool",
    start_url: "/",
    scope: "/",
    display: "standalone",
    theme_color: "#0a0e27",
    background_color: "#0a0e27",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml" },
      { src: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
  }
}
