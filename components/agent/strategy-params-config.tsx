"use client"

import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import type { StrategyType, StrategyParams } from "@/lib/types"

interface StrategyParamsConfigProps {
  strategyType: StrategyType
  value: StrategyParams
  onChange: (value: StrategyParams) => void
}

export function StrategyParamsConfig({
  strategyType,
  value,
  onChange,
}: StrategyParamsConfigProps) {
  const update = (partial: Partial<StrategyParams>) => {
    onChange({ ...value, ...partial })
  }

  return (
    <div className="space-y-3 sm:space-y-4">
      <div>
        <h3 className="text-base sm:text-lg font-semibold">Strategy Parameters</h3>
        <p className="text-xs sm:text-sm text-muted-foreground">
          Fine-tune your strategy&apos;s specific parameters.
        </p>
      </div>

      {strategyType === "MEAN_REVERSION" && (
        <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-3">
          <div className="space-y-2 sm:space-y-3 p-3 sm:p-4 border rounded-lg">
            <div className="flex justify-between items-center">
              <Label className="font-medium text-sm">Lookback Window</Label>
              <span className="text-sm font-mono">{value.lookback_window}</span>
            </div>
            <Slider
              value={[value.lookback_window || 20]}
              onValueChange={([v]) => update({ lookback_window: v })}
              min={5}
              max={100}
              step={1}
            />
            <p className="text-xs text-muted-foreground">Periods to calculate mean</p>
          </div>
          <div className="space-y-2 sm:space-y-3 p-3 sm:p-4 border rounded-lg">
            <div className="flex justify-between items-center">
              <Label className="font-medium text-sm">Entry Threshold</Label>
              <span className="text-sm font-mono">{value.entry_threshold}</span>
            </div>
            <Slider
              value={[value.entry_threshold || 2]}
              onValueChange={([v]) => update({ entry_threshold: v })}
              min={0.5}
              max={4}
              step={0.1}
            />
            <p className="text-xs text-muted-foreground">Z-score to enter</p>
          </div>
          <div className="space-y-2 sm:space-y-3 p-3 sm:p-4 border rounded-lg">
            <div className="flex justify-between items-center">
              <Label className="font-medium text-sm">Exit Threshold</Label>
              <span className="text-sm font-mono">{value.exit_threshold}</span>
            </div>
            <Slider
              value={[value.exit_threshold || 0.5]}
              onValueChange={([v]) => update({ exit_threshold: v })}
              min={0}
              max={2}
              step={0.1}
            />
            <p className="text-xs text-muted-foreground">Z-score to exit</p>
          </div>
        </div>
      )}

      {strategyType === "TREND_FOLLOWING" && (
        <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-3">
          <div className="space-y-2 sm:space-y-3 p-3 sm:p-4 border rounded-lg">
            <div className="flex justify-between items-center">
              <Label className="font-medium text-sm">Fast MA</Label>
              <span className="text-sm font-mono">{value.fast_window}</span>
            </div>
            <Slider
              value={[value.fast_window || 10]}
              onValueChange={([v]) => update({ fast_window: v })}
              min={3}
              max={50}
              step={1}
            />
            <p className="text-xs text-muted-foreground">Short-term MA window</p>
          </div>
          <div className="space-y-2 sm:space-y-3 p-3 sm:p-4 border rounded-lg">
            <div className="flex justify-between items-center">
              <Label className="font-medium text-sm">Slow MA</Label>
              <span className="text-sm font-mono">{value.slow_window}</span>
            </div>
            <Slider
              value={[value.slow_window || 30]}
              onValueChange={([v]) => update({ slow_window: v })}
              min={10}
              max={200}
              step={1}
            />
            <p className="text-xs text-muted-foreground">Long-term MA window</p>
          </div>
          <div className="space-y-2 sm:space-y-3 p-3 sm:p-4 border rounded-lg">
            <div className="flex justify-between items-center">
              <Label className="font-medium text-sm">ATR Multiplier</Label>
              <span className="text-sm font-mono">{value.atr_multiplier}</span>
            </div>
            <Slider
              value={[value.atr_multiplier || 2]}
              onValueChange={([v]) => update({ atr_multiplier: v })}
              min={0.5}
              max={5}
              step={0.1}
            />
            <p className="text-xs text-muted-foreground">Stop distance</p>
          </div>
        </div>
      )}

      {strategyType === "MOMENTUM" && (
        <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2">
          <div className="space-y-2 sm:space-y-3 p-3 sm:p-4 border rounded-lg">
            <div className="flex justify-between items-center">
              <Label className="font-medium text-sm">Momentum Window</Label>
              <span className="text-sm font-mono">{value.momentum_window}</span>
            </div>
            <Slider
              value={[value.momentum_window || 14]}
              onValueChange={([v]) => update({ momentum_window: v })}
              min={5}
              max={50}
              step={1}
            />
            <p className="text-xs text-muted-foreground">Periods for momentum</p>
          </div>
          <div className="space-y-2 sm:space-y-3 p-3 sm:p-4 border rounded-lg">
            <div className="flex justify-between items-center">
              <Label className="font-medium text-sm">RSI Window</Label>
              <span className="text-sm font-mono">{value.rsi_window}</span>
            </div>
            <Slider
              value={[value.rsi_window || 14]}
              onValueChange={([v]) => update({ rsi_window: v })}
              min={5}
              max={30}
              step={1}
            />
            <p className="text-xs text-muted-foreground">Periods for RSI</p>
          </div>
          <div className="space-y-2 sm:space-y-3 p-3 sm:p-4 border rounded-lg">
            <div className="flex justify-between items-center">
              <Label className="font-medium text-sm">RSI Overbought</Label>
              <span className="text-sm font-mono">{value.rsi_overbought}</span>
            </div>
            <Slider
              value={[value.rsi_overbought || 70]}
              onValueChange={([v]) => update({ rsi_overbought: v })}
              min={50}
              max={90}
              step={1}
            />
            <p className="text-xs text-muted-foreground">Overbought level</p>
          </div>
          <div className="space-y-2 sm:space-y-3 p-3 sm:p-4 border rounded-lg">
            <div className="flex justify-between items-center">
              <Label className="font-medium text-sm">RSI Oversold</Label>
              <span className="text-sm font-mono">{value.rsi_oversold}</span>
            </div>
            <Slider
              value={[value.rsi_oversold || 30]}
              onValueChange={([v]) => update({ rsi_oversold: v })}
              min={10}
              max={50}
              step={1}
            />
            <p className="text-xs text-muted-foreground">Oversold level</p>
          </div>
        </div>
      )}
    </div>
  )
}
