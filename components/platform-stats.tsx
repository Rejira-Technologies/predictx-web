import { TrendingUp, Users, Lock, Trophy } from "lucide-react";

const stats = [
  { label: "Total Value Locked", value: "$847,293", icon: Lock, color: "text-primary", glow: "glow-cyan" },
  { label: "Active Predictions", value: "234", icon: TrendingUp, color: "text-success", glow: "glow-green" },
  { label: "Community Members", value: "12,847", icon: Users, color: "text-gold", glow: "glow-gold" },
  { label: "Total Payouts", value: "$3.2M", icon: Trophy, color: "text-accent", glow: "glow-magenta" },
];

export function PlatformStats() {
  return (
    <div className="bg-background-secondary border-y border-primary/20 py-12">
      <div>
        <div className="text-center mb-12 space-y-3">
          <h2 className="font-display text-3xl md:text-4xl font-black uppercase tracking-wider text-foreground text-glow-cyan">
            Platform Stats
          </h2>
          <p className="text-muted-foreground text-sm uppercase tracking-widest font-body">
            Real-time platform activity
          </p>

          <div className="flex items-center justify-center gap-4 pt-1">
            <div className="h-px w-24 bg-linear-to-r from-transparent to-primary/50" />
            <div className="w-2 h-2 rounded-full bg-primary glow-cyan" />
            <div className="h-px w-24 bg-linear-to-l from-transparent to-primary/50" />
          </div>
        </div>
      </div>
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="bg-surface border border-border clip-corner p-6 hover:border-primary/50 transition-all group hover:scale-105 relative overflow-hidden"
            >
              {/* Scan line effect */}
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent translate-y-[-100%] group-hover:translate-y-[100%] transition-transform duration-1000" />

              <div className="relative">
                <div className={`inline-flex p-2 rounded-lg bg-background mb-3 ${stat.glow}`}>
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
                <div className={`text-3xl font-display font-black ${stat.color} mb-1`}>{stat.value}</div>
                <div className="text-sm text-muted-foreground uppercase tracking-wider">{stat.label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
