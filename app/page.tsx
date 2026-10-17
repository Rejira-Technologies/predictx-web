import { Hero } from "@/components/hero"
import { HomePlatformStats } from "@/components/home/platform-stats"
import { TrendingPolls } from "@/components/home/trending-polls"
import { UpcomingMatches } from "@/components/home/upcoming-matches"

export default function Home() {
  return (
    <main className="min-h-screen">
      <Hero />
      <HomePlatformStats />
      <TrendingPolls />
      <UpcomingMatches />
    </main>
  )
}
