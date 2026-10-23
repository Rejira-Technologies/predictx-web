import { Suspense } from "react"
import { DashboardTabs } from "@/components/dashboard-tabs"
import { BadgesStrip } from "@/components/dashboard/badges-strip"

export default function DashboardPage() {
  return (
    <main className="min-h-screen bg-background">
      <div className="bg-background-secondary border-b border-primary/20 py-8 sm:py-12">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-1 h-10 bg-primary glow-cyan" />
            <h1 className="font-display text-2xl sm:text-4xl font-black uppercase text-primary text-glow-cyan">My Predictions</h1>
          </div>
          <p className="text-muted-foreground text-lg">
            Track your active stakes, pending resolutions, and voting opportunities
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
        <BadgesStrip />
        {/*
          DashboardTabs uses useSearchParams to read/write ?tab=.
          Next.js requires any component that calls useSearchParams to be
          wrapped in a Suspense boundary during static rendering.
        */}
        <Suspense fallback={<div className="h-14 bg-surface border-2 border-border rounded animate-pulse" />}>
          <DashboardTabs />
        </Suspense>
      </div>
    </main>
  )
}
