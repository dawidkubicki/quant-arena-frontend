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
  icon: React.ComponentType<{ className?: string }>
}[] = [
  {
    type: "MEAN_REVERSION",
    name: "Mean Reversion",
    description: "Bet on prices returning to their average. Best in range-bound markets.",
    icon: TrendingDown,
  },
  {
    type: "TREND_FOLLOWING",
    name: "Trend Following",
    description: "Follow market trends using moving average crossovers. Best in trending markets.",
    icon: TrendingUp,
  },
  {
    type: "MOMENTUM",
    name: "Momentum",
    description: "Buy strength, sell weakness based on price momentum and RSI.",
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
        {strategies.map(({ type, name, description, icon: Icon }) => (
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
            <CardContent className="p-3 sm:p-4 pt-0">
              <CardDescription className="text-xs line-clamp-2">
                {description}
              </CardDescription>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
