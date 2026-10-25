import { Hero } from "@/components/hero"
import { PlatformStats } from "@/components/platform-stats"
import { HomePlatformStats, TrendingPolls, UpcomingMatches } from "@/components/home"

export default function Home() {
  return (
    <main className="min-h-screen">
      <Hero />
      <PlatformStats />
      <HomePlatformStats />
      <TrendingPolls />
      <UpcomingMatches />
    </main>
  )
}
