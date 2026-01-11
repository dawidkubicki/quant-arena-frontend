// Chart data point with x and y axes
export interface ChartDataPoint {
  tick: number              // Sequential tick number (0-indexed)
  timestamp: string | null  // ISO 8601 timestamp (null for synthetic data)
  value: number             // The actual data value
}

// User types
export interface User {
  id: string
  supabase_id: string
  email: string | null
  nickname: string
  color: string
  icon: string
  is_admin: boolean
  created_at: string
}

// Market Data types
export interface MarketDataStatus {
  is_ready: boolean
  has_aapl: boolean
  has_spy: boolean
  aapl_bars: number
  spy_bars: number
  aapl_date_range: {
    start: string
    end: string
  } | null
  spy_date_range: {
    start: string
    end: string
  } | null
  message: string
  api_configured: boolean
}

export interface MarketDataset {
  id: string
  symbol: string
  interval: string
  start_date: string
  end_date: string
  total_bars: number
  fetched_at: string
}

export interface MarketDataFetchRequest {
  symbols: string[]
  months?: number
}

export interface MarketDataFetchResponse {
  status: string
  message: string
  datasets: MarketDataset[]
}

export interface MarketDataStats {
  symbol: string
  total_bars: number
  earliest_date: string
  latest_date: string
  datasets_count: number
}

export interface MarketApiStatus {
  status: string
  daily_usage: number
  daily_limit: number
  credits_remaining: number
}

export interface MarketDataDeleteResponse {
  message: string
  datasets_deleted: number
}

export interface UserPublic {
  id: string
  nickname: string
  color: string
  icon: string
}

export interface UserUpdate {
  nickname?: string
  color?: string
  icon?: string
}

// Round types
export type RoundStatus = 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED'

export interface MarketConfig {
  // Real data configuration
  trading_interval?: string // "1min", "5min", "15min", "30min", "1h"
  // Core settings
  num_ticks: number | null // null = use all available data
  initial_equity: number
  base_slippage: number
  fee_rate: number
  // Synthetic data fallback settings
  initial_price?: number
  base_volatility?: number
  base_drift?: number
  trend_probability?: number
  volatile_probability?: number
  regime_persistence?: number
}

export interface RoundConfig {
  market: MarketConfig
}

export interface Round {
  id: string
  name: string
  status: RoundStatus
  market_seed: number
  config: RoundConfig
  // Chart data with x-axis and y-axis
  price_data: ChartDataPoint[] | null
  spy_returns: ChartDataPoint[] | null // SPY log returns for alpha/beta calculations
  // Legacy (deprecated) - for backward compatibility
  price_data_values?: number[]
  spy_returns_values?: number[]
  started_at: string | null
  completed_at: string | null
  created_at: string
  agent_count: number
}

export interface RoundList {
  id: string
  name: string
  status: RoundStatus
  market_seed: number
  agent_count: number
  created_at: string
}

export interface RoundStatusResponse {
  id: string
  status: RoundStatus
  progress: number           // 0-100 percentage of simulation ticks completed
  agents_processed: number   // Number of agents with saved results
  total_agents: number       // Total agents in the round
  error_message: string | null // Error details if status is FAILED
  started_at: string | null
  completed_at: string | null
}

export interface RoundCreate {
  name: string
  market_seed?: number
  config?: Partial<RoundConfig>
}

// Strategy types
export type StrategyType = 'MEAN_REVERSION' | 'TREND_FOLLOWING' | 'MOMENTUM' | 'GHOST'

export interface StrategyParams {
  // Mean Reversion
  lookback_window?: number
  entry_threshold?: number
  exit_threshold?: number
  // Trend Following
  fast_window?: number
  slow_window?: number
  atr_multiplier?: number
  // Momentum
  momentum_window?: number
  rsi_window?: number
  rsi_overbought?: number
  rsi_oversold?: number
}

export interface SignalStack {
  // SMA Trend Filter - only allows trades in direction of trend
  use_sma_trend_filter: boolean
  sma_filter_window: number
  // Volatility Filter - reduces signal confidence during high volatility
  use_volatility_filter: boolean
  volatility_window: number
  volatility_threshold: number
}

export interface RiskParams {
  position_size_pct: number
  max_leverage: number
  stop_loss_pct: number
  take_profit_pct: number
  max_drawdown_kill: number
}

export interface AgentConfig {
  strategy_params: StrategyParams
  signal_stack: SignalStack
  risk_params: RiskParams
}

// Trade types - Long-only (no short selling)
export type TradeAction = 'OPEN_LONG' | 'CLOSE_LONG'

export interface Trade {
  tick: number              // X-axis: tick number
  timestamp?: string | null // X-axis: market timestamp
  action: TradeAction
  price: number             // Y-axis: market price
  executed_price: number    // Y-axis: execution price
  size: number
  cost: number
  pnl: number
  equity_after: number
  reason: string
}

// Completed trade with paired entry/exit (from /trades/agent/{agent_id}/completed)
export interface CompletedTrade {
  trade_number: number
  // Entry details
  entry_tick: number
  entry_timestamp: string | null
  entry_price: number
  entry_executed_price: number
  entry_reason: string
  // Exit details
  exit_tick: number
  exit_timestamp: string | null
  exit_price: number
  exit_executed_price: number
  exit_reason: string
  // Trade metrics
  size: number
  total_cost: number
  pnl: number
  return_pct: number
  duration_ticks: number
  is_winner: boolean
}

// Open position (if any)
export interface OpenPosition {
  entry_tick: number
  entry_timestamp: string | null
  entry_price: number
  entry_executed_price: number
  entry_reason: string
  size: number
  current_pnl: number | null
}

