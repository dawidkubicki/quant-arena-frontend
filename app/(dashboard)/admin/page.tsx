"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import api from "@/lib/api/client"
import type { RoundList, User, RoundCreate, MarketDataStatus, MarketDataStats, RoundStatusResponse } from "@/lib/types"
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
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
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
  Database,
  Download,
  CheckCircle,
  XCircle,
  RefreshCw,
  TrendingUp,
} from "lucide-react"
import { formatDate } from "@/lib/utils"

// Progress tracking for running simulations
interface SimulationProgress {
  roundId: string
  progress: number
  agentsProcessed: number
  totalAgents: number
  errorMessage: string | null
}

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

  // Simulation progress tracking
  const [simulationProgress, setSimulationProgress] = useState<Map<string, SimulationProgress>>(new Map())
  const pollingIntervalsRef = useRef<Map<string, NodeJS.Timeout>>(new Map())

  // Market data state
  const [marketDataStatus, setMarketDataStatus] = useState<MarketDataStatus | null>(null)
  const [marketDataStats, setMarketDataStats] = useState<MarketDataStats[]>([])
  const [fetchingData, setFetchingData] = useState(false)
  const [deletingSymbol, setDeletingSymbol] = useState<string | null>(null)

  // New round form state
  const [roundName, setRoundName] = useState("")
  const [marketSeed, setMarketSeed] = useState(Math.floor(Math.random() * 10000))
  const [useRealData, setUseRealData] = useState(true)
  const [tradingInterval, setTradingInterval] = useState("5min")
  const [numTicks, setNumTicks] = useState<number | null>(null) // null = use all data
  const [initialEquity, setInitialEquity] = useState(100000)
  const [baseVolatility, setBaseVolatility] = useState(2)
  const [feeRate, setFeeRate] = useState(0.1)
  const [baseSlippage, setBaseSlippage] = useState(0.1)

  // Cleanup polling intervals on unmount
  useEffect(() => {
    return () => {
      pollingIntervalsRef.current.forEach((interval) => clearInterval(interval))
    }
  }, [])

  // Start polling for a round's status
  const startPolling = useCallback((roundId: string) => {
    // Don't start if already polling
    if (pollingIntervalsRef.current.has(roundId)) return

    const pollStatus = async () => {
      try {
        const status: RoundStatusResponse = await api.rounds.getStatus(roundId)
        
        setSimulationProgress((prev) => {
          const newMap = new Map(prev)
          newMap.set(roundId, {
            roundId,
            progress: status.progress,
            agentsProcessed: status.agents_processed,
            totalAgents: status.total_agents,
            errorMessage: status.error_message,
          })
          return newMap
        })

        if (status.status === 'COMPLETED') {
          // Clear polling interval
          const interval = pollingIntervalsRef.current.get(roundId)
          if (interval) {
            clearInterval(interval)
            pollingIntervalsRef.current.delete(roundId)
          }
          
          // Clear progress and refresh rounds
          setSimulationProgress((prev) => {
            const newMap = new Map(prev)
            newMap.delete(roundId)
            return newMap
          })
          setStarting(null)
          
          toast.success("Simulation completed!")
          const updatedRounds = await api.rounds.list()
          setRounds(updatedRounds)
        } else if (status.status === 'FAILED') {
          // Clear polling interval
          const interval = pollingIntervalsRef.current.get(roundId)
          if (interval) {
            clearInterval(interval)
            pollingIntervalsRef.current.delete(roundId)
          }
          
          // Clear progress and refresh rounds
          setSimulationProgress((prev) => {
            const newMap = new Map(prev)
            newMap.delete(roundId)
            return newMap
          })
          setStarting(null)
          
          toast.error(status.error_message || "Simulation failed")
          const updatedRounds = await api.rounds.list()
          setRounds(updatedRounds)
        }
      } catch (error) {
        console.error("Failed to poll round status:", error)
      }
    }

    // Initial poll
    pollStatus()

    // Set up interval for subsequent polls (every 1.5 seconds)
    const interval = setInterval(pollStatus, 1500)
    pollingIntervalsRef.current.set(roundId, interval)
  }, [])

  const fetchMarketDataInfo = async () => {
    try {
      const [statusData, statsData] = await Promise.all([
        api.marketData.getStatus(),
        api.marketData.getStats(),
      ])
      setMarketDataStatus(statusData)
      setMarketDataStats(statsData)
    } catch (error) {
      console.error("Failed to fetch market data info:", error)
    }
  }

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

        // Start polling for any rounds that are already running
        roundsData
          .filter((r) => r.status === 'RUNNING')
          .forEach((r) => startPolling(r.id))

        // Fetch market data status
        await fetchMarketDataInfo()
      } catch (error) {
        console.error("Failed to fetch data:", error)
        toast.error("Failed to load admin data")
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [router, startPolling])

  const handleCreateRound = async () => {
    if (!roundName.trim()) {
      toast.error("Please enter a round name")
      return
    }

    // Warn if trying to use real data without it being available
    if (useRealData && !marketDataStatus?.is_ready) {
      toast.error("Real market data is not available. Please fetch data first or use synthetic data.")
      return
    }

    setCreating(true)
    try {
      const roundData: RoundCreate = {
        name: roundName,
        market_seed: marketSeed,
        config: {
          market: useRealData ? {
            // Real data configuration
            trading_interval: tradingInterval,
            num_ticks: numTicks, // null = use all available data
            initial_equity: initialEquity,
            base_slippage: baseSlippage / 100,
            fee_rate: feeRate / 100,
          } : {
            // Synthetic data configuration
            num_ticks: numTicks || 1000,
            initial_equity: initialEquity,
            base_volatility: baseVolatility / 100,
            fee_rate: feeRate / 100,
            initial_price: 100,
            base_drift: 0.0001,
            trend_probability: 0.3,
            volatile_probability: 0.2,
            regime_persistence: 0.95,
            base_slippage: baseSlippage / 100,
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

  const handleFetchMarketData = async () => {
    setFetchingData(true)
    toast.info("Fetching market data... This may take several minutes due to API rate limits.")
    
    try {
      const result = await api.marketData.fetch({
        symbols: ['AAPL', 'SPY'],
        months: 6,
      })
      toast.success(result.message)
      
      // Refresh market data status
      await fetchMarketDataInfo()
    } catch (error) {
      console.error("Failed to fetch market data:", error)
      toast.error("Failed to fetch market data")
    } finally {
      setFetchingData(false)
    }
  }

  const handleDeleteMarketData = async (symbol: string) => {
    setDeletingSymbol(symbol)
    try {
      const result = await api.marketData.delete(symbol)
      toast.success(result.message)
      
      // Refresh market data status
      await fetchMarketDataInfo()
    } catch (error) {
      console.error("Failed to delete market data:", error)
      toast.error("Failed to delete market data")
    } finally {
      setDeletingSymbol(null)
    }
  }

  const handleStartRound = async (roundId: string) => {
    setStarting(roundId)
    try {
      // The backend now returns 202 Accepted immediately
      const status = await api.rounds.start(roundId)
      
      // Initialize progress tracking
      setSimulationProgress((prev) => {
        const newMap = new Map(prev)
        newMap.set(roundId, {
          roundId,
          progress: status.progress || 0,
          agentsProcessed: status.agents_processed || 0,
          totalAgents: status.total_agents || 0,
          errorMessage: null,
        })
        return newMap
      })

      toast.info("Simulation started! Tracking progress...")

      // Start polling for progress updates
      startPolling(roundId)

      // Refresh rounds to update status to RUNNING
      const updatedRounds = await api.rounds.list()
      setRounds(updatedRounds)
    } catch (error) {
      console.error("Failed to start round:", error)
      toast.error("Failed to start simulation")
      setStarting(null)
    }
    // Note: setStarting(null) is now handled in the polling callback when complete/failed
  }

  const handleStopRound = async (roundId: string) => {
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
  const failedRounds = rounds.filter((r) => r.status === "FAILED")

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Shield className="h-8 w-8" />
            Admin Panel
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage trading rounds and market data
          </p>
        </div>
      </div>

      <Tabs defaultValue="rounds" className="space-y-6">
        <TabsList>
          <TabsTrigger value="rounds" className="gap-2">
            <Users className="h-4 w-4" />
            Rounds
          </TabsTrigger>
          <TabsTrigger value="data" className="gap-2">
            <Database className="h-4 w-4" />
            Market Data
          </TabsTrigger>
        </TabsList>

        {/* Rounds Tab */}
        <TabsContent value="rounds" className="space-y-6 mt-0">
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={async () => {
                try {
                  const updatedRounds = await api.rounds.list()
                  setRounds(updatedRounds)
                  toast.success("Rounds refreshed")
                } catch (error) {
                  console.error("Failed to refresh rounds:", error)
                  toast.error("Failed to refresh rounds")
                }
              }}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Reload
            </Button>
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
            <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
              <div className="space-y-2">
                <Label htmlFor="name">Round Name</Label>
                <Input
                  id="name"
                  placeholder="Battle Round 1"
                  value={roundName}
                  onChange={(e) => setRoundName(e.target.value)}
                />
              </div>
              
              {/* Data Source Toggle */}
              <div className="space-y-2">
                <Label>Data Source</Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={useRealData ? "default" : "outline"}
                    className="flex-1"
                    onClick={() => setUseRealData(true)}
                    disabled={!marketDataStatus?.is_ready}
                  >
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Real Data (AAPL/SPY)
                  </Button>
                  <Button
                    type="button"
                    variant={!useRealData ? "default" : "outline"}
                    className="flex-1"
                    onClick={() => setUseRealData(false)}
                  >
                    <Database className="h-4 w-4 mr-2" />
                    Synthetic (GBM)
                  </Button>
                </div>
                {useRealData && !marketDataStatus?.is_ready && (
                  <p className="text-xs text-destructive">
                    Real data not available. Please fetch market data first.
                  </p>
                )}
                {useRealData && marketDataStatus?.is_ready && (
                  <p className="text-xs text-green-600">
                    Uses real AAPL prices with SPY benchmark for alpha/beta calculations.
                  </p>
                )}
              </div>

              {/* Real Data Options */}
              {useRealData && (
                <div className="space-y-2">
                  <Label>Trading Interval</Label>
                  <Select value={tradingInterval} onValueChange={setTradingInterval}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1min">1 Minute</SelectItem>
                      <SelectItem value="5min">5 Minutes</SelectItem>
                      <SelectItem value="15min">15 Minutes</SelectItem>
                      <SelectItem value="30min">30 Minutes</SelectItem>
                      <SelectItem value="1h">1 Hour</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Timeframe for the simulation. Smaller intervals = more ticks.
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="seed">Market Seed</Label>
                <Input
                  id="seed"
                  type="number"
                  value={marketSeed}
                  onChange={(e) => setMarketSeed(parseInt(e.target.value) || 0)}
                />
                <p className="text-xs text-muted-foreground">
                  {useRealData ? "Used for agent initialization randomness" : "Same seed = reproducible market"}
                </p>
              </div>

              {/* Number of Ticks (conditional) */}
              {!useRealData && (
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label>Number of Ticks</Label>
                    <span className="text-sm text-muted-foreground">{numTicks || 1000}</span>
                  </div>
                  <Slider
                    value={[numTicks || 1000]}
                    onValueChange={([v]) => setNumTicks(v)}
                    min={100}
                    max={5000}
                    step={100}
                  />
                </div>
              )}

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

              {/* Synthetic Data Specific Options */}
              {!useRealData && (
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
              )}

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

              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label>Base Slippage</Label>
                  <span className="text-sm text-muted-foreground">{baseSlippage}%</span>
                </div>
                <Slider
                  value={[baseSlippage]}
                  onValueChange={([v]) => setBaseSlippage(v)}
                  min={0}
                  max={0.5}
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
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Pending Rounds</CardDescription>
                <CardTitle className="text-3xl">{pendingRounds.length}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Running Rounds</CardDescription>
                <CardTitle className="text-3xl text-blue-500">{runningRounds.length}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Completed Rounds</CardDescription>
                <CardTitle className="text-3xl text-green-500">{completedRounds.length}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Failed Rounds</CardDescription>
                <CardTitle className="text-3xl text-red-500">{failedRounds.length}</CardTitle>
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
                    {rounds.map((round) => {
                      const progress = simulationProgress.get(round.id)
                      
                      return (
                      <TableRow key={round.id}>
                        <TableCell className="font-medium">{round.name}</TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <RoundStatusBadge 
                              status={round.status} 
                              progress={progress?.progress}
                              errorMessage={progress?.errorMessage}
                            />
                            {round.status === 'RUNNING' && progress && (
                              <div className="space-y-1">
                                <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                                  <div 
                                    className="bg-blue-500 h-full transition-all duration-300"
                                    style={{ width: `${progress.progress}%` }}
                                  />
                                </div>
                                {progress.agentsProcessed > 0 && (
                                  <p className="text-xs text-muted-foreground">
                                    Saved: {progress.agentsProcessed}/{progress.totalAgents}
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
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
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button
                                      size="sm"
                                      variant="destructive"
                                      disabled={deleting === round.id}
                                    >
                                      {deleting === round.id ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                      ) : (
                                        <Trash2 className="h-4 w-4" />
                                      )}
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Delete Round?</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Are you sure you want to delete this round? This action cannot be undone and will permanently delete the round and all associated agent data.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                      <AlertDialogAction onClick={() => handleDeleteRound(round.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                        Delete
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </>
                            )}
                            {round.status === "RUNNING" && (
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    size="sm"
                                    variant="destructive"
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
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Force Stop Simulation?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to force stop this simulation? This will immediately terminate the running simulation and mark the round as completed with current results.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleStopRound(round.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                      Force Stop
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            )}
                            {(round.status === "COMPLETED" || round.status === "FAILED") && (
                              <>
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
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button
                                      size="sm"
                                      variant="destructive"
                                      disabled={deleting === round.id}
                                    >
                                      {deleting === round.id ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                      ) : (
                                        <Trash2 className="h-4 w-4" />
                                      )}
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Delete {round.status === "FAILED" ? "Failed" : "Completed"} Round?</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Are you sure you want to delete this {round.status.toLowerCase()} round? This action cannot be undone and will permanently delete the round, all agent configurations, simulation results, and leaderboard data.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                      <AlertDialogAction onClick={() => handleDeleteRound(round.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                        Delete
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )})}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Market Data Tab */}
        <TabsContent value="data" className="space-y-6 mt-0">
          <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Market Data
              </CardTitle>
              <CardDescription>
                Real historical data from Twelve Data API for AAPL/SPY trading
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={fetchMarketDataInfo}
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button disabled={fetchingData}>
                    {fetchingData ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Fetching...
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4 mr-2" />
                        Fetch Data
                      </>
                    )}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Fetch Market Data?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will fetch 6 months of 1-minute AAPL and SPY data from Twelve Data API. 
                      This process takes several minutes due to API rate limits (8 requests/minute).
                      Any existing data for these symbols will be replaced.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleFetchMarketData}>
                      Start Fetch
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Data Status */}
          <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
            {marketDataStatus?.is_ready ? (
              <CheckCircle className="h-8 w-8 text-green-500 flex-shrink-0" />
            ) : (
              <XCircle className="h-8 w-8 text-red-500 flex-shrink-0" />
            )}
            <div className="flex-1">
              <p className="font-medium">
                {marketDataStatus?.is_ready ? "Data Ready" : "Data Not Available"}
              </p>
              <p className="text-sm text-muted-foreground">
                {marketDataStatus?.message || "Loading..."}
              </p>
            </div>
            <div className="flex gap-2">
              <Badge variant={marketDataStatus?.has_aapl ? "default" : "secondary"}>
                AAPL {marketDataStatus?.has_aapl ? "✓" : "✗"}
              </Badge>
              <Badge variant={marketDataStatus?.has_spy ? "default" : "secondary"}>
                SPY {marketDataStatus?.has_spy ? "✓" : "✗"}
              </Badge>
            </div>
          </div>

          {/* Data Stats Table */}
          {marketDataStats.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Symbol</TableHead>
                  <TableHead>Total Bars</TableHead>
                  <TableHead>Date Range</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {marketDataStats.map((stat) => (
                  <TableRow key={stat.symbol}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                        {stat.symbol}
                      </div>
                    </TableCell>
                    <TableCell className="font-mono">
                      {stat.total_bars.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(stat.earliest_date).toLocaleDateString()} - {new Date(stat.latest_date).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            size="sm"
                            variant="destructive"
                            disabled={deletingSymbol === stat.symbol}
                          >
                            {deletingSymbol === stat.symbol ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete {stat.symbol} Data?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently delete all {stat.total_bars.toLocaleString()} data points for {stat.symbol}.
                              You will need to re-fetch the data if you want to use it again.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteMarketData(stat.symbol)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {marketDataStats.length === 0 && marketDataStatus && (
            <div className="text-center py-6 text-muted-foreground">
              <Database className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No market data available</p>
              <p className="text-sm">Click &quot;Fetch Data&quot; to download AAPL/SPY historical data</p>
            </div>
          )}
        </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
