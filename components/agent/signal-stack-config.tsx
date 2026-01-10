"use client"

import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import type { SignalStack } from "@/lib/types"

interface SignalStackConfigProps {
  value: SignalStack
  onChange: (value: SignalStack) => void
}

export function SignalStackConfig({ value, onChange }: SignalStackConfigProps) {
  const update = (partial: Partial<SignalStack>) => {
    onChange({ ...value, ...partial })
  }

  return (
    <div className="space-y-3 sm:space-y-4">
      <div>
        <h3 className="text-base sm:text-lg font-semibold">Signal Filters</h3>
        <p className="text-xs sm:text-sm text-muted-foreground">
          Optional filters that apply to all strategies. These reduce signal confidence based on market conditions.
        </p>
      </div>

      {/* SMA Trend Filter */}
      <div className="space-y-2 sm:space-y-3 p-3 sm:p-4 border rounded-lg">
        <div className="flex items-center gap-2">
          <Checkbox
            id="use_sma_trend_filter"
            checked={value.use_sma_trend_filter}
            onCheckedChange={(checked) => update({ use_sma_trend_filter: !!checked })}
          />
          <Label htmlFor="use_sma_trend_filter" className="font-medium text-sm">
            SMA Trend Filter
          </Label>
        </div>
        <p className="text-xs text-muted-foreground pl-6">
          When enabled: only allows LONG signals when price is above SMA (uptrend), and SHORT signals when price is below SMA (downtrend).
        </p>
        {value.use_sma_trend_filter && (
          <div className="space-y-2 pl-6">
            <div className="flex justify-between text-xs sm:text-sm">
              <span>SMA Period</span>
              <span className="font-mono">{value.sma_filter_window}</span>
            </div>
            <Slider
              value={[value.sma_filter_window]}
              onValueChange={([v]) => update({ sma_filter_window: v })}
              min={10}
              max={200}
              step={1}
            />
            <p className="text-xs text-muted-foreground">
              Longer periods = stronger trend confirmation required
            </p>
          </div>
        )}
      </div>

      {/* Volatility Filter */}
      <div className="space-y-2 sm:space-y-3 p-3 sm:p-4 border rounded-lg">
        <div className="flex items-center gap-2">
          <Checkbox
            id="use_volatility"
            checked={value.use_volatility_filter}
            onCheckedChange={(checked) => update({ use_volatility_filter: !!checked })}
          />
          <Label htmlFor="use_volatility" className="font-medium text-sm">
            Volatility Filter
          </Label>
        </div>
        <p className="text-xs text-muted-foreground pl-6">
          When enabled: reduces signal confidence during high volatility periods.
        </p>
        {value.use_volatility_filter && (
          <div className="space-y-3 sm:space-y-4 pl-6">
            <div className="space-y-2">
              <div className="flex justify-between text-xs sm:text-sm">
                <span>Volatility Window</span>
                <span className="font-mono">{value.volatility_window}</span>
              </div>
              <Slider
                value={[value.volatility_window]}
                onValueChange={([v]) => update({ volatility_window: v })}
                min={5}
                max={100}
                step={1}
              />
              <p className="text-xs text-muted-foreground">
                Lookback period for volatility calculation
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-xs sm:text-sm">
                <span>Volatility Threshold</span>
                <span className="font-mono">{value.volatility_threshold.toFixed(1)}x</span>
              </div>
              <Slider
                value={[value.volatility_threshold]}
                onValueChange={([v]) => update({ volatility_threshold: v })}
                min={0.5}
                max={5}
                step={0.1}
              />
              <p className="text-xs text-muted-foreground">
                Higher threshold = more permissive (less filtering)
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
