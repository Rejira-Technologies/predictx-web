import { Clock, Users, AlertCircle } from "lucide-react";

const pendingPolls = [
  {
    id: 1,
    match: "Brighton vs West Ham",
    question: "Will Brighton score first?",
    yourSide: "yes",
    yourStake: 175,
    status: "voting",
    votingProgress: 68,
    timeLeft: "1h 23m",
  },
  {
    id: 2,
    match: "Everton vs Wolves",
    question: "Will there be a red card?",
    yourSide: "no",
    yourStake: 100,
    status: "admin-review",
    votingProgress: 72,
    timeLeft: "Reviewing",
  },
]

export function PendingResolution() {
  return (
    <div className="space-y-4">
      {pendingPolls.map((poll) => (
        <div
          key={poll.id}
          className="bg-surface border-2 border-border clip-corner-lg p-6 hover:border-gold transition-all"
        >
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">{poll.match}</div>
                <h3 className="font-display text-xl font-bold text-foreground">{poll.question}</h3>
              </div>
              <div
                className={`px-3 py-1.5 rounded text-xs font-bold uppercase tracking-wider ${poll.status === "voting" ? "bg-primary/20 text-primary" : "bg-gold/20 text-gold"}`}
              >
                {poll.status === "voting" ? "Voting in Progress" : "Admin Review"}
              </div>
            </div>

            <div className="flex items-center gap-6">
              <div>
                <div className="text-xs text-muted-foreground mb-1">Your Side</div>
                <div
                  className={`inline-block px-3 py-1 rounded font-bold text-sm uppercase ${poll.yourSide === "yes" ? "bg-success/20 text-success" : "bg-accent/20 text-accent"}`}
                >
                  {poll.yourSide}
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1">Your Stake</div>
                <div className="font-mono font-bold text-lg">${poll.yourStake}</div>
              </div>
            </div>

            {poll.status === "voting" && (
              <div className="p-4 bg-background rounded border border-primary/30 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-primary" />
                    <span className="text-muted-foreground">Community Voting</span>
                  </div>
                  <span className="font-mono font-bold text-primary">{poll.votingProgress}% Consensus</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span>Voting ends in {poll.timeLeft}</span>
                </div>
              </div>
            )}

            {poll.status === "admin-review" && (
              <div className="flex gap-2 p-3 bg-gold/10 border border-gold/30 rounded">
                <AlertCircle className="h-5 w-5 text-gold flex-shrink-0 mt-0.5" />
                <div className="text-xs text-muted-foreground">
                  <p className="font-bold text-gold mb-1">Under Admin Verification</p>
                  <p>
                    Voting consensus at {poll.votingProgress}% requires admin review. Result will be finalized with
                    evidence.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
