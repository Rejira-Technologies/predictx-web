"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import { Scale, Activity } from "lucide-react";
import { useVoting } from "@/hooks/use-voting";
import { useMockData } from "@/hooks/use-mock-data";
import { useWallet } from "@/hooks/use-wallet";
import { VotingCard } from "@/components/voting/voting-card";
import { GamingButton } from "@/components/shared/gaming-button";

export default function VotingCenterPage() {
  const { isConnected, address, connect } = useWallet();
  const { availablePolls, getVoteReward, getAccuracy, settleRewards } = useVoting();
  const getMatch = useMockData((state) => state.getMatch);

  useEffect(() => {
    settleRewards();

    const handleFocus = () => settleRewards();
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [address, settleRewards]);

  const polls = availablePolls();

  // Calculate total potential rewards across all available polls
  const maxPotentialRewards = polls.reduce((sum, p) => sum + getVoteReward(p.id), 0);
  const accuracy = getAccuracy();

  const handleConnect = async () => {
    try {
      await connect();
    } catch {
      // connect() already surfaces errors via toast; swallow here to avoid
      // double-reporting or an unhandled rejection at the call site.
    }
  };

  if (!isConnected) {
    return (
      <main className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full text-center space-y-6 bg-surface p-8 rounded-2xl border border-primary/20 shadow-[0_0_50px_rgba(0,217,255,0.05)]"
        >
          <div className="w-20 h-20 mx-auto rounded-full bg-primary/10 flex items-center justify-center border border-primary/30">
            <Scale className="w-10 h-10 text-primary" />
          </div>
          <h1 className="font-display font-black text-3xl uppercase text-foreground">
            Connect Wallet
          </h1>
          <p className="text-muted-foreground">
            Connect your wallet to access the Resolution Arena, vote on match outcomes, and earn rewards for your accurate judgments.
          </p>
          <GamingButton variant="primary" onClick={handleConnect} className="w-full h-14 text-lg">
            Connect Wallet
          </GamingButton>
        </motion.div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background">
      {/* Page Header */}
      <div className="bg-background-secondary border-b border-primary/20 py-12 relative overflow-hidden">
        {/* Background ambient light */}
        <div className="absolute top-0 right-1/4 w-[500px] h-[300px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />

        <div className="mx-auto max-w-5xl px-4 lg:px-8 relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-1 h-10 bg-[var(--accent-cyan)] shadow-[0_0_15px_rgba(0,217,255,0.8)]" />
            <h1 className="font-display text-2xl sm:text-4xl font-black uppercase text-[var(--accent-cyan)] text-glow-cyan">
              Resolution Arena
            </h1>
          </div>
          <p className="text-muted-foreground text-lg mb-8 max-w-2xl">
            Vote on poll outcomes and earn rewards. Only available for polls you didn't stake on. Help the community resolve match events accurately.
          </p>

          {/* Stats Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-surface/80 backdrop-blur-sm border border-border rounded-lg p-4 flex items-center gap-4">
              <div className="p-2.5 bg-primary/10 rounded-md text-primary">
                <Activity className="w-5 h-5" />
              </div>
              <div>
                <div className="text-2xl font-display font-black text-foreground">
                  {polls.length}
                </div>
                <div className="text-xs text-muted-foreground uppercase font-bold tracking-wider">
                  Polls need your vote
                </div>
              </div>
            </div>

            <div className="bg-surface/80 backdrop-blur-sm border border-border rounded-lg p-4 flex items-center gap-4 relative overflow-hidden group hover:border-gold/50 transition-colors">
              <div className="absolute inset-0 bg-gradient-to-r from-gold/0 via-gold/5 to-gold/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
              <div className="p-2.5 bg-gold/10 rounded-md text-gold">
                <Scale className="w-5 h-5" />
              </div>
              <div className="relative z-10">
                <div className="text-2xl font-display font-black text-gold text-glow-gold">
                  ${maxPotentialRewards.toFixed(2)}
                </div>
                <div className="text-xs text-gold/80 uppercase font-bold tracking-wider">
                  Earn up to
                </div>
              </div>
            </div>

            <div className="bg-surface/80 backdrop-blur-sm border border-border rounded-lg p-4 flex items-center gap-4">
              <div className="p-2.5 bg-success/10 rounded-md text-success">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
              </div>
              <div>
                <div className="text-2xl font-display font-black text-foreground">
                  {accuracy}%
                </div>
                <div className="text-xs text-muted-foreground uppercase font-bold tracking-wider">
                  Your accuracy
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="mx-auto max-w-5xl px-4 py-12 lg:px-8">

        {/* Information Panel */}
        <div className="mb-8 p-4 bg-primary/5 border border-primary/20 rounded-lg flex gap-3 text-sm text-muted-foreground items-start">
          <div className="mt-0.5 text-primary shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" /></svg>
          </div>
          <div className="space-y-1">
            <span className="font-bold text-foreground">How Voting Works: </span>
            Voting opens immediately after a match concludes and remains active for 2 hours. Your oracle vote helps resolve the poll for all participants. If the community reaches exactly &gt;85% consensus, the poll resolves automatically. Otherwise, admin or multi-sig review is required.
          </div>
        </div>

        {polls.length === 0 ? (
          // Empty State
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-20 text-center"
          >
            <motion.div
              animate={{ y: [0, -15, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="w-32 h-32 mb-8 relative opacity-80"
            >
              <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full" />
              <Scale className="w-full h-full text-primary drop-shadow-[0_0_15px_rgba(0,217,255,0.6)]" />
            </motion.div>
            <h3 className="text-2xl font-display font-black uppercase text-foreground mb-3">
              No Polls Awaiting Your Vote
            </h3>
            <p className="text-muted-foreground mb-8 max-w-md">
              You've judged all available polls! Check back after more matches complete. Remember, you can only vote on polls you didn't stake on.
            </p>
          </motion.div>
        ) : (
          // Voting Cards Grid
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {polls.map((poll) => {
              const match = getMatch(poll.matchId);
              if (!match) return null;

              return (
                <VotingCard key={poll.id} poll={poll} match={match} />
              )
            })}
          </div>
        )}
      </div>
    </main>
  );
}
