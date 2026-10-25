import { Hero } from "@/components/hero"
import { HomePlatformStats, TrendingPolls, UpcomingMatches } from "@/components/home"

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
