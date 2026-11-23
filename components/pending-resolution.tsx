"use client"

import { Clock, Users, AlertCircle, Hourglass } from "lucide-react"
import { useStaking } from "@/hooks/use-staking"
import { useWallet } from "@/hooks/use-wallet"
import { useMockData } from "@/hooks/use-mock-data"
import { useVoting } from "@/hooks/use-voting"
import { CountdownTimer } from "@/components/shared/countdown-timer"
import { EmptyState } from "./shared/empty-state"
import { getVotingDeadline } from "@/lib/calculations"

export function PendingResolution() {
  // Select the stable `stakes` slice — calling `pendingStakes()` inside a
  // selector allocates a new array on every read, which fails
  // useSyncExternalStore's identity check and causes an infinite render loop.
  const stakes = useStaking((s) => s.stakes)
  const walletAddress = useWallet((s) => s.address)
  const getPoll = useMockData((s) => s.getPoll)
  const getMatch = useMockData((s) => s.getMatch)
  const getTally = useVoting((s) => s.getTally)

  const pendingStakes = stakes.filter(
    (stake) => stake.status === "pending_resolution" && stake.wallet === walletAddress,
  )

  if (!walletAddress || pendingStakes.length === 0) {
    return (
      <EmptyState
        icon={<Hourglass className="w-10 h-10" />}
        title="No Pending Resolutions"
        description="Stakes awaiting community voting or admin review will appear here."
      />
    )
  }

  return (
    <div className="space-y-4">
      {pendingStakes.map((stake) => {
        const poll = getPoll(stake.pollId)
        const match = getMatch(stake.matchId)
        const matchName = match
          ? `${match.homeTeam} vs ${match.awayTeam}`
          : stake.matchName

        // lib/mock-data narrows PollStatus, so widen before comparing against
        // the wider resolution states that can come from the voting store.
        const pollStatus: string | undefined = poll?.status
        const isVoting = pollStatus === "voting"
        const isAdminReview =
          pollStatus === "admin-review" || pollStatus === "multi-sig-review"

        const tally = poll ? getTally(poll.id) : null
        const validVotes = (tally?.yes ?? 0) + (tally?.no ?? 0)
        const consensus =
          tally && validVotes > 0
            ? Math.round((Math.max(tally.yes, tally.no) / validVotes) * 100)
            : 0

        const deadline = poll ? getVotingDeadline(poll, match) : Number.NaN
        const deadlineISO = Number.isNaN(deadline)
          ? null
          : new Date(deadline).toISOString()

        return (
          <div
            key={stake.id}
            className="bg-surface border-2 border-border clip-corner-lg p-6 hover:border-gold transition-all"
          >
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">{matchName}</div>
                  <h3 className="font-display text-xl font-bold text-foreground">{stake.question}</h3>
                </div>
                <div
                  className={`px-3 py-1.5 rounded text-xs font-bold uppercase tracking-wider ${isVoting ? "bg-primary/20 text-primary" : isAdminReview ? "bg-gold/20 text-gold" : "bg-muted text-muted-foreground"}`}
                >
                  {isVoting ? "Voting in Progress" : isAdminReview ? "Admin Review" : "Awaiting Resolution"}
                </div>
              </div>

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
              </div>

              {isVoting && (
                <div className="p-4 bg-background rounded border border-primary/30 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-primary" />
                      <span className="text-muted-foreground">Community Voting</span>
                    </div>
                    <span className="font-mono font-bold text-primary">{consensus}% Consensus</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>Voting ends in</span>
                    {deadlineISO ? (
                      <CountdownTimer targetTime={deadlineISO} label="Voting" compact />
                    ) : (
                      <span>—</span>
                    )}
                  </div>
                </div>
              )}

              {(isAdminReview || (!isVoting && !isAdminReview)) && (
                <div className="flex gap-2 p-3 bg-gold/10 border border-gold/30 rounded">
                  <AlertCircle className="h-5 w-5 text-gold flex-shrink-0 mt-0.5" />
                  <div className="text-xs text-muted-foreground">
                    <p className="font-bold text-gold mb-1">Under Admin Verification</p>
                    <p>
                      {validVotes > 0
                        ? `Voting consensus at ${consensus}% requires admin review. `
                        : "Community voting has not produced a consensus yet. "}
                      Result will be finalized with evidence.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
