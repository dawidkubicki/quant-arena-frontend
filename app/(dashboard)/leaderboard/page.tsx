"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import api from "@/lib/api/client"
import type { RoundList, GlobalLeaderboardEntry, GlobalLeaderboard } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Trophy, Loader2, Calendar, Globe, TrendingUp } from "lucide-react"
import { formatDate } from "@/lib/utils"
import { GlobalLeaderboardTable } from "@/components/leaderboard/global-leaderboard-table"
import { createClient } from "@/lib/supabase/client"

export default function LeaderboardIndexPage() {
  const [rounds, setRounds] = useState<RoundList[]>([])
  const [globalLeaderboard, setGlobalLeaderboard] = useState<GlobalLeaderboard | null>(null)
  const [loading, setLoading] = useState(true)
  const [globalLoading, setGlobalLoading] = useState(true)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    const fetchRounds = async () => {
      try {
        const data = await api.rounds.list("COMPLETED")
        setRounds(data)
      } catch (error) {
        console.error("Failed to fetch rounds:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchRounds()
  }, [])

  useEffect(() => {
    const fetchGlobalLeaderboard = async () => {
      try {
        const data = await api.leaderboard.getGlobal()
        setGlobalLeaderboard(data)
      } catch (error) {
        console.error("Failed to fetch global leaderboard:", error)
      } finally {
        setGlobalLoading(false)
      }
    }
    fetchGlobalLeaderboard()
  }, [])

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) return
        
        const user = await api.auth.me()
        setCurrentUserId(user.id)
      } catch (error) {
        console.error("Failed to fetch user:", error)
      }
    }
    fetchUser()
  }, [supabase.auth])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Trophy className="h-8 w-8 text-yellow-500" />
          Leaderboards
        </h1>
        <p className="text-muted-foreground mt-1">
          View global rankings and results from completed trading rounds
        </p>
      </div>

      <Tabs defaultValue="global" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="global" className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            Global
          </TabsTrigger>
          <TabsTrigger value="rounds" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Rounds
          </TabsTrigger>
        </TabsList>

        <TabsContent value="global" className="space-y-4">
          {globalLoading ? (
            <div className="flex items-center justify-center py-24">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : !globalLeaderboard || globalLeaderboard.entries.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Globe className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground text-center">
                  No global leaderboard data yet.
                  <br />
                  Complete some rounds to see rankings.
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Global Rankings</span>
                  <div className="text-sm font-normal text-muted-foreground">
                    {globalLeaderboard.total_users} traders • {globalLeaderboard.total_rounds_analyzed} rounds
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <GlobalLeaderboardTable
                  entries={globalLeaderboard.entries}
                  currentUserId={currentUserId || undefined}
                />
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="rounds" className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-24">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : rounds.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Trophy className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground text-center">
                  No completed rounds yet.
                  <br />
                  Check back after a simulation finishes.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {rounds.map((round) => (
                <Card key={round.id} className="hover:border-primary/50 transition-colors">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Trophy className="h-5 w-5 text-yellow-500" />
                      {round.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="text-sm text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {formatDate(round.created_at)}
                    </div>
                    <div className="text-sm">
                      {round.agent_count} participants
                    </div>
                    <Link href={`/rounds/${round.id}/leaderboard`}>
                      <Button className="w-full">View Leaderboard</Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
