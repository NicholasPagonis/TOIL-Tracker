import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { Play, Square, Plus, TrendingUp, Clock, Zap, ChevronRight } from 'lucide-react'
import { api } from '../api'
import type { Session, SummaryResponse } from '../types'
import { formatMinutes, formatTime, formatDate, formatElapsed, getCurrentWeekRange } from '../utils'
import { DashboardSkeleton } from '../components/Skeleton'
import { format } from 'date-fns'

export default function Dashboard() {
  const [loading, setLoading] = useState(true)
  const [activeSession, setActiveSession] = useState<Session | null>(null)
  const [summary, setSummary] = useState<SummaryResponse | null>(null)
  const [elapsed, setElapsed] = useState(0)
  const [clockingIn, setClockinIn] = useState(false)
  const [clockingOut, setClockingOut] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    try {
      const range = getCurrentWeekRange()
      const [active, sum] = await Promise.all([
        api.getActiveSession(),
        api.getSummary(range),
      ])
      setActiveSession(active)
      setSummary(sum)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Live elapsed counter
  useEffect(() => {
    if (!activeSession) return
    const update = () => {
      setElapsed(Math.floor((Date.now() - new Date(activeSession.startedAt).getTime()) / 1000))
    }
    update()
    const id = setInterval(update, 1000)
    return () => clearInterval(id)
  }, [activeSession])

  const handleClockIn = async () => {
    setClockinIn(true)
    setError(null)
    try {
      const res = await api.clockIn()
      setActiveSession(res.session)
      setElapsed(0)
      await loadData()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to clock in')
    } finally {
      setClockinIn(false)
    }
  }

  const handleClockOut = async () => {
    setClockingOut(true)
    setError(null)
    try {
      await api.clockOut()
      setActiveSession(null)
      setElapsed(0)
      await loadData()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to clock out')
    } finally {
      setClockingOut(false)
    }
  }

  if (loading) return <DashboardSkeleton />

  const today = format(new Date(), 'yyyy-MM-dd')
  const todayData = summary?.days.find(d => d.date === today)
  const recentDays = summary?.days
    .filter(d => d.sessions.length > 0)
    .slice(-5)
    .reverse() ?? []

  return (
    <div className="px-4 py-6 space-y-4 max-w-2xl mx-auto lg:px-6 lg:py-8">
      {/* Status header */}
      <div className="text-center mb-2">
        <p className="text-slate-500 text-sm font-medium uppercase tracking-widest">
          {format(new Date(), 'EEEE, d MMMM')}
        </p>
      </div>

      {/* Clock card */}
      <div className="card p-6 text-center space-y-5">
        {activeSession ? (
          <>
            <div className="flex items-center justify-center gap-2">
              <span className="w-2.5 h-2.5 bg-green-400 rounded-full animate-pulse" />
              <span className="text-green-400 font-semibold text-sm">Clocked In</span>
            </div>
            <div className="space-y-1">
              <p className="text-5xl font-bold text-white tabular-nums tracking-tight">
                {formatElapsed(elapsed)}
              </p>
              <p className="text-slate-500 text-sm">
                Since {formatTime(activeSession.startedAt)}
                {activeSession.locationLabel && ` · ${activeSession.locationLabel}`}
              </p>
            </div>
            <button
              onClick={handleClockOut}
              disabled={clockingOut}
              className="w-full flex items-center justify-center gap-3 bg-red-500 hover:bg-red-400 active:bg-red-600 text-white font-bold text-lg rounded-2xl py-5 transition-all duration-150 shadow-lg shadow-red-500/20 disabled:opacity-60"
            >
              <Square size={22} className="fill-current" />
              {clockingOut ? 'Clocking Out…' : 'Clock Out'}
            </button>
          </>
        ) : (
          <>
            <div className="flex items-center justify-center gap-2">
              <span className="w-2.5 h-2.5 bg-slate-600 rounded-full" />
              <span className="text-slate-500 font-semibold text-sm">Not Clocked In</span>
            </div>
            <div className="py-2">
              <p className="text-6xl font-bold text-slate-700 tabular-nums tracking-tight">
                {format(new Date(), 'HH:mm')}
              </p>
            </div>
            <button
              onClick={handleClockIn}
              disabled={clockingIn}
              className="w-full flex items-center justify-center gap-3 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-bold text-lg rounded-2xl py-5 transition-all duration-150 shadow-lg shadow-indigo-500/25 disabled:opacity-60"
            >
              <Play size={22} className="fill-current" />
              {clockingIn ? 'Clocking In…' : 'Clock In'}
            </button>
          </>
        )}

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2.5">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}
      </div>

      {/* Today's stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="card p-4 space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-500/10 rounded-lg flex items-center justify-center">
              <Clock size={15} className="text-indigo-400" />
            </div>
            <span className="text-xs text-slate-500 font-medium">Today Worked</span>
          </div>
          <p className="text-2xl font-bold text-white">
            {todayData ? formatMinutes(todayData.totalMinutes) : '—'}
          </p>
        </div>
        <div className="card p-4 space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-green-500/10 rounded-lg flex items-center justify-center">
              <TrendingUp size={15} className="text-green-400" />
            </div>
            <span className="text-xs text-slate-500 font-medium">Today TOIL</span>
          </div>
          <p className={`text-2xl font-bold ${
            (todayData?.tilMinutes ?? 0) >= 0 ? 'text-green-400' : 'text-amber-400'
          }`}>
            {todayData
              ? `${todayData.tilMinutes >= 0 ? '+' : ''}${formatMinutes(todayData.tilMinutes)}`
              : '—'}
          </p>
        </div>
      </div>

      {/* Week summary */}
      {summary && (
        <div className="card p-4 space-y-1">
          <div className="flex items-center gap-2 mb-3">
            <Zap size={15} className="text-violet-400" />
            <span className="text-sm font-semibold text-slate-300">This Week</span>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-slate-500">Total Worked</p>
              <p className="text-lg font-bold text-white">{formatMinutes(summary.totalWorkedMinutes)}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Total TOIL</p>
              <p className={`text-lg font-bold ${summary.totalTilMinutes >= 0 ? 'text-green-400' : 'text-amber-400'}`}>
                {summary.totalTilMinutes >= 0 ? '+' : ''}{formatMinutes(summary.totalTilMinutes)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Recent sessions */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Recent</h2>
          <Link to="/log" className="text-xs text-indigo-400 font-medium flex items-center gap-0.5">
            View All <ChevronRight size={14} />
          </Link>
        </div>

        {recentDays.length === 0 ? (
          <div className="card p-8 text-center">
            <p className="text-slate-600 text-sm">No sessions this week</p>
            <Link to="/add" className="inline-flex items-center gap-2 mt-3 text-indigo-400 text-sm font-medium">
              <Plus size={16} /> Add your first entry
            </Link>
          </div>
        ) : (
          recentDays.map(day => (
            <div key={day.date} className="card p-4 flex items-center justify-between">
              <div>
                <p className="font-semibold text-white text-sm">{formatDate(day.date + 'T00:00:00')}</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  {day.sessions.length} session{day.sessions.length !== 1 ? 's' : ''}
                </p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-white text-sm">{formatMinutes(day.totalMinutes)}</p>
                <p className={`text-xs font-medium mt-0.5 ${day.tilMinutes >= 0 ? 'text-green-400' : 'text-amber-400'}`}>
                  {day.tilMinutes >= 0 ? '+' : ''}{formatMinutes(day.tilMinutes)} TOIL
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Quick add */}
      <Link
        to="/add"
        className="flex items-center justify-center gap-2 card p-4 text-slate-400 hover:text-indigo-400 hover:border-indigo-500/30 transition-all duration-150"
      >
        <Plus size={18} />
        <span className="text-sm font-medium">Add Manual Entry</span>
      </Link>
    </div>
  )
}
