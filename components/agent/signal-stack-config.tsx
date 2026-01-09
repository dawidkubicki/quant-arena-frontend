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
        <h3 className="text-base sm:text-lg font-semibold">Signal Stack</h3>
        <p className="text-xs sm:text-sm text-muted-foreground">
          Configure which indicators to use for generating trading signals.
        </p>
      </div>

      {/* SMA */}
      <div className="space-y-2 sm:space-y-3 p-3 sm:p-4 border rounded-lg">
        <div className="flex items-center gap-2">
          <Checkbox
            id="use_sma"
            checked={value.use_sma}
            onCheckedChange={(checked) => update({ use_sma: !!checked })}
          />
          <Label htmlFor="use_sma" className="font-medium text-sm">
            Simple Moving Average (SMA)
          </Label>
        </div>
        {value.use_sma && (
          <div className="space-y-2 pl-6">
            <div className="flex justify-between text-xs sm:text-sm">
              <span>Window</span>
              <span className="font-mono">{value.sma_window}</span>
            </div>
            <Slider
              value={[value.sma_window]}
              onValueChange={([v]) => update({ sma_window: v })}
              min={5}
              max={100}
              step={1}
            />
          </div>
        )}
      </div>

      {/* RSI */}
      <div className="space-y-2 sm:space-y-3 p-3 sm:p-4 border rounded-lg">
        <div className="flex items-center gap-2">
          <Checkbox
            id="use_rsi"
            checked={value.use_rsi}
            onCheckedChange={(checked) => update({ use_rsi: !!checked })}
          />
          <Label htmlFor="use_rsi" className="font-medium text-sm">
            Relative Strength Index (RSI)
          </Label>
        </div>
        {value.use_rsi && (
          <div className="space-y-3 sm:space-y-4 pl-6">
            <div className="space-y-2">
              <div className="flex justify-between text-xs sm:text-sm">
                <span>Window</span>
                <span className="font-mono">{value.rsi_window}</span>
              </div>
              <Slider
                value={[value.rsi_window]}
                onValueChange={([v]) => update({ rsi_window: v })}
                min={5}
                max={30}
                step={1}
              />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-xs sm:text-sm">
                <span>Overbought</span>
                <span className="font-mono">{value.rsi_overbought}</span>
              </div>
              <Slider
                value={[value.rsi_overbought]}
                onValueChange={([v]) => update({ rsi_overbought: v })}
                min={50}
                max={90}
                step={1}
              />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-xs sm:text-sm">
                <span>Oversold</span>
                <span className="font-mono">{value.rsi_oversold}</span>
              </div>
              <Slider
                value={[value.rsi_oversold]}
                onValueChange={([v]) => update({ rsi_oversold: v })}
                min={10}
                max={50}
                step={1}
              />
            </div>
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
        {value.use_volatility_filter && (
          <div className="space-y-3 sm:space-y-4 pl-6">
            <div className="space-y-2">
              <div className="flex justify-between text-xs sm:text-sm">
                <span>Window</span>
                <span className="font-mono">{value.volatility_window}</span>
              </div>
              <Slider
                value={[value.volatility_window]}
                onValueChange={([v]) => update({ volatility_window: v })}
                min={5}
                max={50}
                step={1}
              />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-xs sm:text-sm">
                <span>Threshold</span>
                <span className="font-mono">{(value.volatility_threshold * 100).toFixed(1)}%</span>
              </div>
              <Slider
                value={[value.volatility_threshold * 100]}
                onValueChange={([v]) => update({ volatility_threshold: v / 100 })}
                min={1}
                max={10}
                step={0.1}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
