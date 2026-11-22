import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Match Predictions - PredictX Football Markets",
  description: "Stake on football match events, vote on outcomes, and win proportional rewards from the pool.",
  openGraph: {
    title: "Match Predictions - PredictX Football Markets",
    description: "Stake on football match events, vote on outcomes, and win proportional rewards from the pool.",
  },
};

export default function MatchLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
