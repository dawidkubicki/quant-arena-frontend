"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import api from "@/lib/api/client"
import type { RoundList } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Trophy, Loader2, Calendar } from "lucide-react"
import { formatDate } from "@/lib/utils"

export default function LeaderboardIndexPage() {
  const [rounds, setRounds] = useState<RoundList[]>([])
  const [loading, setLoading] = useState(true)

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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Trophy className="h-8 w-8 text-yellow-500" />
          Leaderboards
        </h1>
        <p className="text-muted-foreground mt-1">
          View results from completed trading rounds
        </p>
      </div>

      {rounds.length === 0 ? (
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
    </div>
  )
}
