import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Plus, Edit2, Trash2, ChevronDown, ChevronUp, MapPin } from 'lucide-react'
import { format, addWeeks, subWeeks, startOfWeek, endOfWeek, eachDayOfInterval } from 'date-fns'
import { api } from '../api'
import type { SummaryResponse, Session } from '../types'
import { formatMinutes, formatTime, toYMD } from '../utils'

function SessionItem({ session, onDelete }: { session: Session; onDelete: () => void }) {
  const [deleting, setDeleting] = useState(false)

  const handleDelete = async () => {
    if (!confirm('Delete this session?')) return
    setDeleting(true)
    try {
      await api.deleteSession(session.id)
      onDelete()
    } catch {
      setDeleting(false)
    }
  }

  return (
    <div className="flex items-center justify-between py-2.5 border-t border-slate-800 first:border-t-0">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-white tabular-nums">
            {formatTime(session.startedAt)}
            {' '}–{' '}
            {session.endedAt ? formatTime(session.endedAt) : <span className="text-green-400">Now</span>}
          </span>
          {session.source !== 'MANUAL' && (
            <span className="text-[10px] font-medium bg-slate-800 text-slate-500 rounded px-1.5 py-0.5">
              {session.source}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          {session.locationLabel && (
            <span className="flex items-center gap-1 text-xs text-slate-500">
              <MapPin size={10} /> {session.locationLabel}
            </span>
          )}
          {session.notes && (
            <span className="text-xs text-slate-600 truncate max-w-[180px]">{session.notes}</span>
          )}
          {session.breaks.length > 0 && (
            <span className="text-xs text-slate-600">{session.breaks.length} break{session.breaks.length > 1 ? 's' : ''}</span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-1 ml-2 shrink-0">
        <Link
          to={`/add/${session.id}`}
          className="p-2 text-slate-500 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-all"
        >
          <Edit2 size={14} />
        </Link>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all disabled:opacity-40"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  )
}

function DayCard({ date, day, onRefresh }: {
  date: Date
  day?: { totalMinutes: number; tilMinutes: number; sessions: Session[] }
  onRefresh: () => void
}) {
  const [expanded, setExpanded] = useState(false)
  const dateStr = toYMD(date)
  const isToday = dateStr === toYMD(new Date())
  const hasSessions = (day?.sessions.length ?? 0) > 0

  return (
    <div className={`card overflow-hidden ${isToday ? 'border-indigo-500/40' : ''}`}>
      <button
        onClick={() => hasSessions && setExpanded(e => !e)}
        className={`w-full flex items-center justify-between px-4 py-3.5 transition-colors ${hasSessions ? 'cursor-pointer hover:bg-slate-800/30' : 'cursor-default'}`}
      >
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold ${
            isToday ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400'
          }`}>
            {format(date, 'd')}
          </div>
          <div className="text-left">
            <p className={`font-semibold text-sm ${isToday ? 'text-indigo-300' : 'text-slate-300'}`}>
              {format(date, 'EEE')}
              {isToday && <span className="ml-1.5 text-xs font-normal text-indigo-400">Today</span>}
            </p>
            <p className="text-xs text-slate-600">{format(date, 'MMM d')}</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {day && hasSessions ? (
            <>
              <div className="text-right">
                <p className="text-sm font-semibold text-white">{formatMinutes(day.totalMinutes)}</p>
                <p className={`text-xs font-medium ${day.tilMinutes >= 0 ? 'text-green-400' : 'text-amber-400'}`}>
                  {day.tilMinutes >= 0 ? '+' : ''}{formatMinutes(day.tilMinutes)}
                </p>
              </div>
              {expanded ? <ChevronUp size={16} className="text-slate-500" /> : <ChevronDown size={16} className="text-slate-500" />}
            </>
          ) : (
            <Link
              to="/add"
              onClick={e => e.stopPropagation()}
              className="flex items-center gap-1 text-xs text-slate-600 hover:text-indigo-400 transition-colors"
            >
              <Plus size={14} />
            </Link>
          )}
        </div>
      </button>

      {expanded && hasSessions && (
        <div className="px-4 pb-3 pt-0">
          {day!.sessions.map(session => (
            <SessionItem key={session.id} session={session} onDelete={onRefresh} />
          ))}
        </div>
      )}
    </div>
  )
}

export default function Log() {
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }))
  const [summary, setSummary] = useState<SummaryResponse | null>(null)
  const [loading, setLoading] = useState(true)

  const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 })
  const days = eachDayOfInterval({ start: weekStart, end: weekEnd })

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const data = await api.getSummary({
        from: toYMD(weekStart),
        to: toYMD(weekEnd),
      })
      setSummary(data)
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }, [weekStart]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    loadData()
  }, [loadData])

  const isCurrentWeek = toYMD(weekStart) === toYMD(startOfWeek(new Date(), { weekStartsOn: 1 }))

  return (
    <div className="px-4 py-6 space-y-4 max-w-2xl mx-auto lg:px-6 lg:py-8">
      {/* Week navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setWeekStart(w => subWeeks(w, 1))}
          className="btn-secondary p-2.5"
        >
          <ChevronLeft size={18} />
        </button>
        <div className="text-center">
          <p className="font-semibold text-white text-sm">
            {format(weekStart, 'MMM d')} – {format(weekEnd, 'MMM d, yyyy')}
          </p>
          {isCurrentWeek && <p className="text-xs text-indigo-400 mt-0.5">This week</p>}
        </div>
        <button
          onClick={() => setWeekStart(w => addWeeks(w, 1))}
          disabled={isCurrentWeek}
          className="btn-secondary p-2.5 disabled:opacity-30"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Week totals */}
      {summary && !loading && (
        <div className="card p-4 grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-slate-500 mb-1">Week Total</p>
            <p className="text-xl font-bold text-white">{formatMinutes(summary.totalWorkedMinutes)}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500 mb-1">Week TOIL</p>
            <p className={`text-xl font-bold ${summary.totalTilMinutes >= 0 ? 'text-green-400' : 'text-amber-400'}`}>
              {summary.totalTilMinutes >= 0 ? '+' : ''}{formatMinutes(summary.totalTilMinutes)}
            </p>
          </div>
        </div>
      )}

      {/* Day cards */}
      <div className="space-y-2">
        {loading ? (
          [...Array(7)].map((_, i) => (
            <div key={i} className="skeleton h-16 rounded-2xl" />
          ))
        ) : (
          days.map(date => {
            const dateStr = toYMD(date)
            const dayData = summary?.days.find(d => d.date === dateStr)
            return (
              <DayCard
                key={dateStr}
                date={date}
                day={dayData}
                onRefresh={loadData}
              />
            )
          })
        )}
      </div>
    </div>
  )
}