// Response from GET /trades/agent/{agent_id}/completed
export interface CompletedTradesResponse {
  completed_trades: CompletedTrade[]
  has_open_position: boolean
  open_position: OpenPosition | null
  // Summary statistics
  total_completed_trades: number
  total_pnl: number
  winning_trades: number
  losing_trades: number
  win_rate: number
  avg_return_pct: number
  avg_duration_ticks: number
  best_trade_pnl: number
  worst_trade_pnl: number
}

// Agent result types
export interface AgentResult {
  id: string
  agent_id: string
  final_equity: number
  total_return: number
  sharpe_ratio: number | null
  max_drawdown: number
  calmar_ratio: number | null
  total_trades: number
  win_rate: number | null
  survival_time: number
  // Chart data with x-axis and y-axis
  equity_curve: ChartDataPoint[]
  cumulative_alpha: ChartDataPoint[] | null
  // Legacy (deprecated) - for backward compatibility
  equity_curve_values?: number[]
  cumulative_alpha_values?: number[]
  trades: Trade[]
  // CAPM metrics
  alpha: number | null
  beta: number | null
  created_at: string
}

// Agent types
export interface Agent {
  id: string
  user_id: string
  round_id: string
  strategy_type: StrategyType
  config: AgentConfig
  created_at: string
  result: AgentResult | null
  user_nickname: string | null
  user_color: string | null
}

export interface AgentCreate {
  strategy_type: StrategyType
  config: AgentConfig
}

// Leaderboard types
export type LeaderboardSortBy = 
  | 'sharpe_ratio' 
  | 'total_return' 
  | 'max_drawdown' 
  | 'calmar_ratio' 
  | 'win_rate' 
  | 'survival_time'
  | 'alpha'
  | 'beta'

export interface LeaderboardEntry {
  rank: number
  agent_id: string
  user_id: string
  nickname: string
  color: string
  icon: string
  strategy_type: StrategyType
  final_equity: number
  total_return: number
  sharpe_ratio: number | null
  max_drawdown: number
  calmar_ratio: number | null
  win_rate: number | null
  total_trades: number
  survival_time: number
  is_ghost: boolean
  // CAPM metrics
  alpha: number | null
  beta: number | null
}

export interface Leaderboard {
  round_id: string
  round_name: string
  entries: LeaderboardEntry[]
  total_participants: number
  best_sharpe: number
  best_return: number
  lowest_drawdown: number
  average_survival: number
  best_alpha: number | null
}

export interface UserRanking {
  rank: number
  total_participants: number
  final_equity: number
  total_return: number
  sharpe_ratio: number | null
  max_drawdown: number
  percentile: number
  alpha: number | null
  beta: number | null
}

// Global Leaderboard types
export type GlobalLeaderboardSortBy =
  | 'performance_score'
  | 'avg_sharpe_ratio'
  | 'avg_total_return'
  | 'total_rounds'
  | 'win_rate'
  | 'avg_alpha'

export interface GlobalLeaderboardEntry {
  rank: number
  user_id: string
  nickname: string
  color: string
  icon: string
  total_rounds: number
  avg_sharpe_ratio: number | null
  best_sharpe_ratio: number | null
  avg_total_return: number
  best_total_return: number
  avg_alpha: number | null
  best_alpha: number | null
  first_place_count: number
  top_3_count: number
  top_10_count: number
  win_rate: number
  performance_score: number
}

export interface GlobalLeaderboard {
  entries: GlobalLeaderboardEntry[]
  total_users: number
  total_rounds_analyzed: number
  highest_avg_sharpe: number
  highest_avg_return: number
  highest_avg_alpha: number | null
  most_rounds_participated: number
}

export interface GlobalUserRanking {
  rank: number
  total_users: number
  total_rounds: number
  avg_sharpe_ratio: number | null
  avg_total_return: number
  avg_alpha: number | null
  win_rate: number
  first_place_count: number
  top_3_count: number
  top_10_count: number
  performance_score: number
  percentile: number
}

// Auth verification
export interface AuthVerify {
  valid: boolean
  user_id: string
  is_admin: boolean
  nickname: string
}

// Default configs
export const DEFAULT_SIGNAL_STACK: SignalStack = {
  use_sma_trend_filter: false,
  sma_filter_window: 50,
  use_volatility_filter: false,
  volatility_window: 20,
  volatility_threshold: 1.5,
}

export const DEFAULT_RISK_PARAMS: RiskParams = {
  position_size_pct: 10,
  max_leverage: 1.0,
  stop_loss_pct: 5,
  take_profit_pct: 10,
  max_drawdown_kill: 20,
}

export const DEFAULT_STRATEGY_PARAMS: Record<StrategyType, StrategyParams> = {
  MEAN_REVERSION: {
    lookback_window: 20,
    entry_threshold: 2.0,
    exit_threshold: 0.5,
  },
  TREND_FOLLOWING: {
    fast_window: 10,
    slow_window: 30,
    atr_multiplier: 2.0,
  },
  MOMENTUM: {
    momentum_window: 14,
    rsi_window: 14,
    rsi_overbought: 70,
    rsi_oversold: 30,
  },
  GHOST: {},
}

// Icon options for user profile
export const ICON_OPTIONS = [
  'user',
  'chart-line',
  'trending-up',
  'zap',
  'target',
  'rocket',
  'brain',
  'flame',
] as const

export type IconOption = (typeof ICON_OPTIONS)[number]

// Color options for user profile
export const COLOR_OPTIONS: string[] = [
  '#3B82F6', // blue
  '#EF4444', // red
  '#10B981', // green
  '#F59E0B', // amber
  '#8B5CF6', // violet
  '#EC4899', // pink
  '#06B6D4', // cyan
  '#F97316', // orange
]
