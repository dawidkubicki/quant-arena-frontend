"use client"

import { useEffect, useRef } from "react"
import { createChart, ColorType, LineStyle, LineSeries } from "lightweight-charts"

interface TradingChartProps {
  priceData: number[]
  height?: number
  title?: string
}

export function TradingChart({ priceData, height = 300, title }: TradingChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!chartContainerRef.current || priceData.length === 0) return

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

    const lineSeries = chart.addSeries(LineSeries, {
      color: "#3b82f6",
      lineWidth: 2,
      priceLineVisible: false,
      lastValueVisible: true,
    })

    const data = priceData.map((price, index) => ({
      time: index as unknown as string,
      value: price,
    }))

    lineSeries.setData(data)
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
  }, [priceData, height])

  return (
    <div className="space-y-2">
      {title && (
        <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
      )}
      <div ref={chartContainerRef} className="w-full" />
    </div>
  )
}
