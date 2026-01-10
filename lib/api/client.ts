import { createClient } from '@/lib/supabase/client'
import type {
  User,
  UserUpdate,
  Round,
  RoundList,
  RoundStatusResponse,
  RoundCreate,
  Agent,
  AgentCreate,
  Leaderboard,
  LeaderboardSortBy,
  UserRanking,
  GlobalLeaderboard,
  GlobalLeaderboardSortBy,
  GlobalUserRanking,
  AuthVerify,
  RoundStatus,
  MarketDataStatus,
  MarketDataset,
  MarketDataFetchRequest,
  MarketDataFetchResponse,
  MarketDataStats,
  MarketApiStatus,
  MarketDataDeleteResponse,
  CompletedTradesResponse,
} from '@/lib/types'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

class ApiError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

async function getAuthToken(): Promise<string | null> {
  const supabase = createClient()
  
  // First try to get the cached session
  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session) {
    return null
  }
  
  // Check if the token is about to expire (within 60 seconds)
  // If so, refresh the session to get a fresh token
  const expiresAt = session.expires_at
  if (expiresAt) {
    const now = Math.floor(Date.now() / 1000)
    if (expiresAt - now < 60) {
      const { data: { session: refreshedSession } } = await supabase.auth.refreshSession()
      return refreshedSession?.access_token || null
    }
  }
  
  return session.access_token
}

interface ApiCallOptions extends RequestInit {
  /** Expected error status codes that should not throw (will return null instead) */
  allowedErrors?: number[]
}

async function apiCall<T>(
  endpoint: string,
  options: ApiCallOptions = {}
): Promise<T> {
  const { allowedErrors, ...fetchOptions } = options
  const token = await getAuthToken()

  // If no token and this is not a public endpoint, throw early
  if (!token) {
    throw new ApiError(401, 'Not authenticated')
  }

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
    ...fetchOptions.headers,
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...fetchOptions,
    headers,
  })

  if (!response.ok) {
    const errorText = await response.text()
    let errorMessage = errorText
    try {
      const errorJson = JSON.parse(errorText)
      // Handle FastAPI validation errors
      if (errorJson.detail) {
        if (Array.isArray(errorJson.detail)) {
          // Pydantic validation errors
          errorMessage = errorJson.detail.map((err: any) => 
            `${err.loc.join('.')}: ${err.msg}`
          ).join(', ')
        } else if (typeof errorJson.detail === 'string') {
          errorMessage = errorJson.detail
        } else {
          errorMessage = JSON.stringify(errorJson.detail)
        }
      } else {
        errorMessage = JSON.stringify(errorJson)
      }
    } catch {
      // Keep original error text
    }
    
    // If this error status is expected, return null instead of throwing
    if (allowedErrors?.includes(response.status)) {
      return null as T
    }
    
    // Don't automatically sign out on 401 - the Supabase session may be valid
    // even if the backend returns 401 (e.g., JWT secret mismatch, backend config issue)
    // Let the calling code handle the error appropriately
    
    throw new ApiError(response.status, errorMessage)
  }

  // Handle empty responses
  const text = await response.text()
  if (!text) return {} as T
  return JSON.parse(text)
}

