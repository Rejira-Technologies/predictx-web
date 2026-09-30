"use client"

import { useSearchParams, useRouter } from "next/navigation"
import { useCallback } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs"
import { ActiveStakes } from "./active-stakes"
import { PendingResolution } from "./pending-resolution"
import { CompletedPredictions } from "./completed-predictions"
import { resetAllData } from "@/lib/mock-data"
import { RotateCcw } from "lucide-react"
import { Button } from "./ui/button"

const VALID_TABS = ["active", "pending", "completed"] as const
type TabValue = (typeof VALID_TABS)[number]

function isValidTab(value: string | null): value is TabValue {
  return VALID_TABS.includes(value as TabValue)
}

export function DashboardTabs() {
  const searchParams = useSearchParams()
  const router = useRouter()

  // Read the active tab from ?tab=; fall back to "active" for unknown/missing values
  const rawTab = searchParams.get("tab")
  const activeTab: TabValue = isValidTab(rawTab) ? rawTab : "active"

  const handleTabChange = useCallback(
    (value: string) => {
      const params = new URLSearchParams(searchParams.toString())
      params.set("tab", value)
      // Replace so the back button doesn't cycle through every tab click
      router.replace(`/dashboard?${params.toString()}`)
    },
    [router, searchParams],
  )

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
    <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
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
    </Tabs>
  )
}
