"use client"

import { useEffect, useState } from "react"
import { RoundCard } from "@/components/rounds/round-card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import api from "@/lib/api/client"
import type { RoundList, RoundStatus } from "@/lib/types"
import { Loader2, LayoutDashboard } from "lucide-react"

export default function DashboardPage() {
  const [rounds, setRounds] = useState<RoundList[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<"all" | RoundStatus>("all")

  useEffect(() => {
    const fetchRounds = async () => {
      try {
        const statusFilter = activeTab === "all" ? undefined : activeTab
        const data = await api.rounds.list(statusFilter)
        setRounds(data)
      } catch (error) {
        console.error("Failed to fetch rounds:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchRounds()
  }, [activeTab])

  const pendingRounds = rounds.filter((r) => r.status === "PENDING")
  const runningRounds = rounds.filter((r) => r.status === "RUNNING")
  const completedRounds = rounds.filter((r) => r.status === "COMPLETED")

  return (
    <div className="space-y-6 sm:space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
          <LayoutDashboard className="h-6 w-6 sm:h-8 sm:w-8" />
          Trading Rounds
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground mt-1">
          Join a round and compete with your trading strategy
        </p>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as typeof activeTab)}
      >
        <TabsList className="w-full sm:w-auto grid grid-cols-4 sm:inline-flex h-auto">
          <TabsTrigger value="all" className="text-xs sm:text-sm px-2 sm:px-3 py-1.5">
            All ({rounds.length})
          </TabsTrigger>
          <TabsTrigger value="PENDING" className="text-xs sm:text-sm px-2 sm:px-3 py-1.5">
            <span className="hidden sm:inline">Pending</span>
            <span className="sm:hidden">Wait</span>
            <span className="ml-1">({pendingRounds.length})</span>
          </TabsTrigger>
          <TabsTrigger value="RUNNING" className="text-xs sm:text-sm px-2 sm:px-3 py-1.5">
            <span className="hidden sm:inline">Running</span>
            <span className="sm:hidden">Live</span>
            <span className="ml-1">({runningRounds.length})</span>
          </TabsTrigger>
          <TabsTrigger value="COMPLETED" className="text-xs sm:text-sm px-2 sm:px-3 py-1.5">
            <span className="hidden sm:inline">Completed</span>
            <span className="sm:hidden">Done</span>
            <span className="ml-1">({completedRounds.length})</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-4 sm:mt-6">
          {loading ? (
            <div className="flex items-center justify-center py-12 sm:py-16">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : rounds.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 sm:py-16 px-4">
                <LayoutDashboard className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground mb-4" />
                <p className="text-sm sm:text-base text-muted-foreground text-center">
                  No rounds available yet.
                  <br />
                  Wait for an admin to create a new round.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {rounds.map((round) => (
                <RoundCard key={round.id} round={round} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
