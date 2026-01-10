"use client"

import type { Trade, CompletedTradesResponse, CompletedTrade, OpenPosition } from "@/lib/types"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { ArrowRight, TrendingUp, Clock } from "lucide-react"

// Props can accept either legacy Trade[] or new CompletedTradesResponse
interface TradeHistoryTableProps {
  trades?: Trade[]
  completedTradesResponse?: CompletedTradesResponse
}

// Internal unified format for display
interface DisplayTrade {
  tradeNumber: number
  entryTick: number
  entryTimestamp: string | null
  entryPrice: number
  entryReason: string
  exitTick: number | null
  exitTimestamp: string | null
  exitPrice: number | null
  exitReason: string | null
  size: number
  totalCost: number
  pnl: number
  returnPct: number | null
  durationTicks: number | null
  isOpen: boolean
  isWinner: boolean | null
}

function formatPrice(price: number) {
  return `$${price.toFixed(2)}`
}

// Convert CompletedTradesResponse to DisplayTrade[]
function fromCompletedTradesResponse(response: CompletedTradesResponse): DisplayTrade[] {
  const displayTrades: DisplayTrade[] = response.completed_trades.map((trade: CompletedTrade) => ({
    tradeNumber: trade.trade_number,
    entryTick: trade.entry_tick,
    entryTimestamp: trade.entry_timestamp,
    entryPrice: trade.entry_executed_price,
    entryReason: trade.entry_reason,
    exitTick: trade.exit_tick,
    exitTimestamp: trade.exit_timestamp,
    exitPrice: trade.exit_executed_price,
    exitReason: trade.exit_reason,
    size: trade.size,
    totalCost: trade.total_cost,
    pnl: trade.pnl,
    returnPct: trade.return_pct,
    durationTicks: trade.duration_ticks,
    isOpen: false,
    isWinner: trade.is_winner,
  }))

  // Add open position if exists
  if (response.has_open_position && response.open_position) {
    const op: OpenPosition = response.open_position
    displayTrades.push({
      tradeNumber: displayTrades.length + 1,
      entryTick: op.entry_tick,
      entryTimestamp: op.entry_timestamp,
      entryPrice: op.entry_executed_price,
      entryReason: op.entry_reason,
      exitTick: null,
      exitTimestamp: null,
      exitPrice: null,
      exitReason: null,
      size: op.size,
      totalCost: 0,
      pnl: op.current_pnl ?? 0,
      returnPct: null,
      durationTicks: null,
      isOpen: true,
      isWinner: null,
    })
  }

  return displayTrades
}

// Convert legacy Trade[] to DisplayTrade[] (long-only pairing)
function fromLegacyTrades(trades: Trade[]): DisplayTrade[] {
  const displayTrades: DisplayTrade[] = []
  const openPositions: Trade[] = []
  let tradeNumber = 1

  for (const trade of trades) {
    if (trade.action === "OPEN_LONG") {
      openPositions.push(trade)
    } else if (trade.action === "CLOSE_LONG") {
      // Find the matching LONG position (FIFO)
      const openTrade = openPositions.shift()
      if (openTrade) {
        const entryPrice = openTrade.executed_price
        const exitPrice = trade.executed_price
        const holdingPeriod = trade.tick - openTrade.tick
        const totalFees = openTrade.cost + trade.cost
        const returnPct = ((exitPrice - entryPrice) / entryPrice) * 100

        displayTrades.push({
          tradeNumber: tradeNumber++,
          entryTick: openTrade.tick,
          entryTimestamp: openTrade.timestamp ?? null,
          entryPrice,
          entryReason: openTrade.reason,
          exitTick: trade.tick,
          exitTimestamp: trade.timestamp ?? null,
          exitPrice,
          exitReason: trade.reason,
          size: trade.size,
          totalCost: totalFees,
          pnl: trade.pnl,
          returnPct,
          durationTicks: holdingPeriod,
          isOpen: false,
          isWinner: trade.pnl > 0,
        })
      }
    }
  }

  // Add any remaining open positions
  for (const openTrade of openPositions) {
    displayTrades.push({
      tradeNumber: tradeNumber++,
      entryTick: openTrade.tick,
      entryTimestamp: openTrade.timestamp ?? null,
      entryPrice: openTrade.executed_price,
      entryReason: openTrade.reason,
      exitTick: null,
      exitTimestamp: null,
      exitPrice: null,
      exitReason: null,
      size: openTrade.size,
      totalCost: openTrade.cost,
      pnl: 0,
      returnPct: null,
      durationTicks: null,
      isOpen: true,
      isWinner: null,
    })
  }

  return displayTrades
}

