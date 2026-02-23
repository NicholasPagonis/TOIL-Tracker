export interface Break {
  id: string
  sessionId: string
  startedAt: string
  endedAt: string
}

export interface Session {
  id: string
  startedAt: string
  endedAt: string | null
  source: 'SHORTCUT' | 'MANUAL' | 'EDITED'
  locationLabel: string | null
  latitude: number | null
  longitude: number | null
  notes: string | null
  breaks: Break[]
  createdAt: string
  updatedAt: string
}

export interface DailyTotalSession extends Session {
  minutes: number
}

export interface DailyTotal {
  date: string
  totalMinutes: number
  tilMinutes: number
  sessions: DailyTotalSession[]
}

export interface SummaryResponse {
  from: string
  to: string
  days: DailyTotal[]
  totalTilMinutes: number
  totalWorkedMinutes: number
}

export interface AppSettings {
  id: string
  standardDailyMinutes: number
  roundingRule: 'NONE' | 'NEAREST_5' | 'NEAREST_10' | 'NEAREST_15'
  overtimeStartsAfterMinutes: number | null
  allowNegativeTil: boolean
  workLocationGeofenceName: string | null
  reportRecipientEmails: string[]
  reportSubjectTemplate: string
  reportFooter: string
}

export interface ClockInResponse {
  alreadyClockedIn: boolean
  session: Session
}
