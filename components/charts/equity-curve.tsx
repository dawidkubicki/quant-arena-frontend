"use client"

import { useEffect, useRef } from "react"
import { createChart, ColorType, LineStyle, LineSeries, Time } from "lightweight-charts"
import type { ChartDataPoint } from "@/lib/types"

interface EquityCurveProps {
  equityData: ChartDataPoint[] | number[] // Support both new and legacy formats
  initialEquity?: number
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

// Helper to normalize data to chart format
function normalizeChartData(data: ChartDataPoint[] | number[]): { time: Time; value: number }[] {
  if (data.length === 0) return []
  
  if (isChartDataPointArray(data)) {
    // Check if ALL points have valid timestamps to ensure consistency
    const hasAllTimestamps = data.every(point => isValidTimestamp(point.timestamp))
    
    if (hasAllTimestamps) {
      // Use timestamps (converted to Unix seconds) for all points
      return data.map((point) => ({
        time: Math.floor(new Date(point.timestamp!).getTime() / 1000) as Time,
        value: point.value,
      }))
    } else {
      // Fall back to tick-based time for ALL points (synthetic data or mixed)
      return data.map((point, index) => ({
        time: (point.tick ?? index) as Time,
        value: point.value,
      }))
    }
  } else {
    // Legacy format: use index as time, number as value
    return (data as number[]).map((value, index) => ({
      time: index as Time,
      value,
    }))
  }
}

export function EquityCurve({
  equityData,
  initialEquity = 100000,
  height = 300,
  title,
}: EquityCurveProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!chartContainerRef.current || equityData.length === 0) return

    // Normalize data to chart format
    const chartData = normalizeChartData(equityData)
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

    // Equity curve
    const equitySeries = chart.addSeries(LineSeries, {
      color: "#10b981",
      lineWidth: 2,
      priceLineVisible: false,
      lastValueVisible: true,
    })

    equitySeries.setData(chartData)

    // Initial equity baseline
    const baselineSeries = chart.addSeries(LineSeries, {
      color: "#6b7280",
      lineWidth: 1,
      lineStyle: LineStyle.Dashed,
      priceLineVisible: false,
      lastValueVisible: false,
    })

    const baselineData = chartData.map((point) => ({
      time: point.time,
      value: initialEquity,
    }))

    baselineSeries.setData(baselineData)

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
  }, [equityData, initialEquity, height])

  return (
    <div className="space-y-2">
      {title && (
        <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
      )}
      <div ref={chartContainerRef} className="w-full" />
    </div>
  )
}
