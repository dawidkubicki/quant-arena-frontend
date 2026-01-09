"use client"

import { useEffect, useRef } from "react"
import { createChart, ColorType, LineStyle, LineSeries } from "lightweight-charts"

interface EquityCurveProps {
  equityData: number[]
  initialEquity?: number
  height?: number
  title?: string
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
        timeVisible: false,
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

    const equityChartData = equityData.map((equity, index) => ({
      time: index as unknown as string,
      value: equity,
    }))

    equitySeries.setData(equityChartData)

    // Initial equity baseline
    const baselineSeries = chart.addSeries(LineSeries, {
      color: "#6b7280",
      lineWidth: 1,
      lineStyle: LineStyle.Dashed,
      priceLineVisible: false,
      lastValueVisible: false,
    })

    const baselineData = equityData.map((_, index) => ({
      time: index as unknown as string,
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
