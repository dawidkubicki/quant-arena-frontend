import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

export function formatPercent(value: number, decimals = 2): string {
  return `${value >= 0 ? '+' : ''}${value.toFixed(decimals)}%`
}

export function formatNumber(value: number | null, decimals = 2): string {
  if (value === null) return 'N/A'
  return value.toFixed(decimals)
}

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function getStrategyDisplayName(strategy: string): string {
  const names: Record<string, string> = {
    MEAN_REVERSION: 'Mean Reversion',
    TREND_FOLLOWING: 'Trend Following',
    MOMENTUM: 'Momentum',
    GHOST: 'Ghost (Benchmark)',
  }
  return names[strategy] || strategy
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    PENDING: 'bg-yellow-500',
    RUNNING: 'bg-blue-500',
    COMPLETED: 'bg-green-500',
  }
  return colors[status] || 'bg-gray-500'
}
