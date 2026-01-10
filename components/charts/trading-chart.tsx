"use client"

import { useEffect, useRef } from "react"
import {
  createChart,
  ColorType,
  LineStyle,
  LineSeries,
  createSeriesMarkers,
  SeriesMarkerShape,
  SeriesMarkerPosition,
} from "lightweight-charts"
import type { Trade, ChartDataPoint } from "@/lib/types"

interface TradingChartProps {
  priceData: ChartDataPoint[] | number[] // Support both new and legacy formats
  trades?: Trade[]
  height?: number
  title?: string
}

// Helper to check if data is in ChartDataPoint format
function isChartDataPointArray(data: unknown[]): data is ChartDataPoint[] {
  if (data.length === 0) return false
  const first = data[0]
  return typeof first === 'object' && first !== null && 'value' in first
}

// Check if a timestamp is valid
function isValidTimestamp(timestamp: string | null | undefined): boolean {
  if (!timestamp) return false
  const date = new Date(timestamp)
  return !isNaN(date.getTime())
}

// Check if all data points have valid timestamps
function hasAllValidTimestamps(data: ChartDataPoint[]): boolean {
  return data.every(point => isValidTimestamp(point.timestamp))
}

// Helper to normalize data to chart format
function normalizeChartData(data: ChartDataPoint[] | number[]): { time: number; value: number; useTimestamps: boolean }[] {
  if (data.length === 0) return []
  
  if (isChartDataPointArray(data)) {
    // Check if ALL points have valid timestamps to ensure consistency
    const useTimestamps = hasAllValidTimestamps(data)
    
    if (useTimestamps) {
      // Use timestamps (converted to Unix seconds) for all points
      return data.map((point) => ({
        time: Math.floor(new Date(point.timestamp!).getTime() / 1000),
        value: point.value,
        useTimestamps: true,
      }))
    } else {
      // Fall back to tick-based time for ALL points (synthetic data or mixed)
      return data.map((point, index) => ({
        time: point.tick ?? index,
        value: point.value,
        useTimestamps: false,
      }))
    }
  } else {
    // Legacy format: use index as time, number as value
    return (data as number[]).map((value, index) => ({
      time: index,
      value,
      useTimestamps: false,
    }))
  }
}

export function TradingChart({
  priceData,
  trades,
  height = 300,
  title,
}: TradingChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!chartContainerRef.current || priceData.length === 0) return

    // Normalize data to chart format
    const chartData = normalizeChartData(priceData)
    if (chartData.length === 0) return

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: "#9ca3af",
      },
      grid: {
        vertLines: { color: "#27272a" },
        horzLines: { color: "#27272a" },
      },
      width: chartContainerRef.current.clientWidth,
      height,
      rightPriceScale: {
        borderColor: "#27272a",
      },
      timeScale: {
        borderColor: "#27272a",
        timeVisible: true,
        secondsVisible: false,
      },
      crosshair: {
        vertLine: {
          color: "#6b7280",
          width: 1,
          style: LineStyle.Dashed,
        },
        horzLine: {
          color: "#6b7280",
          width: 1,
          style: LineStyle.Dashed,
        },
      },
    })

    const lineSeries = chart.addSeries(LineSeries, {
      color: "#3b82f6",
      lineWidth: 2,
      priceLineVisible: false,
      lastValueVisible: true,
    })

    lineSeries.setData(chartData)

    // Add trade markers if trades are provided
    if (trades && trades.length > 0) {
      // Determine if chart is using timestamps or ticks
      const useTimestamps = chartData.length > 0 && chartData[0].useTimestamps
      
      const markers = trades.map((trade) => {
        // Determine if this is a buy or sell action
        const isBuy = trade.action === "OPEN_LONG" || trade.action === "CLOSE_SHORT"
        const isOpen = trade.action.includes("OPEN")

        // Use different shapes for open vs close positions
        let shape: SeriesMarkerShape = "arrowUp"
        let position: SeriesMarkerPosition = "belowBar"
        let color = "#22c55e" // green for buy

        if (isBuy) {
          shape = "arrowUp"
          position = "belowBar"
          color = "#22c55e" // green
        } else {
          shape = "arrowDown"
          position = "aboveBar"
          color = "#ef4444" // red
        }

        // Build marker text: action label + optional PnL
        let text = isBuy ? "BUY" : "SELL"
        if (!isOpen && trade.pnl !== 0) {
          const pnlStr = trade.pnl >= 0 ? `+$${trade.pnl.toFixed(0)}` : `-$${Math.abs(trade.pnl).toFixed(0)}`
          text = `${text} ${pnlStr}`
        }

        // Use same time format as chart data (timestamps or ticks)
        let tradeTime: number
        if (useTimestamps && isValidTimestamp(trade.timestamp)) {
          tradeTime = Math.floor(new Date(trade.timestamp!).getTime() / 1000)
        } else {
          tradeTime = trade.tick
        }

        return {
          time: tradeTime as unknown as string,
          position,
          color,
          shape,
          text,
          size: 1.5,
        }
      })

      createSeriesMarkers(lineSeries, markers)
    }

    chart.timeScale().fitContent()

    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({ width: chartContainerRef.current.clientWidth })
      }
    }

    window.addEventListener("resize", handleResize)

    return () => {
      window.removeEventListener("resize", handleResize)
      chart.remove()
    }
  }, [priceData, trades, height])

  return (
    <div className="space-y-2">
      {title && (
        <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
      )}
      <div ref={chartContainerRef} className="w-full" />
    </div>
  )
}
