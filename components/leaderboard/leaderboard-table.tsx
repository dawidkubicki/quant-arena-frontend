"use client"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import type { LeaderboardEntry } from "@/lib/types"
import { formatCurrency, formatPercent, getStrategyDisplayName } from "@/lib/utils"
import { cn } from "@/lib/utils"
import {
  User,
  Zap,
  Target,
  Rocket,
  Brain,
  Flame,
  LineChart,
  TrendingUp,
  Ghost,
  Trophy,
  Medal,
  Award,
} from "lucide-react"

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  user: User,
  "chart-line": LineChart,
  "trending-up": TrendingUp,
  zap: Zap,
  target: Target,
  rocket: Rocket,
  brain: Brain,
  flame: Flame,
}

interface LeaderboardTableProps {
  entries: LeaderboardEntry[]
  currentUserId?: string
}

function getRankIcon(rank: number) {
  if (rank === 1) return <Trophy className="h-5 w-5 text-yellow-500" />
  if (rank === 2) return <Medal className="h-5 w-5 text-gray-400" />
  if (rank === 3) return <Award className="h-5 w-5 text-amber-600" />
  return <span className="text-muted-foreground w-5 text-center">{rank}</span>
}

export function LeaderboardTable({ entries, currentUserId }: LeaderboardTableProps) {
  return (
    <>
      {/* Mobile View - Card Layout */}
      <div className="sm:hidden space-y-3">
        {entries.map((entry) => {
          const IconComponent = entry.is_ghost
            ? Ghost
            : ICON_MAP[entry.icon] || User
          const isCurrentUser = entry.user_id === currentUserId

          return (
            <div
              key={entry.agent_id}
              className={cn(
                "border rounded-lg p-3 space-y-3",
                isCurrentUser && "bg-primary/5 border-primary/30"
              )}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex items-center justify-center w-8">
                    {getRankIcon(entry.rank)}
                  </div>
                  <Avatar
                    className="h-8 w-8"
                    style={{ backgroundColor: entry.is_ghost ? "#6b7280" : entry.color }}
                  >
                    <AvatarFallback
                      style={{ backgroundColor: entry.is_ghost ? "#6b7280" : entry.color }}
                    >
                      <IconComponent className="h-4 w-4 text-white" />
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium text-sm flex items-center gap-1.5 flex-wrap">
                      {entry.nickname}
                      {entry.is_ghost && (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                          Bench
                        </Badge>
                      )}
                      {isCurrentUser && (
                        <Badge className="text-[10px] px-1.5 py-0">You</Badge>
                      )}
                    </div>
                    <Badge variant="secondary" className="text-[10px] mt-0.5">
                      {getStrategyDisplayName(entry.strategy_type)}
                    </Badge>
                  </div>
                </div>
                <div className="text-right">
                  <div className={cn(
                    "text-lg font-bold font-mono",
                    entry.total_return >= 0 ? "text-green-500" : "text-red-500"
                  )}>
                    {formatPercent(entry.total_return)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {formatCurrency(entry.final_equity)}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div>
                  <div className="text-muted-foreground">Sharpe</div>
                  <div className="font-mono font-medium">
                    {entry.sharpe_ratio !== null && entry.sharpe_ratio !== undefined && !isNaN(entry.sharpe_ratio) ? entry.sharpe_ratio.toFixed(2) : "N/A"}
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground">Alpha</div>
                  <div className={cn(
                    "font-mono font-medium",
                    entry.alpha !== null && !isNaN(entry.alpha) && entry.alpha > 0 ? "text-green-500" : entry.alpha !== null && !isNaN(entry.alpha) && entry.alpha < 0 ? "text-red-500" : ""
                  )}>
                    {entry.alpha !== null && !isNaN(entry.alpha) ? `${(entry.alpha * 100).toFixed(2)}%` : "N/A"}
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground">Beta</div>
                  <div className="font-mono font-medium">
                    {entry.beta !== null && entry.beta !== undefined && !isNaN(entry.beta) ? entry.beta.toFixed(2) : "N/A"}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center text-xs mt-2">
                <div>
                  <div className="text-muted-foreground">Max DD</div>
                  <div className="font-mono font-medium text-red-500">-{entry.max_drawdown.toFixed(1)}%</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Win Rate</div>
                  <div className="font-mono font-medium">{entry.win_rate?.toFixed(0) || "N/A"}%</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Trades</div>
                  <div className="font-mono font-medium">{entry.total_trades}</div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Desktop View - Table */}
      <div className="hidden sm:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">Rank</TableHead>
              <TableHead>Trader</TableHead>
              <TableHead>Strategy</TableHead>
              <TableHead className="text-right">Final Equity</TableHead>
              <TableHead className="text-right">Return</TableHead>
              <TableHead className="text-right">Sharpe</TableHead>
              <TableHead className="text-right">Alpha</TableHead>
              <TableHead className="text-right">Beta</TableHead>
              <TableHead className="text-right">Max DD</TableHead>
              <TableHead className="text-right">Win Rate</TableHead>
              <TableHead className="text-right">Trades</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {entries.map((entry) => {
              const IconComponent = entry.is_ghost
                ? Ghost
                : ICON_MAP[entry.icon] || User
              const isCurrentUser = entry.user_id === currentUserId

              return (
                <TableRow
                  key={entry.agent_id}
                  className={cn(isCurrentUser && "bg-primary/5 border-primary/20")}
                >
                  <TableCell className="font-medium">
                    <div className="flex items-center justify-center">
                      {getRankIcon(entry.rank)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar
                        className="h-8 w-8"
                        style={{ backgroundColor: entry.is_ghost ? "#6b7280" : entry.color }}
                      >
                        <AvatarFallback
                          style={{ backgroundColor: entry.is_ghost ? "#6b7280" : entry.color }}
                        >
                          <IconComponent className="h-4 w-4 text-white" />
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium flex items-center gap-2">
                          {entry.nickname}
                          {entry.is_ghost && (
                            <Badge variant="outline" className="text-xs">
                              Benchmark
                            </Badge>
                          )}
                          {isCurrentUser && (
                            <Badge className="text-xs">You</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {getStrategyDisplayName(entry.strategy_type)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatCurrency(entry.final_equity)}
                  </TableCell>
                  <TableCell
                    className={cn(
                      "text-right font-mono",
                      entry.total_return >= 0 ? "text-green-500" : "text-red-500"
                    )}
                  >
                    {formatPercent(entry.total_return)}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {entry.sharpe_ratio !== null && entry.sharpe_ratio !== undefined && !isNaN(entry.sharpe_ratio) ? entry.sharpe_ratio.toFixed(2) : "N/A"}
                  </TableCell>
                  <TableCell
                    className={cn(
                      "text-right font-mono",
                      entry.alpha !== null && !isNaN(entry.alpha) && entry.alpha > 0 ? "text-green-500" : entry.alpha !== null && !isNaN(entry.alpha) && entry.alpha < 0 ? "text-red-500" : ""
                    )}
                  >
                    {entry.alpha !== null && !isNaN(entry.alpha) ? `${(entry.alpha * 100).toFixed(2)}%` : "N/A"}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {entry.beta !== null && entry.beta !== undefined && !isNaN(entry.beta) ? entry.beta.toFixed(2) : "N/A"}
                  </TableCell>
                  <TableCell className="text-right font-mono text-red-500">
                    -{entry.max_drawdown.toFixed(2)}%
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {entry.win_rate?.toFixed(1) || "N/A"}%
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {entry.total_trades}
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
    </>
  )
}
