"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs"
import { ActiveStakes } from "./active-stakes"
import { PendingResolution } from "./pending-resolution"
import { CompletedPredictions } from "./completed-predictions"
import { TransactionHistory } from "./transaction-history"
import { resetAllData } from "@/lib/mock-data"
import { RotateCcw } from "lucide-react"
import { Button } from "./ui/button"
import { useSearchParams } from "next/navigation"
import { Suspense } from "react"

type Tab = "active" | "pending" | "completed" | "transactions"

function DashboardTabsInner() {
  const searchParams = useSearchParams()
  const tabParam = searchParams.get("tab") as Tab | null
  const defaultTab: Tab =
    tabParam === "pending" || tabParam === "completed" || tabParam === "transactions"
      ? tabParam
      : "active"

  const handleReset = () => {
    if (
      typeof window !== "undefined" &&
      window.confirm("Reset all demo data (polls, stakes, votes, and wallet) to initial state?")
    ) {
      resetAllData();
      window.location.reload();
    }
  };

  return (
    <Tabs defaultValue={defaultTab} className="w-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <TabsList className="bg-surface border-2 border-border h-14 p-1">
          <TabsTrigger
            value="active"
            className="data-[state=active]:bg-primary data-[state=active]:text-background font-bold uppercase text-sm tracking-wider px-6 h-full"
          >
            Active Stakes
          </TabsTrigger>
          <TabsTrigger
            value="pending"
            className="data-[state=active]:bg-primary data-[state=active]:text-background font-bold uppercase text-sm tracking-wider px-6 h-full"
          >
            Pending Resolution
          </TabsTrigger>
          <TabsTrigger
            value="completed"
            className="data-[state=active]:bg-primary data-[state=active]:text-background font-bold uppercase text-sm tracking-wider px-6 h-full"
          >
            Completed
          </TabsTrigger>
          <TabsTrigger
            value="transactions"
            className="data-[state=active]:bg-primary data-[state=active]:text-background font-bold uppercase text-sm tracking-wider px-6 h-full"
          >
            Transactions
          </TabsTrigger>
        </TabsList>

        <Button
          variant="outline"
          size="sm"
          onClick={handleReset}
          className="border-primary/40 text-muted-foreground hover:text-foreground hover:border-primary gap-2"
        >
          <RotateCcw className="h-4 w-4" />
          Reset Demo Data
        </Button>
      </div>

      <TabsContent value="active">
        <ActiveStakes />
      </TabsContent>

      <TabsContent value="pending">
        <PendingResolution />
      </TabsContent>

      <TabsContent value="completed">
        <CompletedPredictions />
      </TabsContent>

      <TabsContent value="transactions">
        <TransactionHistory />
      </TabsContent>
    </Tabs>
  )
}

export function DashboardTabs() {
  return (
    <Suspense fallback={null}>
      <DashboardTabsInner />
    </Suspense>
  )
}
