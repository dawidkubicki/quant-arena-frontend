"use client"

import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import type { RiskParams } from "@/lib/types"

interface RiskParamsConfigProps {
  value: RiskParams
  onChange: (value: RiskParams) => void
}

export function RiskParamsConfig({ value, onChange }: RiskParamsConfigProps) {
  const update = (partial: Partial<RiskParams>) => {
    onChange({ ...value, ...partial })
  }

  return (
    <div className="space-y-3 sm:space-y-4">
      <div>
        <h3 className="text-base sm:text-lg font-semibold">Risk Management</h3>
        <p className="text-xs sm:text-sm text-muted-foreground">
          Configure position sizing and risk limits. Good risk management is key to survival.
        </p>
      </div>

      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2">
        {/* Position Size */}
        <div className="space-y-2 sm:space-y-3 p-3 sm:p-4 border rounded-lg">
          <div className="flex justify-between items-center">
            <Label className="font-medium text-sm">Position Size</Label>
            <span className="text-sm font-mono">{value.position_size_pct}%</span>
          </div>
          <Slider
            value={[value.position_size_pct]}
            onValueChange={([v]) => update({ position_size_pct: v })}
            min={1}
            max={50}
            step={1}
          />
          <p className="text-xs text-muted-foreground">% of equity per trade</p>
        </div>

        {/* Max Leverage */}
        <div className="space-y-2 sm:space-y-3 p-3 sm:p-4 border rounded-lg">
          <div className="flex justify-between items-center">
            <Label className="font-medium text-sm">Max Leverage</Label>
            <span className="text-sm font-mono">{value.max_leverage}x</span>
          </div>
          <Slider
            value={[value.max_leverage]}
            onValueChange={([v]) => update({ max_leverage: v })}
            min={1}
            max={5}
            step={0.5}
          />
          <p className="text-xs text-muted-foreground">Maximum leverage multiplier</p>
        </div>

        {/* Stop Loss */}
        <div className="space-y-2 sm:space-y-3 p-3 sm:p-4 border rounded-lg">
          <div className="flex justify-between items-center">
            <Label className="font-medium text-sm">Stop Loss</Label>
            <span className="text-sm font-mono">{value.stop_loss_pct}%</span>
          </div>
          <Slider
            value={[value.stop_loss_pct]}
            onValueChange={([v]) => update({ stop_loss_pct: v })}
            min={1}
            max={20}
            step={0.5}
          />
          <p className="text-xs text-muted-foreground">Close if loss exceeds</p>
        </div>

        {/* Take Profit */}
        <div className="space-y-2 sm:space-y-3 p-3 sm:p-4 border rounded-lg">
          <div className="flex justify-between items-center">
            <Label className="font-medium text-sm">Take Profit</Label>
            <span className="text-sm font-mono">{value.take_profit_pct}%</span>
          </div>
          <Slider
            value={[value.take_profit_pct]}
            onValueChange={([v]) => update({ take_profit_pct: v })}
            min={1}
            max={50}
            step={1}
          />
          <p className="text-xs text-muted-foreground">Close if profit reaches</p>
        </div>

        {/* Max Drawdown Kill */}
        <div className="space-y-2 sm:space-y-3 p-3 sm:p-4 border rounded-lg border-destructive/30 sm:col-span-2">
          <div className="flex justify-between items-center">
            <Label className="font-medium text-sm text-destructive">Max Drawdown Kill</Label>
            <span className="text-sm font-mono">{value.max_drawdown_kill}%</span>
          </div>
          <Slider
            value={[value.max_drawdown_kill]}
            onValueChange={([v]) => update({ max_drawdown_kill: v })}
            min={5}
            max={50}
            step={1}
          />
          <p className="text-xs text-muted-foreground">Stop trading if portfolio drops by this % from peak</p>
        </div>
      </div>
    </div>
  )
}
