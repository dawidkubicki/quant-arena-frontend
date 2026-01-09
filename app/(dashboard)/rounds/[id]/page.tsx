"use client"

import { useEffect, useState, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import api from "@/lib/api/client"
import type {
  Round,
  Agent,
  StrategyType,
  AgentConfig,
  StrategyParams,
  SignalStack,
  RiskParams,
} from "@/lib/types"
import {
  DEFAULT_SIGNAL_STACK,
  DEFAULT_RISK_PARAMS,
  DEFAULT_STRATEGY_PARAMS,
} from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { RoundStatusBadge } from "@/components/rounds/round-status-badge"
import { StrategySelector } from "@/components/agent/strategy-selector"
import { StrategyParamsConfig } from "@/components/agent/strategy-params-config"
import { SignalStackConfig } from "@/components/agent/signal-stack-config"
import { RiskParamsConfig } from "@/components/agent/risk-params-config"
import { toast } from "sonner"
import {
  Loader2,
  ArrowLeft,
  Trophy,
  Play,
  Save,
  Trash2,
  Clock,
  CheckCircle,
} from "lucide-react"
import { formatDate, formatCurrency, formatPercent } from "@/lib/utils"
import { TradingChart } from "@/components/charts/trading-chart"
import { EquityCurve } from "@/components/charts/equity-curve"

export default function RoundDetailPage() {
  const params = useParams()
  const router = useRouter()
  const roundId = params.id as string

  const [round, setRound] = useState<Round | null>(null)
  const [agent, setAgent] = useState<Agent | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [polling, setPolling] = useState(false)

  // Agent config state
  const [strategyType, setStrategyType] = useState<StrategyType>("MEAN_REVERSION")
  const [strategyParams, setStrategyParams] = useState<StrategyParams>(
    DEFAULT_STRATEGY_PARAMS.MEAN_REVERSION
  )
  const [signalStack, setSignalStack] = useState<SignalStack>(DEFAULT_SIGNAL_STACK)
  const [riskParams, setRiskParams] = useState<RiskParams>(DEFAULT_RISK_PARAMS)

  const fetchData = useCallback(async () => {
    try {
      const [roundData, agentData] = await Promise.all([
        api.rounds.get(roundId),
        api.agents.getMyAgent(roundId).catch(() => null),
      ])
      setRound(roundData)
      setAgent(agentData)

      if (agentData) {
        setStrategyType(agentData.strategy_type)
        setStrategyParams(agentData.config.strategy_params)
        setSignalStack(agentData.config.signal_stack)
        setRiskParams(agentData.config.risk_params)
      }
    } catch (error) {
      console.error("Failed to fetch data:", error)
      toast.error("Failed to load round data")
    } finally {
      setLoading(false)
    }
  }, [roundId])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Poll for round status when running
  useEffect(() => {
    if (round?.status !== "RUNNING" || polling) return

    setPolling(true)
    const poll = async () => {
      try {
        const status = await api.rounds.getStatus(roundId)
        if (status.status === "COMPLETED") {
          setPolling(false)
          fetchData()
          toast.success("Round completed!")
        } else {
          setTimeout(poll, 1000)
        }
      } catch {
        setPolling(false)
      }
    }
    poll()
  }, [round?.status, roundId, polling, fetchData])

  const handleStrategyChange = (type: StrategyType) => {
    setStrategyType(type)
    setStrategyParams(DEFAULT_STRATEGY_PARAMS[type])
  }

  const handleSaveAgent = async () => {
    setSaving(true)
    try {
      const config: AgentConfig = {
        strategy_params: strategyParams,
        signal_stack: signalStack,
        risk_params: riskParams,
      }
      const savedAgent = await api.agents.createOrUpdate(roundId, {
        strategy_type: strategyType,
        config,
      })
      setAgent(savedAgent)
      toast.success("Agent configuration saved!")
    } catch (error) {
      console.error("Failed to save agent:", error)
      toast.error("Failed to save agent configuration")
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteAgent = async () => {
    if (!confirm("Are you sure you want to delete your agent?")) return

    try {
      await api.agents.deleteMyAgent(roundId)
      setAgent(null)
      setStrategyType("MEAN_REVERSION")
      setStrategyParams(DEFAULT_STRATEGY_PARAMS.MEAN_REVERSION)
      setSignalStack(DEFAULT_SIGNAL_STACK)
      setRiskParams(DEFAULT_RISK_PARAMS)
      toast.success("Agent deleted")
    } catch (error) {
      console.error("Failed to delete agent:", error)
      toast.error("Failed to delete agent")
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!round) {
    return (
      <div className="text-center py-24">
        <p className="text-muted-foreground">Round not found</p>
        <Button variant="outline" className="mt-4" onClick={() => router.push("/")}>
          Back to Dashboard
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="space-y-1">
          <Button
            variant="ghost"
            size="sm"
            className="mb-1 sm:mb-2 -ml-2 h-8"
            onClick={() => router.push("/")}
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <h1 className="text-xl sm:text-3xl font-bold">{round.name}</h1>
            <RoundStatusBadge status={round.status} />
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Created {formatDate(round.created_at)} · Seed: {round.market_seed}
          </p>
        </div>
        {round.status === "COMPLETED" && (
          <Link href={`/rounds/${roundId}/leaderboard`} className="sm:flex-shrink-0">
            <Button className="w-full sm:w-auto">
              <Trophy className="h-4 w-4 mr-2" />
              View Leaderboard
            </Button>
          </Link>
        )}
      </div>

      {/* Status-specific content */}
      {round.status === "PENDING" && (
        <div className="space-y-4 sm:space-y-6">
          {/* Agent Configuration */}
          <Card>
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <Play className="h-4 w-4 sm:h-5 sm:w-5" />
                Configure Your Agent
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 sm:space-y-6 p-4 sm:p-6 pt-0 sm:pt-0">
              <StrategySelector
                value={strategyType}
                onChange={handleStrategyChange}
              />
              <Separator />
              <StrategyParamsConfig
                strategyType={strategyType}
                value={strategyParams}
                onChange={setStrategyParams}
              />
              <Separator />
              <SignalStackConfig
                value={signalStack}
                onChange={setSignalStack}
              />
              <Separator />
              <RiskParamsConfig value={riskParams} onChange={setRiskParams} />
              <Separator />
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                <Button onClick={handleSaveAgent} disabled={saving} className="w-full sm:w-auto">
                  {saving ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  {agent ? "Update Agent" : "Create Agent"}
                </Button>
                {agent && (
                  <Button
                    variant="destructive"
                    onClick={handleDeleteAgent}
                    className="w-full sm:w-auto"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Agent
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {round.status === "RUNNING" && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 sm:py-16 px-4">
            <Loader2 className="h-10 w-10 sm:h-12 sm:w-12 animate-spin text-primary mb-4" />
            <h2 className="text-lg sm:text-xl font-semibold text-center">Simulation Running</h2>
            <p className="text-sm text-muted-foreground mt-2 text-center">
              Please wait while the market simulation runs...
            </p>
            {agent && (
              <p className="text-xs sm:text-sm text-muted-foreground mt-4 text-center">
                Your agent ({agent.strategy_type}) is competing!
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {round.status === "COMPLETED" && agent?.result && (
        <div className="space-y-4 sm:space-y-6">
          {/* Results Summary */}
          <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="pb-1 sm:pb-2 p-3 sm:p-6">
                <CardTitle className="text-xs sm:text-sm text-muted-foreground">
                  Final Equity
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 sm:p-6 pt-0">
                <div className="text-lg sm:text-2xl font-bold">
                  {formatCurrency(agent.result.final_equity)}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-1 sm:pb-2 p-3 sm:p-6">
                <CardTitle className="text-xs sm:text-sm text-muted-foreground">
                  Total Return
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 sm:p-6 pt-0">
                <div
                  className={`text-lg sm:text-2xl font-bold ${
                    agent.result.total_return >= 0
                      ? "text-green-500"
                      : "text-red-500"
                  }`}
                >
                  {formatPercent(agent.result.total_return)}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-1 sm:pb-2 p-3 sm:p-6">
                <CardTitle className="text-xs sm:text-sm text-muted-foreground">
                  Sharpe Ratio
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 sm:p-6 pt-0">
                <div className="text-lg sm:text-2xl font-bold">
                  {agent.result.sharpe_ratio?.toFixed(2) || "N/A"}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-1 sm:pb-2 p-3 sm:p-6">
                <CardTitle className="text-xs sm:text-sm text-muted-foreground">
                  Max Drawdown
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 sm:p-6 pt-0">
                <div className="text-lg sm:text-2xl font-bold text-red-500">
                  -{agent.result.max_drawdown.toFixed(2)}%
                </div>
              </CardContent>
            </Card>
          </div>

          {/* More Stats */}
          <div className="grid gap-3 sm:gap-4 grid-cols-3">
            <Card>
              <CardContent className="p-3 sm:p-6">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground flex-shrink-0" />
                  <span className="text-xs sm:text-sm text-muted-foreground truncate">Trades</span>
                </div>
                <div className="text-base sm:text-xl font-semibold mt-1">
                  {agent.result.total_trades}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 sm:p-6">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <Trophy className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground flex-shrink-0" />
                  <span className="text-xs sm:text-sm text-muted-foreground truncate">Win Rate</span>
                </div>
                <div className="text-base sm:text-xl font-semibold mt-1">
                  {agent.result.win_rate?.toFixed(1) || "N/A"}%
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 sm:p-6">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground flex-shrink-0" />
                  <span className="text-xs sm:text-sm text-muted-foreground truncate">Survival</span>
                </div>
                <div className="text-base sm:text-xl font-semibold mt-1">
                  {agent.result.survival_time}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid gap-3 sm:gap-4 grid-cols-1 lg:grid-cols-2">
            {round.price_data && round.price_data.length > 0 && (
              <Card>
                <CardHeader className="p-3 sm:p-6 pb-2">
                  <CardTitle className="text-sm sm:text-base">Market Price</CardTitle>
                </CardHeader>
                <CardContent className="p-3 sm:p-6 pt-0">
                  <TradingChart priceData={round.price_data} height={200} />
                </CardContent>
              </Card>
            )}
            {agent.result.equity_curve && agent.result.equity_curve.length > 0 && (
              <Card>
                <CardHeader className="p-3 sm:p-6 pb-2">
                  <CardTitle className="text-sm sm:text-base">Your Equity Curve</CardTitle>
                </CardHeader>
                <CardContent className="p-3 sm:p-6 pt-0">
                  <EquityCurve
                    equityData={agent.result.equity_curve}
                    initialEquity={round.config.market.initial_equity}
                    height={200}
                  />
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}

      {round.status === "COMPLETED" && !agent && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 sm:py-16 px-4">
            <p className="text-sm text-muted-foreground text-center">
              You didn&apos;t participate in this round.
            </p>
            <Link href={`/rounds/${roundId}/leaderboard`}>
              <Button variant="outline" className="mt-4">
                <Trophy className="h-4 w-4 mr-2" />
                View Leaderboard
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
