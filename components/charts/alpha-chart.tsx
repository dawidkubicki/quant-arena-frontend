"use client"

import { useEffect, useRef } from "react"
import { createChart, ColorType, LineStyle, LineSeries } from "lightweight-charts"

interface AlphaChartProps {
  cumulativeAlpha: number[]
  height?: number
  title?: string
}

export function AlphaChart({
  cumulativeAlpha,
  height = 300,
  title,
}: AlphaChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!chartContainerRef.current || cumulativeAlpha.length === 0) return

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

    // Cumulative alpha curve
    const alphaSeries = chart.addSeries(LineSeries, {
      color: "#10b981",
      lineWidth: 2,
      priceLineVisible: false,
      lastValueVisible: true,
    })

    // Convert to percentage
    const alphaChartData = cumulativeAlpha.map((alpha, index) => ({
      time: index as unknown as string,
      value: alpha * 100, // Convert to percentage
    }))

    alphaSeries.setData(alphaChartData)

    // Zero baseline
    const baselineSeries = chart.addSeries(LineSeries, {
      color: "#6b7280",
      lineWidth: 1,
      lineStyle: LineStyle.Dashed,
      priceLineVisible: false,
      lastValueVisible: false,
    })

    const baselineData = cumulativeAlpha.map((_, index) => ({
      time: index as unknown as string,
      value: 0,
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
  }, [cumulativeAlpha, height])

  return (
    <div className="space-y-2">
      {title && (
        <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
      )}
      <div ref={chartContainerRef} className="w-full" />
    </div>
  )
}
