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
  AuthVerify,
  RoundStatus,
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

async function apiCall<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = await getAuthToken()

  // If no token and this is not a public endpoint, throw early
  if (!token) {
    throw new ApiError(401, 'Not authenticated')
  }

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
    ...options.headers,
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  })

  if (!response.ok) {
    const errorText = await response.text()
    let errorMessage = errorText
    try {
      const errorJson = JSON.parse(errorText)
      errorMessage = errorJson.detail || errorText
    } catch {
      // Keep original error text
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
    apiCall<Agent>(`/api/rounds/${roundId}/agents/me`),

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
}

// Polling helper for round status
export async function pollRoundStatus(
  roundId: string,
  onUpdate?: (status: RoundStatusResponse) => void,
  intervalMs = 1000
): Promise<RoundStatusResponse> {
  const status = await rounds.getStatus(roundId)
  onUpdate?.(status)

  if (status.status === 'COMPLETED') {
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
  leaderboard,
  pollRoundStatus,
}

export default api
