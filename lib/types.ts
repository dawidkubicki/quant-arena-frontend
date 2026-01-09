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
export type RoundStatus = 'PENDING' | 'RUNNING' | 'COMPLETED'

export interface MarketConfig {
  initial_price: number
  num_ticks: number
  initial_equity: number
  base_volatility: number
  base_drift: number
  trend_probability: number
  volatile_probability: number
  regime_persistence: number
  base_slippage: number
  fee_rate: number
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
  price_data: number[] | null
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
  use_sma: boolean
  sma_window: number
  use_rsi: boolean
  rsi_window: number
  rsi_overbought: number
  rsi_oversold: number
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

// Trade types
export interface Trade {
  tick: number
  action: string
  price: number
  executed_price: number
  size: number
  cost: number
  pnl: number
  equity_after: number
  reason: string
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
  equity_curve: number[]
  trades: Trade[]
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
}

export interface UserRanking {
  rank: number
  total_participants: number
  final_equity: number
  total_return: number
  sharpe_ratio: number | null
  max_drawdown: number
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
  use_sma: true,
  sma_window: 20,
  use_rsi: true,
  rsi_window: 14,
  rsi_overbought: 70,
  rsi_oversold: 30,
  use_volatility_filter: false,
  volatility_window: 20,
  volatility_threshold: 0.03,
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