// Auth API
export const auth = {
  me: () => apiCall<User>('/api/auth/me'),

  updateMe: (data: UserUpdate) =>
    apiCall<User>('/api/auth/me', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  verify: () => apiCall<AuthVerify>('/api/auth/verify'),
}

// Rounds API
export const rounds = {
  list: (statusFilter?: RoundStatus, skip = 0, limit = 50) => {
    const params = new URLSearchParams()
    if (statusFilter) params.append('status_filter', statusFilter)
    params.append('skip', skip.toString())
    params.append('limit', limit.toString())
    return apiCall<RoundList[]>(`/api/rounds/?${params.toString()}`)
  },

  get: (roundId: string) => apiCall<Round>(`/api/rounds/${roundId}`),

  getStatus: (roundId: string) =>
    apiCall<RoundStatusResponse>(`/api/rounds/${roundId}/status`),

  create: (data: RoundCreate) =>
    apiCall<Round>('/api/rounds/', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  start: (roundId: string) =>
    apiCall<RoundStatusResponse>(`/api/rounds/${roundId}/start`, {
      method: 'POST',
    }),

  stop: (roundId: string) =>
    apiCall<RoundStatusResponse>(`/api/rounds/${roundId}/stop`, {
      method: 'POST',
    }),

  delete: (roundId: string) =>
    apiCall<{ message: string }>(`/api/rounds/${roundId}`, {
      method: 'DELETE',
    }),
}

// Agents API
export const agents = {
  listForRound: (roundId: string) =>
    apiCall<Agent[]>(`/api/rounds/${roundId}/agents`),

  getMyAgent: (roundId: string) =>
    apiCall<Agent>(`/api/rounds/${roundId}/agents/me`, {
      // 404 is expected when user hasn't created an agent for this round yet
      allowedErrors: [404],
    }),

  get: (roundId: string, agentId: string) =>
    apiCall<Agent>(`/api/rounds/${roundId}/agents/${agentId}`),

  createOrUpdate: (roundId: string, data: AgentCreate) =>
    apiCall<Agent>(`/api/rounds/${roundId}/agents`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  deleteMyAgent: (roundId: string) =>
    apiCall<{ message: string }>(`/api/rounds/${roundId}/agents/me`, {
      method: 'DELETE',
    }),

  getResults: (roundId: string, agentId: string) =>
    apiCall<Agent>(`/api/rounds/${roundId}/agents/${agentId}/results`),
}

// Trades API
export const trades = {
  /**
   * Get completed trades with paired entry/exit for an agent.
   * This is the recommended endpoint for displaying trade history.
   */
  getCompleted: (agentId: string) =>
    apiCall<CompletedTradesResponse>(`/api/trades/agent/${agentId}/completed`),
}

// Leaderboard API
export const leaderboard = {
  get: (roundId: string, sortBy: LeaderboardSortBy = 'sharpe_ratio', ascending = false) => {
    const params = new URLSearchParams()
    params.append('sort_by', sortBy)
    params.append('ascending', ascending.toString())
    return apiCall<Leaderboard>(
      `/api/rounds/${roundId}/leaderboard?${params.toString()}`
    )
  },

  getMyRanking: (roundId: string, userId: string) =>
    apiCall<UserRanking>(
      `/api/rounds/${roundId}/leaderboard/me?user_id=${userId}`
    ),

  getGlobal: (
    sortBy: GlobalLeaderboardSortBy = 'performance_score',
    limit = 100,
    offset = 0
  ) => {
    const params = new URLSearchParams()
    params.append('sort_by', sortBy)
    params.append('limit', limit.toString())
    params.append('offset', offset.toString())
    return apiCall<GlobalLeaderboard>(
      `/api/leaderboard/global?${params.toString()}`
    )
  },

  getMyGlobalRanking: (userId: string) =>
    apiCall<GlobalUserRanking>(
      `/api/leaderboard/global/me?user_id=${userId}`
    ),
}

// Market Data API
export const marketData = {
  getStatus: () => 
    apiCall<MarketDataStatus>('/api/market-data/status'),

  fetch: (data: MarketDataFetchRequest) =>
    apiCall<MarketDataFetchResponse>('/api/market-data/fetch', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getDatasets: (symbol?: string) => {
    const params = new URLSearchParams()
    if (symbol) params.append('symbol', symbol)
    const queryString = params.toString()
    return apiCall<MarketDataset[]>(
      `/api/market-data/datasets${queryString ? `?${queryString}` : ''}`
    )
  },

  getStats: () =>
    apiCall<MarketDataStats[]>('/api/market-data/stats'),

  checkApi: () =>
    apiCall<MarketApiStatus>('/api/market-data/check-api'),

  delete: (symbol: string) =>
    apiCall<MarketDataDeleteResponse>(`/api/market-data/${symbol}`, {
      method: 'DELETE',
    }),
}

// Polling helper for round status
export async function pollRoundStatus(
  roundId: string,
  onUpdate?: (status: RoundStatusResponse) => void,
  intervalMs = 1500
): Promise<RoundStatusResponse> {
  const status = await rounds.getStatus(roundId)
  onUpdate?.(status)

  // Stop polling when simulation completes or fails
  if (status.status === 'COMPLETED' || status.status === 'FAILED') {
    return status
  }

  await new Promise((resolve) => setTimeout(resolve, intervalMs))
  return pollRoundStatus(roundId, onUpdate, intervalMs)
}

// Export all as default
const api = {
  auth,
  rounds,
  agents,
  trades,
  leaderboard,
  marketData,
  pollRoundStatus,
}

export default api
