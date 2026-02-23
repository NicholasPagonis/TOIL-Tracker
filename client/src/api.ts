import type { Session, SummaryResponse, AppSettings, ClockInResponse } from './types'

const BASE = '/api'

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }))
    throw new Error(err.message || `HTTP ${res.status}`)
  }
  return res.json() as Promise<T>
}

export const api = {
  // Sessions
  clockIn: (data?: { locationLabel?: string; notes?: string }) =>
    request<ClockInResponse>('/sessions/clock-in', {
      method: 'POST',
      body: JSON.stringify(data ?? {}),
    }),

  clockOut: (data?: { notes?: string }) =>
    request<{ session: Session }>('/sessions/clock-out', {
      method: 'POST',
      body: JSON.stringify(data ?? {}),
    }),

  getActiveSession: (): Promise<Session | null> =>
    request<Session | null>('/sessions/active'),

  getSessions: (params: { from?: string; to?: string } = {}) => {
    const q = new URLSearchParams(params as Record<string, string>).toString()
    return request<{ sessions: Session[] }>(`/sessions${q ? `?${q}` : ''}`).then(r => r.sessions)
  },

  getSession: (id: string) =>
    request<{ session: Session }>(`/sessions/${id}`).then(r => r.session),

  createSession: (data: {
    startedAt: string
    endedAt?: string
    locationLabel?: string
    notes?: string
    breaks?: { startedAt: string; endedAt: string }[]
  }) =>
    request<{ session: Session; warning?: string; overlappingSessionId?: string }>('/sessions', {
      method: 'POST',
      body: JSON.stringify(data),
    }).then(r => r.session),

  updateSession: (
    id: string,
    data: {
      startedAt?: string
      endedAt?: string
      locationLabel?: string
      notes?: string
      breaks?: { startedAt: string; endedAt: string }[]
    }
  ) =>
    request<{ session: Session }>(`/sessions/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }).then(r => r.session),

  deleteSession: (id: string) =>
    request<void>(`/sessions/${id}`, { method: 'DELETE' }),

  // Summary
  getSummary: (params: { from: string; to: string }) => {
    const q = new URLSearchParams(params).toString()
    return request<SummaryResponse>(`/summary?${q}`)
  },

  // Report
  getReportHtml: async (params: { from: string; to: string }): Promise<string> => {
    const q = new URLSearchParams({ ...params, format: 'html' }).toString()
    const res = await fetch(`${BASE}/report?${q}`)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return res.text()
  },

  getReportCsv: async (params: { from: string; to: string }): Promise<string> => {
    const q = new URLSearchParams({ ...params, format: 'csv' }).toString()
    const res = await fetch(`${BASE}/report?${q}`)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return res.text()
  },

  // Settings
  getSettings: () => request<AppSettings>('/settings'),

  updateSettings: (data: Partial<AppSettings>) =>
    request<AppSettings>('/settings', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
}