export function TradeHistoryTable({ trades, completedTradesResponse }: TradeHistoryTableProps) {
  // Convert data to unified DisplayTrade format
  let displayTrades: DisplayTrade[] = []
  let summaryStats: {
    totalPnL: number
    winningTrades: number
    losingTrades: number
    winRate: string
    avgHoldingPeriod: string
    completedCount: number
    bestTradePnL?: number
    worstTradePnL?: number
  }

  if (completedTradesResponse) {
    // Use the new pre-paired format from backend
    displayTrades = fromCompletedTradesResponse(completedTradesResponse)
    summaryStats = {
      totalPnL: completedTradesResponse.total_pnl,
      winningTrades: completedTradesResponse.winning_trades,
      losingTrades: completedTradesResponse.losing_trades,
      winRate: completedTradesResponse.win_rate.toFixed(1),
      avgHoldingPeriod: completedTradesResponse.avg_duration_ticks.toFixed(1),
      completedCount: completedTradesResponse.total_completed_trades,
      bestTradePnL: completedTradesResponse.best_trade_pnl,
      worstTradePnL: completedTradesResponse.worst_trade_pnl,
    }
  } else if (trades && trades.length > 0) {
    // Use legacy format and pair client-side
    displayTrades = fromLegacyTrades(trades)
    const completedTrades = displayTrades.filter((t) => !t.isOpen)
    summaryStats = {
      totalPnL: completedTrades.reduce((sum, t) => sum + t.pnl, 0),
      winningTrades: completedTrades.filter((t) => t.pnl > 0).length,
      losingTrades: completedTrades.filter((t) => t.pnl < 0).length,
      winRate: completedTrades.length > 0
        ? ((completedTrades.filter((t) => t.pnl > 0).length / completedTrades.length) * 100).toFixed(1)
        : "N/A",
      avgHoldingPeriod: completedTrades.length > 0
        ? (completedTrades.reduce((sum, t) => sum + (t.durationTicks || 0), 0) / completedTrades.length).toFixed(1)
        : "N/A",
      completedCount: completedTrades.length,
    }
  } else {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No trades executed during this simulation.
      </div>
    )
  }

  return (
    <TooltipProvider>
      <div className="space-y-4">
        {/* Summary Stats */}
        <div className="flex flex-wrap gap-4 p-4 bg-muted/50 rounded-lg">
          <div>
            <span className="text-xs text-muted-foreground">Round Trips</span>
            <p className="font-semibold">{summaryStats.completedCount}</p>
          </div>
          <div>
            <span className="text-xs text-muted-foreground">Total P&L</span>
            <p
              className={cn(
                "font-semibold",
                summaryStats.totalPnL >= 0 ? "text-green-500" : "text-red-500"
              )}
            >
              {summaryStats.totalPnL >= 0 ? "+" : ""}${summaryStats.totalPnL.toFixed(2)}
            </p>
          </div>
          <div>
            <span className="text-xs text-muted-foreground">Win Rate</span>
            <p className="font-semibold">{summaryStats.winRate}%</p>
          </div>
          <div>
            <span className="text-xs text-muted-foreground">Winning</span>
            <p className="font-semibold text-green-500">{summaryStats.winningTrades}</p>
          </div>
          <div>
            <span className="text-xs text-muted-foreground">Losing</span>
            <p className="font-semibold text-red-500">{summaryStats.losingTrades}</p>
          </div>
          <div>
            <span className="text-xs text-muted-foreground">Avg Holding</span>
            <p className="font-semibold">{summaryStats.avgHoldingPeriod} ticks</p>
          </div>
          {summaryStats.bestTradePnL !== undefined && (
            <div>
              <span className="text-xs text-muted-foreground">Best Trade</span>
              <p className="font-semibold text-green-500">
                +${summaryStats.bestTradePnL.toFixed(2)}
              </p>
            </div>
          )}
          {summaryStats.worstTradePnL !== undefined && (
            <div>
              <span className="text-xs text-muted-foreground">Worst Trade</span>
              <p className="font-semibold text-red-500">
                ${summaryStats.worstTradePnL.toFixed(2)}
              </p>
            </div>
          )}
        </div>

        {/* Trade Table */}
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">#</TableHead>
                <TableHead>Direction</TableHead>
                <TableHead className="text-center">Entry → Exit</TableHead>
                <TableHead className="text-right">Entry Price</TableHead>
                <TableHead className="text-right">Exit Price</TableHead>
                <TableHead className="text-right">Size</TableHead>
                <TableHead className="text-center">
                  <div className="flex items-center justify-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span>Duration</span>
                  </div>
                </TableHead>
                <TableHead className="text-right">Fees</TableHead>
                <TableHead className="text-right">P&L</TableHead>
                <TableHead className="text-right">Return</TableHead>
                <TableHead className="max-w-[150px]">Reasons</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayTrades.map((trade) => {
                const isWin = trade.isWinner === true
                const isLoss = trade.isWinner === false

                return (
                  <TableRow
                    key={trade.tradeNumber}
                    className={cn(trade.isOpen && "bg-yellow-500/5")}
                  >
                    <TableCell className="font-mono text-sm text-muted-foreground">
                      {trade.tradeNumber}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className="gap-1 bg-green-500/10 text-green-500 border-green-500/30"
                      >
                        <TrendingUp className="h-3 w-3" />
                        LONG
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-1 font-mono text-sm">
                        <span className="text-green-500">
                          {trade.entryTick}
                        </span>
                        <ArrowRight className="h-3 w-3 text-muted-foreground" />
                        {trade.isOpen ? (
                          <Badge
                            variant="outline"
                            className="bg-yellow-500/10 text-yellow-500 border-yellow-500/30 text-xs"
                          >
                            OPEN
                          </Badge>
                        ) : (
                          <span className="text-red-500">
                            {trade.exitTick}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {formatPrice(trade.entryPrice)}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {trade.exitPrice !== null ? formatPrice(trade.exitPrice) : "-"}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {trade.size.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-center font-mono text-sm">
                      {trade.durationTicks !== null ? (
                        <span className="text-muted-foreground">
                          {trade.durationTicks} ticks
                        </span>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell className="text-right font-mono text-muted-foreground text-sm">
                      ${trade.totalCost.toFixed(2)}
                    </TableCell>
                    <TableCell
                      className={cn(
                        "text-right font-mono font-semibold",
                        trade.isOpen
                          ? "text-muted-foreground"
                          : isWin
                          ? "text-green-500"
                          : isLoss
                          ? "text-red-500"
                          : ""
                      )}
                    >
                      {trade.isOpen
                        ? "-"
                        : `${trade.pnl >= 0 ? "+" : ""}$${trade.pnl.toFixed(2)}`}
                    </TableCell>
                    <TableCell
                      className={cn(
                        "text-right font-mono text-sm",
                        trade.isOpen
                          ? "text-muted-foreground"
                          : isWin
                          ? "text-green-500"
                          : isLoss
                          ? "text-red-500"
                          : ""
                      )}
                    >
                      {trade.returnPct !== null
                        ? `${trade.returnPct >= 0 ? "+" : ""}${trade.returnPct.toFixed(2)}%`
                        : "-"}
                    </TableCell>
                    <TableCell className="max-w-[150px]">
                      <div className="flex flex-col gap-1">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="text-xs text-muted-foreground truncate cursor-help">
                              <span className="text-green-500/70">↗</span>{" "}
                              {trade.entryReason.slice(0, 25)}
                              {trade.entryReason.length > 25 ? "..." : ""}
                            </div>
                          </TooltipTrigger>
                          <TooltipContent side="left" className="max-w-xs">
                            <p className="text-xs">
                              <strong>Entry:</strong> {trade.entryReason}
                            </p>
                          </TooltipContent>
                        </Tooltip>
                        {trade.exitReason && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="text-xs text-muted-foreground truncate cursor-help">
                                <span className="text-red-500/70">↘</span>{" "}
                                {trade.exitReason.slice(0, 25)}
                                {trade.exitReason.length > 25 ? "..." : ""}
                              </div>
                            </TooltipTrigger>
                            <TooltipContent side="left" className="max-w-xs">
                              <p className="text-xs">
                                <strong>Exit:</strong> {trade.exitReason}
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      </div>
    </TooltipProvider>
  )
}
