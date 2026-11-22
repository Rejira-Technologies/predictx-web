import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Resolution Arena - PredictX Community Voting",
  description: "Review football event evidence, participate in community consensus, and earn voter rewards.",
  openGraph: {
    title: "Resolution Arena - PredictX Community Voting",
    description: "Review football event evidence, participate in community consensus, and earn voter rewards.",
  },
};

export default function VotingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
