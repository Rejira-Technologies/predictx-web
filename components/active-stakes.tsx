"use client"

import { TrendingUp } from "lucide-react"
import { Progress } from "./ui/progress"
import { EmptyState } from "./shared/empty-state"
// #246: read the connected wallet's active stakes from the store instead of a
// hardcoded constant — mirrors the pattern used in completed-predictions.tsx
import { useStaking } from "@/hooks/use-staking"
import { useMockData } from "@/hooks/use-mock-data"
import { calculatePotentialWinnings } from "@/lib/calculations"

export function ActiveStakes() {
  // wallet-scoped selector: returns only stakes for the connected address
  const stakes = useStaking((s) => s.activeStakes())
  const getPoll = useMockData((s) => s.getPoll)
  const getMatch = useMockData((s) => s.getMatch)

  if (stakes.length === 0) {
    return (
      <EmptyState
        icon={<TrendingUp className="w-10 h-10" />}
        title="No Active Stakes Yet"
        description="Jump into the action by staking on a match event."
      />
    )
  }

  return (
    <div className="space-y-4">
      {stakes.map((stake) => {
        const poll = getPoll(stake.pollId)
        const match = getMatch(stake.matchId)
        const matchName = match
          ? `${match.homeTeam} vs ${match.awayTeam}`
          : stake.matchName

        const yesPool = poll?.yesPool ?? 0
        const noPool = poll?.noPool ?? 0
        const total = yesPool + noPool
        const yesPercentage = total > 0 ? (yesPool / total) * 100 : 50

        const winnings = poll
          ? calculatePotentialWinnings(stake.amount, stake.side, yesPool, noPool)
          : null
        const potentialWinnings = winnings?.grossWinnings ?? stake.amount
        const profit = potentialWinnings - stake.amount
        const roi = (profit / stake.amount) * 100

        return (
          <div
            key={stake.id}
            className="bg-surface border-2 border-border clip-corner-lg p-6 hover:border-primary transition-all"
          >
            <div className="flex flex-col lg:flex-row gap-6">
              {/* Left: Poll Info */}
              <div className="flex-1 space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">{matchName}</div>
                    <h3 className="font-display text-xl font-bold text-foreground">{stake.question}</h3>
                  </div>
                </div>

                {/* Your Position */}
                <div className="flex items-center gap-6">
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Your Side</div>
                    <div
                      className={`inline-block px-3 py-1 rounded font-bold text-sm uppercase ${stake.side === "yes" ? "bg-success/20 text-success" : "bg-accent/20 text-accent"}`}
                    >
                      {stake.side}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Your Stake</div>
                    <div className="font-mono font-bold text-lg">${stake.amount}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Potential Win</div>
                    <div className="font-mono font-bold text-lg text-gold">${potentialWinnings.toFixed(2)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Potential ROI</div>
                    <div
                      className={`font-mono font-bold text-lg ${roi > 0 ? "text-success" : roi < 0 ? "text-accent" : "text-muted-foreground"}`}
                    >
                      {roi > 0 ? "+" : ""}{roi.toFixed(0)}%
                    </div>
                  </div>
                </div>

                {/* Pool Status */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-success font-bold">YES ${yesPool.toLocaleString()}</span>
                    <span className="text-accent font-bold">NO ${noPool.toLocaleString()}</span>
                  </div>
                  <Progress value={yesPercentage} className="h-3" />
                </div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
