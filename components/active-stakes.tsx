"use client"

import { Clock, TrendingUp } from "lucide-react"
import { Progress } from "./ui/progress"
import { EmptyState } from "./shared/empty-state"

const activeStakes = [
  {
    id: 1,
    match: "Chelsea vs Man United",
    question: "Will Palmer score a goal?",
    yourSide: "yes",
    yourStake: 200,
    yesPool: 7200,
    noPool: 3000,
    potentialWinnings: 298,
    timeLeft: "2h 34m",
  },
  {
    id: 2,
    match: "Arsenal vs Liverpool",
    question: "Will Salah be subbed out?",
    yourSide: "no",
    yourStake: 150,
    yesPool: 2500,
    noPool: 4350,
    potentialWinnings: 223,
    timeLeft: "45m",
  },
  {
    id: 3,
    match: "Man City vs Tottenham",
    question: "Will Haaland score 2+ goals?",
    yourSide: "yes",
    yourStake: 300,
    yesPool: 8800,
    noPool: 6300,
    potentialWinnings: 478,
    timeLeft: "5h 12m",
  },
]

export function ActiveStakes() {
  if (activeStakes.length === 0) {
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
      {activeStakes.map((stake) => {
        const total = stake.yesPool + stake.noPool
        const yesPercentage = (stake.yesPool / total) * 100
        const profit = stake.potentialWinnings - stake.yourStake
        const roi = (profit / stake.yourStake) * 100

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
                    <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">{stake.match}</div>
                    <h3 className="font-display text-xl font-bold text-foreground">{stake.question}</h3>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-background rounded text-xs font-mono font-bold text-primary whitespace-nowrap">
                    <Clock className="h-4 w-4" />
                    {stake.timeLeft}
                  </div>
                </div>

                {/* Your Position */}
                <div className="flex items-center gap-6">
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Your Side</div>
                    <div
                      className={`inline-block px-3 py-1 rounded font-bold text-sm uppercase ${stake.yourSide === "yes" ? "bg-success/20 text-success" : "bg-accent/20 text-accent"}`}
                    >
                      {stake.yourSide}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Your Stake</div>
                    <div className="font-mono font-bold text-lg">${stake.yourStake}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Potential Win</div>
                    <div className="font-mono font-bold text-lg text-gold">${stake.potentialWinnings}</div>
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
                    <span className="text-success font-bold">YES ${stake.yesPool.toLocaleString()}</span>
                    <span className="text-accent font-bold">NO ${stake.noPool.toLocaleString()}</span>
                  </div>
                  <Progress
                    value={yesPercentage}
                    aria-label={`Pool distribution: ${yesPercentage}% YES`}
                    className="h-3"
                  />
                </div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
