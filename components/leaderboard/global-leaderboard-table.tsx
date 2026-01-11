"use client"

import { useState } from "react"
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import type { GlobalLeaderboardEntry } from "@/lib/types"
import { formatPercent } from "@/lib/utils"
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
  Trophy,
  Medal,
  Award,
  Info,
  X,
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

interface GlobalLeaderboardTableProps {
  entries: GlobalLeaderboardEntry[]
  currentUserId?: string
}

function getRankIcon(rank: number) {
  if (rank === 1) return <Trophy className="h-5 w-5 text-yellow-500" />
  if (rank === 2) return <Medal className="h-5 w-5 text-gray-400" />
  if (rank === 3) return <Award className="h-5 w-5 text-amber-600" />
  return <span className="text-muted-foreground w-5 text-center">{rank}</span>
}

function ScoreInfoContent() {
  return (
    <div className="space-y-2">
      <p className="font-semibold text-sm">Performance Score Calculation (0-100)</p>
      <div className="space-y-1.5 text-xs">
        <div className="flex items-start gap-2">
          <span className="font-medium min-w-[60px]">40%</span>
          <div>
            <div className="font-medium">Sharpe Score</div>
            <div className="text-muted-foreground">min(100, avg_sharpe × 20)</div>
          </div>
        </div>
        <div className="flex items-start gap-2">
          <span className="font-medium min-w-[60px]">30%</span>
          <div>
            <div className="font-medium">Win Rate</div>
            <div className="text-muted-foreground">Top 3 finishes %</div>
          </div>
        </div>
        <div className="flex items-start gap-2">
          <span className="font-medium min-w-[60px]">20%</span>
          <div>
            <div className="font-medium">Alpha Score</div>
            <div className="text-muted-foreground">min(100, avg_alpha × 10)</div>
          </div>
        </div>
        <div className="flex items-start gap-2">
          <span className="font-medium min-w-[60px]">10%</span>
          <div>
            <div className="font-medium">Participation</div>
            <div className="text-muted-foreground">min(100, rounds × 10)</div>
          </div>
        </div>
      </div>
      <p className="text-xs text-muted-foreground pt-1 border-t">
        Balances consistency, competitive success, market-beating ability, and experience
      </p>
    </div>
  )
}

function ScoreInfoButton() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      {/* Desktop - Hover Tooltip */}
      <div className="hidden sm:inline-flex">
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            <button
              type="button"
              className="inline-flex items-center justify-center"
              aria-label="Show score calculation"
            >
              <Info className="h-3.5 w-3.5 text-muted-foreground hover:text-primary cursor-help" />
            </button>
          </TooltipTrigger>
          <TooltipContent 
            className="max-w-sm p-4 bg-popover text-popover-foreground border z-50"
            side="top"
            sideOffset={5}
          >
            <ScoreInfoContent />
          </TooltipContent>
        </Tooltip>
      </div>

      {/* Mobile - Click to Show */}
      <div className="sm:hidden">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="p-1 hover:bg-primary/20 rounded-full transition-colors touch-manipulation"
          aria-label="Show score calculation"
        >
          <Info className="h-4 w-4 text-primary" />
        </button>
        
        {isOpen && (
          <div 
            className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
            onClick={() => setIsOpen(false)}
          >
            <div 
              className="bg-popover text-popover-foreground border rounded-lg p-4 max-w-sm w-full shadow-lg"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between mb-3">
                <h3 className="font-semibold text-sm">How Score is Calculated</h3>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="p-0.5 hover:bg-muted rounded"
                  aria-label="Close"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <ScoreInfoContent />
            </div>
          </div>
        )}
      </div>
    </>
  )
}

function ScoreInfoButtonMobile() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="p-1 hover:bg-primary/20 rounded-full transition-colors touch-manipulation"
        aria-label="Show score calculation"
      >
        <Info className="h-4 w-4 text-primary" />
      </button>
      
      {isOpen && (
        <div 
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
          onClick={() => setIsOpen(false)}
        >
          <div 
            className="bg-popover text-popover-foreground border rounded-lg p-4 max-w-sm w-full shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-3">
              <h3 className="font-semibold text-sm">How Score is Calculated</h3>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-0.5 hover:bg-muted rounded"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <ScoreInfoContent />
          </div>
        </div>
      )}
    </>
  )
}

