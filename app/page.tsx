import { Hero } from "@/components/hero"
import { PlatformStats } from "@/components/platform-stats"
import { HomePlatformStats } from "@/components/home/platform-stats"
import { TrendingPolls } from "@/components/home/trending-polls"
import { UpcomingMatches } from "@/components/home/upcoming-matches"

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
