import { AnalyticsPrefsCard } from "@/components/settings/analytics-prefs-card";
import { Settings } from "lucide-react";

export const metadata = {
  title: "Settings — PredictX",
  description: "Manage your PredictX preferences, including analytics opt-out.",
};

export default function SettingsPage() {
  return (
    <main className="min-h-screen bg-background">
      {/* Page header */}
      <div className="bg-background border-b border-primary/20 py-8 sm:py-12">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-1 h-10 bg-primary glow-cyan" />
            <h1 className="font-display text-2xl sm:text-4xl font-black uppercase text-primary text-glow-cyan">
              Settings
            </h1>
          </div>
          <p className="text-muted-foreground text-lg">
            Manage your PredictX preferences
          </p>
        </div>
      </div>

      {/* Settings content */}
      <div className="mx-auto max-w-2xl px-4 py-10 lg:px-8 space-y-6">
        {/* Section label */}
        <div className="flex items-center gap-2 mb-2">
          <Settings className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
          <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Privacy
          </h2>
        </div>

        {/* Analytics opt-out card */}
        <AnalyticsPrefsCard />
      </div>
    </main>
  );
}