export function GlobalLeaderboardTable({ entries, currentUserId }: GlobalLeaderboardTableProps) {
  return (
    <TooltipProvider delayDuration={0} skipDelayDuration={0}>
      {/* Mobile View - Card Layout */}
      <div className="sm:hidden space-y-3">
        {entries.map((entry) => {
          const IconComponent = ICON_MAP[entry.icon] || User
          const isCurrentUser = entry.user_id === currentUserId

          return (
            <div
              key={entry.user_id}
              className={cn(
                "border rounded-lg p-4 space-y-4",
                isCurrentUser && "bg-primary/5 border-primary/30 ring-2 ring-primary/20"
              )}
            >
              {/* Header with Rank, Avatar, Name */}
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-muted">
                  {getRankIcon(entry.rank)}
                </div>
                <Avatar
                  className="h-10 w-10 ring-2 ring-background"
                  style={{ backgroundColor: entry.color }}
                >
                  <AvatarFallback
                    style={{ backgroundColor: entry.color }}
                  >
                    <IconComponent className="h-5 w-5 text-white" />
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-base flex items-center gap-2 flex-wrap">
                    <span className="truncate">{entry.nickname}</span>
                    {isCurrentUser && (
                      <Badge className="text-[10px] px-1.5 py-0.5">You</Badge>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {entry.total_rounds} round{entry.total_rounds !== 1 ? 's' : ''}
                  </div>
                </div>
              </div>

              {/* Performance Score - Prominent */}
              <div className="flex items-center justify-center gap-2 py-3 px-4 bg-primary/10 rounded-lg border border-primary/20">
                <div className="text-center flex-1">
                  <div className="text-2xl font-bold font-mono text-primary">
                    {entry.performance_score.toFixed(1)}
                  </div>
                  <div className="text-xs text-muted-foreground font-medium">
                    Performance Score
                  </div>
                </div>
                <ScoreInfoButtonMobile />
              </div>
              
              {/* Key Metrics Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="text-center p-2 rounded bg-muted/50">
                  <div className="text-xs text-muted-foreground mb-1">Avg Sharpe</div>
                  <div className="font-mono font-semibold text-sm">
                    {entry.avg_sharpe_ratio !== null && entry.avg_sharpe_ratio !== undefined && !isNaN(entry.avg_sharpe_ratio) ? entry.avg_sharpe_ratio.toFixed(2) : "N/A"}
                  </div>
                </div>
                <div className="text-center p-2 rounded bg-muted/50">
                  <div className="text-xs text-muted-foreground mb-1">Win Rate</div>
                  <div className="font-mono font-semibold text-sm">
                    {entry.win_rate.toFixed(0)}%
                  </div>
                </div>
                <div className="text-center p-2 rounded bg-muted/50">
                  <div className="text-xs text-muted-foreground mb-1">Avg Return</div>
                  <div className={cn(
                    "font-mono font-semibold text-sm",
                    entry.avg_total_return >= 0 ? "text-green-500" : "text-red-500"
                  )}>
                    {formatPercent(entry.avg_total_return)}
                  </div>
                </div>
                <div className="text-center p-2 rounded bg-muted/50">
                  <div className="text-xs text-muted-foreground mb-1">Avg Alpha</div>
                  <div className={cn(
                    "font-mono font-semibold text-sm",
                    entry.avg_alpha !== null && !isNaN(entry.avg_alpha) && entry.avg_alpha > 0 ? "text-green-500" : entry.avg_alpha !== null && !isNaN(entry.avg_alpha) && entry.avg_alpha < 0 ? "text-red-500" : ""
                  )}>
                    {entry.avg_alpha !== null && !isNaN(entry.avg_alpha) ? `${(entry.avg_alpha * 100).toFixed(1)}%` : "N/A"}
                  </div>
                </div>
              </div>

              {/* Achievement Badges */}
              <div className="flex items-center justify-around pt-2 border-t">
                <div className="text-center">
                  <div className="text-lg font-bold">🥇</div>
                  <div className="text-xs text-muted-foreground">{entry.first_place_count}</div>
                </div>
                <div className="h-8 w-px bg-border"></div>
                <div className="text-center">
                  <div className="text-lg font-bold">🏆</div>
                  <div className="text-xs text-muted-foreground">{entry.top_3_count} Top 3</div>
                </div>
                <div className="h-8 w-px bg-border"></div>
                <div className="text-center">
                  <div className="text-lg font-bold">🎯</div>
                  <div className="text-xs text-muted-foreground">{entry.top_10_count} Top 10</div>
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
              <TableHead className="text-right">Rounds</TableHead>
              <TableHead className="text-right">
                <div className="flex items-center justify-end gap-1">
                  Score
                  <ScoreInfoButton />
                </div>
              </TableHead>
              <TableHead className="text-right">Avg Sharpe</TableHead>
              <TableHead className="text-right">Avg Return</TableHead>
              <TableHead className="text-right">Avg Alpha</TableHead>
              <TableHead className="text-right">Win Rate</TableHead>
              <TableHead className="text-center">🥇</TableHead>
              <TableHead className="text-center">🏆 Top 3</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {entries.map((entry) => {
              const IconComponent = ICON_MAP[entry.icon] || User
              const isCurrentUser = entry.user_id === currentUserId

              return (
                <TableRow
                  key={entry.user_id}
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
                        style={{ backgroundColor: entry.color }}
                      >
                        <AvatarFallback
                          style={{ backgroundColor: entry.color }}
                        >
                          <IconComponent className="h-4 w-4 text-white" />
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium flex items-center gap-2">
                          {entry.nickname}
                          {isCurrentUser && (
                            <Badge className="text-xs">You</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {entry.total_rounds}
                  </TableCell>
                  <TableCell className="text-right font-mono font-bold text-primary">
                    {entry.performance_score.toFixed(1)}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {entry.avg_sharpe_ratio !== null && entry.avg_sharpe_ratio !== undefined && !isNaN(entry.avg_sharpe_ratio) ? entry.avg_sharpe_ratio.toFixed(2) : "N/A"}
                  </TableCell>
                  <TableCell
                    className={cn(
                      "text-right font-mono",
                      entry.avg_total_return >= 0 ? "text-green-500" : "text-red-500"
                    )}
                  >
                    {formatPercent(entry.avg_total_return)}
                  </TableCell>
                  <TableCell
                    className={cn(
                      "text-right font-mono",
                      entry.avg_alpha !== null && !isNaN(entry.avg_alpha) && entry.avg_alpha > 0 ? "text-green-500" : entry.avg_alpha !== null && !isNaN(entry.avg_alpha) && entry.avg_alpha < 0 ? "text-red-500" : ""
                    )}
                  >
                    {entry.avg_alpha !== null && !isNaN(entry.avg_alpha) ? `${(entry.avg_alpha * 100).toFixed(2)}%` : "N/A"}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {entry.win_rate.toFixed(1)}%
                  </TableCell>
                  <TableCell className="text-center font-mono">
                    {entry.first_place_count}
                  </TableCell>
                  <TableCell className="text-center font-mono">
                    {entry.top_3_count}
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
    </TooltipProvider>
  )
}
