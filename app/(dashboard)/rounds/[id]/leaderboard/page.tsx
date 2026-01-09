"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import api from "@/lib/api/client"
import type { Leaderboard, LeaderboardSortBy, User } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { LeaderboardTable } from "@/components/leaderboard/leaderboard-table"
import { ArrowLeft, Trophy, Loader2, TrendingUp, TrendingDown, Clock, Target } from "lucide-react"
import { formatPercent } from "@/lib/utils"

const SORT_OPTIONS: { value: LeaderboardSortBy; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { value: "sharpe_ratio", label: "Sharpe", icon: Target },
  { value: "total_return", label: "Return", icon: TrendingUp },
  { value: "max_drawdown", label: "Min DD", icon: TrendingDown },
  { value: "calmar_ratio", label: "Calmar", icon: Target },
  { value: "win_rate", label: "Win Rate", icon: Trophy },
  { value: "survival_time", label: "Survival", icon: Clock },
]

export default function LeaderboardPage() {
  const params = useParams()
  const router = useRouter()
  const roundId = params.id as string

  const [leaderboard, setLeaderboard] = useState<Leaderboard | null>(null)
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [sortBy, setSortBy] = useState<LeaderboardSortBy>("sharpe_ratio")

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [leaderboardData, userData] = await Promise.all([
          api.leaderboard.get(roundId, sortBy, sortBy === "max_drawdown"),
          api.auth.me(),
        ])
        setLeaderboard(leaderboardData)
        setCurrentUser(userData)
      } catch (error) {
        console.error("Failed to fetch leaderboard:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [roundId, sortBy])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!leaderboard) {
    return (
      <div className="text-center py-24">
        <p className="text-muted-foreground">Leaderboard not available</p>
        <Button variant="outline" className="mt-4" onClick={() => router.back()}>
          Go Back
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <Button
          variant="ghost"
          size="sm"
          className="mb-2 -ml-2"
          onClick={() => router.push(`/rounds/${roundId}`)}
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Round
        </Button>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Trophy className="h-8 w-8 text-yellow-500" />
          {leaderboard.round_name} - Leaderboard
        </h1>
        <p className="text-muted-foreground">
          {leaderboard.total_participants} participants competed
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              Best Sharpe Ratio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {leaderboard.best_sharpe?.toFixed(2) || "N/A"}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              Best Return
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">
              {formatPercent(leaderboard.best_return)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              Lowest Drawdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              -{leaderboard.lowest_drawdown.toFixed(2)}%
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              Avg Survival
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {leaderboard.average_survival.toFixed(0)} ticks
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sort Tabs */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle>Rankings</CardTitle>
            <Tabs value={sortBy} onValueChange={(v) => setSortBy(v as LeaderboardSortBy)}>
              <TabsList className="grid grid-cols-3 sm:grid-cols-6 h-auto">
                {SORT_OPTIONS.map(({ value, label, icon: Icon }) => (
                  <TabsTrigger
                    key={value}
                    value={value}
                    className="text-xs sm:text-sm"
                  >
                    <Icon className="h-3 w-3 mr-1 hidden sm:inline" />
                    {label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        <CardContent>
          <LeaderboardTable
            entries={leaderboard.entries}
            currentUserId={currentUser?.id}
          />
        </CardContent>
      </Card>
    </div>
  )
}
