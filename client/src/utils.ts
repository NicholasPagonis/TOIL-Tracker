import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subWeeks, subMonths } from 'date-fns'

export function formatMinutes(minutes: number): string {
  const abs = Math.abs(minutes)
  const h = Math.floor(abs / 60)
  const m = abs % 60
  const sign = minutes < 0 ? '-' : ''
  if (h === 0) return `${sign}${m}m`
  if (m === 0) return `${sign}${h}h`
  return `${sign}${h}h ${m}m`
}

export function formatTime(isoString: string): string {
  return format(new Date(isoString), 'HH:mm')
}

export function formatDate(isoString: string): string {
  return format(new Date(isoString), 'EEE d MMM')
}

export function formatDateShort(isoString: string): string {
  return format(new Date(isoString), 'd MMM')
}

export function toYMD(date: Date): string {
  return format(date, 'yyyy-MM-dd')
}

export function getCurrentWeekRange(): { from: string; to: string } {
  const now = new Date()
  return {
    from: toYMD(startOfWeek(now, { weekStartsOn: 1 })),
    to: toYMD(endOfWeek(now, { weekStartsOn: 1 })),
  }
}

export function getLastWeekRange(): { from: string; to: string } {
  const last = subWeeks(new Date(), 1)
  return {
    from: toYMD(startOfWeek(last, { weekStartsOn: 1 })),
    to: toYMD(endOfWeek(last, { weekStartsOn: 1 })),
  }
}

export function getCurrentMonthRange(): { from: string; to: string } {
  const now = new Date()
  return {
    from: toYMD(startOfMonth(now)),
    to: toYMD(endOfMonth(now)),
  }
}

export function getLastMonthRange(): { from: string; to: string } {
  const last = subMonths(new Date(), 1)
  return {
    from: toYMD(startOfMonth(last)),
    to: toYMD(endOfMonth(last)),
  }
}

export function elapsedSeconds(startedAt: string): number {
  return Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000)
}

export function formatElapsed(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}
