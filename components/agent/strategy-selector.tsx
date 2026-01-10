"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { StrategyType } from "@/lib/types"
import { cn } from "@/lib/utils"
import { TrendingUp, TrendingDown, Zap } from "lucide-react"

interface StrategySelectorProps {
  value: StrategyType
  onChange: (value: StrategyType) => void
}

const strategies: {
  type: StrategyType
  name: string
  description: string
  beta: string
  icon: React.ComponentType<{ className?: string }>
}[] = [
  {
    type: "MEAN_REVERSION",
    name: "Mean Reversion",
    description: "Bets on price returning to average - buys dips, sells rallies. Best in range-bound, choppy markets.",
    beta: "Low (<1.0)",
    icon: TrendingDown,
  },
  {
    type: "TREND_FOLLOWING",
    name: "Trend Following",
    description: "Follows the trend using moving average crossovers. Best in markets with clear directional moves.",
    beta: "Medium (~1.0)",
    icon: TrendingUp,
  },
  {
    type: "MOMENTUM",
    name: "Momentum",
    description: "Buys strength, sells weakness based on price momentum and RSI. Best for overbought/oversold conditions.",
    beta: "High (>1.0)",
    icon: Zap,
  },
]

export function StrategySelector({ value, onChange }: StrategySelectorProps) {
  return (
    <div className="space-y-3">
      <h3 className="text-base sm:text-lg font-semibold">Core Strategy</h3>
      <p className="text-xs sm:text-sm text-muted-foreground">
        Select your trading strategy. Each has different strengths in different market conditions.
      </p>
      <div className="grid gap-2 sm:gap-3 grid-cols-1 sm:grid-cols-3">
        {strategies.map(({ type, name, description, beta, icon: Icon }) => (
          <Card
            key={type}
            className={cn(
              "cursor-pointer transition-all hover:border-primary/50 active:scale-[0.98]",
              value === type && "border-primary bg-primary/5"
            )}
            onClick={() => onChange(type)}
          >
            <CardHeader className="p-3 sm:p-4 pb-1 sm:pb-2">
              <div className="flex items-center gap-2">
                <Icon className={cn(
                  "h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0",
                  value === type ? "text-primary" : "text-muted-foreground"
                )} />
                <CardTitle className="text-sm sm:text-base">{name}</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 pt-0 space-y-1">
              <CardDescription className="text-xs line-clamp-2">
                {description}
              </CardDescription>
              <div className="text-xs text-muted-foreground">
                <span className="font-medium">Beta:</span> {beta}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
