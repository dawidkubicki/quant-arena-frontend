"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import api from "@/lib/api/client"
import type { RoundList, User, RoundCreate } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { RoundStatusBadge } from "@/components/rounds/round-status-badge"
import { Slider } from "@/components/ui/slider"
import { toast } from "sonner"
import {
  Shield,
  Plus,
  Play,
  Trash2,
  Loader2,
  Users,
  AlertTriangle,
  StopCircle,
} from "lucide-react"
import { formatDate } from "@/lib/utils"

export default function AdminPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [rounds, setRounds] = useState<RoundList[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [starting, setStarting] = useState<string | null>(null)
  const [stopping, setStopping] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  // New round form state
  const [roundName, setRoundName] = useState("")
  const [marketSeed, setMarketSeed] = useState(Math.floor(Math.random() * 10000))
  const [numTicks, setNumTicks] = useState(1000)
  const [initialEquity, setInitialEquity] = useState(100000)
  const [baseVolatility, setBaseVolatility] = useState(2)
  const [feeRate, setFeeRate] = useState(0.1)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [userData, roundsData] = await Promise.all([
          api.auth.me(),
          api.rounds.list(),
        ])

        if (!userData.is_admin) {
          toast.error("Access denied. Admin only.")
          router.push("/")
          return
        }

        setUser(userData)
        setRounds(roundsData)
      } catch (error) {
        console.error("Failed to fetch data:", error)
        toast.error("Failed to load admin data")
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [router])

  const handleCreateRound = async () => {
    if (!roundName.trim()) {
      toast.error("Please enter a round name")
      return
    }

    setCreating(true)
    try {
      const roundData: RoundCreate = {
        name: roundName,
        market_seed: marketSeed,
        config: {
          market: {
            num_ticks: numTicks,
            initial_equity: initialEquity,
            base_volatility: baseVolatility / 100,
            fee_rate: feeRate / 100,
            initial_price: 100,
            base_drift: 0.0001,
            trend_probability: 0.3,
            volatile_probability: 0.2,
            regime_persistence: 0.95,
            base_slippage: 0.001,
          },
        },
      }

      await api.rounds.create(roundData)
      toast.success("Round created successfully!")

      // Reset form
      setRoundName("")
      setMarketSeed(Math.floor(Math.random() * 10000))
      setDialogOpen(false)

      // Refresh rounds
      const updatedRounds = await api.rounds.list()
      setRounds(updatedRounds)
    } catch (error) {
      console.error("Failed to create round:", error)
      toast.error("Failed to create round")
    } finally {
      setCreating(false)
    }
  }

  const handleStartRound = async (roundId: string) => {
    setStarting(roundId)
    try {
      await api.rounds.start(roundId)
      toast.success("Simulation started!")

      // Refresh rounds
      const updatedRounds = await api.rounds.list()
      setRounds(updatedRounds)
    } catch (error) {
      console.error("Failed to start round:", error)
      toast.error("Failed to start simulation")
    } finally {
      setStarting(null)
    }
  }

  const handleStopRound = async (roundId: string) => {
    if (!confirm("Are you sure you want to force stop this simulation?")) return

    setStopping(roundId)
    try {
      await api.rounds.stop(roundId)
      toast.success("Simulation stopped")

      // Refresh rounds
      const updatedRounds = await api.rounds.list()
      setRounds(updatedRounds)
    } catch (error) {
      console.error("Failed to stop round:", error)
      toast.error("Failed to stop simulation")
    } finally {
      setStopping(null)
    }
  }

  const handleDeleteRound = async (roundId: string) => {
    if (!confirm("Are you sure you want to delete this round?")) return

    setDeleting(roundId)
    try {
      await api.rounds.delete(roundId)
      toast.success("Round deleted")

      // Refresh rounds
      const updatedRounds = await api.rounds.list()
      setRounds(updatedRounds)
    } catch (error) {
      console.error("Failed to delete round:", error)
      toast.error("Failed to delete round")
    } finally {
      setDeleting(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!user?.is_admin) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
        <p className="text-muted-foreground">Access denied. Admin only.</p>
      </div>
    )
  }

  const pendingRounds = rounds.filter((r) => r.status === "PENDING")
  const runningRounds = rounds.filter((r) => r.status === "RUNNING")
  const completedRounds = rounds.filter((r) => r.status === "COMPLETED")

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Shield className="h-8 w-8" />
            Admin Panel
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage trading rounds and simulations
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Round
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Create New Round</DialogTitle>
              <DialogDescription>
                Set up a new trading competition round.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Round Name</Label>
                <Input
                  id="name"
                  placeholder="Battle Round 1"
                  value={roundName}
                  onChange={(e) => setRoundName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="seed">Market Seed</Label>
                <Input
                  id="seed"
                  type="number"
                  value={marketSeed}
                  onChange={(e) => setMarketSeed(parseInt(e.target.value) || 0)}
                />
                <p className="text-xs text-muted-foreground">
                  Same seed = reproducible market
                </p>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label>Number of Ticks</Label>
                  <span className="text-sm text-muted-foreground">{numTicks}</span>
                </div>
                <Slider
                  value={[numTicks]}
                  onValueChange={([v]) => setNumTicks(v)}
                  min={100}
                  max={5000}
                  step={100}
                />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label>Initial Equity ($)</Label>
                  <span className="text-sm text-muted-foreground">
                    ${initialEquity.toLocaleString()}
                  </span>
                </div>
                <Slider
                  value={[initialEquity]}
                  onValueChange={([v]) => setInitialEquity(v)}
                  min={10000}
                  max={1000000}
                  step={10000}
                />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label>Base Volatility</Label>
                  <span className="text-sm text-muted-foreground">{baseVolatility}%</span>
                </div>
                <Slider
                  value={[baseVolatility]}
                  onValueChange={([v]) => setBaseVolatility(v)}
                  min={0.5}
                  max={10}
                  step={0.5}
                />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label>Fee Rate</Label>
                  <span className="text-sm text-muted-foreground">{feeRate}%</span>
                </div>
                <Slider
                  value={[feeRate]}
                  onValueChange={([v]) => setFeeRate(v)}
                  min={0}
                  max={1}
                  step={0.05}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateRound} disabled={creating}>
                {creating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Create Round
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Pending Rounds</CardDescription>
            <CardTitle className="text-3xl">{pendingRounds.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Running Rounds</CardDescription>
            <CardTitle className="text-3xl">{runningRounds.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Completed Rounds</CardDescription>
            <CardTitle className="text-3xl">{completedRounds.length}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Rounds Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Rounds</CardTitle>
        </CardHeader>
        <CardContent>
          {rounds.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No rounds yet. Create one to get started!
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Agents</TableHead>
                  <TableHead>Seed</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rounds.map((round) => (
                  <TableRow key={round.id}>
                    <TableCell className="font-medium">{round.name}</TableCell>
                    <TableCell>
                      <RoundStatusBadge status={round.status} />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        {round.agent_count}
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {round.market_seed}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(round.created_at)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {round.status === "PENDING" && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => handleStartRound(round.id)}
                              disabled={starting === round.id}
                            >
                              {starting === round.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Play className="h-4 w-4" />
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDeleteRound(round.id)}
                              disabled={deleting === round.id}
                            >
                              {deleting === round.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                            </Button>
                          </>
                        )}
                        {round.status === "RUNNING" && (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleStopRound(round.id)}
                            disabled={stopping === round.id}
                          >
                            {stopping === round.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <>
                                <StopCircle className="h-4 w-4 mr-1" />
                                Force Stop
                              </>
                            )}
                          </Button>
                        )}
                        {round.status === "COMPLETED" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              router.push(`/rounds/${round.id}/leaderboard`)
                            }
                          >
                            Results
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
