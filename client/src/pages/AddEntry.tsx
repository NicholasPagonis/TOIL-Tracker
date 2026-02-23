import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Plus, Trash2, AlertTriangle, Info, ArrowLeft } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { api } from '../api'
import type { Session } from '../types'

interface BreakEntry {
  id?: string
  startDate: string
  startTime: string
  endDate: string
  endTime: string
}

function toLocalDateTimeInputs(iso: string) {
  const d = new Date(iso)
  return {
    date: format(d, 'yyyy-MM-dd'),
    time: format(d, 'HH:mm'),
  }
}

function toISO(date: string, time: string): string {
  return new Date(`${date}T${time}:00`).toISOString()
}

export default function AddEntry() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const isEdit = Boolean(id)

  const [loading, setLoading] = useState(isEdit)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [conflict, setConflict] = useState(false)
  const [source, setSource] = useState<string>('MANUAL')

  // Form state
  const now = new Date()
  const [startDate, setStartDate] = useState(format(now, 'yyyy-MM-dd'))
  const [startTime, setStartTime] = useState(format(new Date(now.getTime() - 8 * 60 * 60 * 1000), 'HH:mm'))
  const [endDate, setEndDate] = useState(format(now, 'yyyy-MM-dd'))
  const [endTime, setEndTime] = useState(format(now, 'HH:mm'))
  const [hasEnd, setHasEnd] = useState(true)
  const [location, setLocation] = useState('')
  const [notes, setNotes] = useState('')
  const [breaks, setBreaks] = useState<BreakEntry[]>([])

  // Load existing session
  useEffect(() => {
    if (!id) return
    api.getSession(id).then((session: Session) => {
      const start = toLocalDateTimeInputs(session.startedAt)
      setStartDate(start.date)
      setStartTime(start.time)
      if (session.endedAt) {
        const end = toLocalDateTimeInputs(session.endedAt)
        setEndDate(end.date)
        setEndTime(end.time)
        setHasEnd(true)
      } else {
        setHasEnd(false)
      }
      setLocation(session.locationLabel ?? '')
      setNotes(session.notes ?? '')
      setSource(session.source)
      setBreaks(
        session.breaks.map(b => {
          const bs = toLocalDateTimeInputs(b.startedAt)
          const be = toLocalDateTimeInputs(b.endedAt)
          return {
            id: b.id,
            startDate: bs.date,
            startTime: bs.time,
            endDate: be.date,
            endTime: be.time,
          }
        })
      )
      setLoading(false)
    }).catch(() => {
      setError('Failed to load session')
      setLoading(false)
    })
  }, [id])

  const addBreak = () => {
    setBreaks(prev => [
      ...prev,
      {
        startDate,
        startTime: format(new Date(), 'HH:mm'),
        endDate,
        endTime: format(new Date(), 'HH:mm'),
      },
    ])
  }

  const removeBreak = (index: number) => {
    setBreaks(prev => prev.filter((_, i) => i !== index))
  }

  const updateBreak = (index: number, field: keyof BreakEntry, value: string) => {
    setBreaks(prev => prev.map((b, i) => (i === index ? { ...b, [field]: value } : b)))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setConflict(false)

    try {
      const startedAt = toISO(startDate, startTime)
      const endedAt = hasEnd ? toISO(endDate, endTime) : undefined
      const formattedBreaks = breaks.map(b => ({
        startedAt: toISO(b.startDate, b.startTime),
        endedAt: toISO(b.endDate, b.endTime),
      }))

      const data = {
        startedAt,
        ...(endedAt ? { endedAt } : {}),
        locationLabel: location || undefined,
        notes: notes || undefined,
        breaks: formattedBreaks,
      }

      if (isEdit && id) {
        await api.updateSession(id, data)
      } else {
        await api.createSession(data)
      }
      navigate('/log')
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to save'
      if (msg.toLowerCase().includes('overlap') || msg.toLowerCase().includes('conflict')) {
        setConflict(true)
      }
      setError(msg)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="px-4 py-6 space-y-4 max-w-lg mx-auto">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="skeleton h-16 rounded-2xl" />
        ))}
      </div>
    )
  }

  return (
    <div className="px-4 py-6 max-w-lg mx-auto lg:px-6 lg:py-8">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)} className="btn-secondary p-2.5">
          <ArrowLeft size={18} />
        </button>
        <h1 className="text-xl font-bold text-white">{isEdit ? 'Edit Session' : 'Add Session'}</h1>
      </div>

      {isEdit && (
        <div className="card p-3 mb-4 flex items-center gap-2.5">
          <Info size={15} className="text-slate-400 shrink-0" />
          <p className="text-xs text-slate-400">
            Source: <span className="font-semibold text-slate-300">{source}</span>
            {' · '}Editing will mark this session as EDITED
          </p>
        </div>
      )}

      {conflict && (
        <div className="card border-amber-500/30 p-3 mb-4 flex items-center gap-2.5 bg-amber-500/5">
          <AlertTriangle size={15} className="text-amber-400 shrink-0" />
          <p className="text-xs text-amber-300">
            Warning: This session overlaps with an existing session. Please adjust the times.
          </p>
        </div>
      )}

      {error && !conflict && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 mb-4">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Start */}
        <div className="card p-4 space-y-4">
          <h2 className="text-sm font-semibold text-slate-300">Start</h2>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Date</label>
              <input
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="input"
                required
              />
            </div>
            <div>
              <label className="label">Time</label>
              <input
                type="time"
                value={startTime}
                onChange={e => setStartTime(e.target.value)}
                className="input"
                required
              />
            </div>
          </div>
        </div>

        {/* End */}
        <div className="card p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-300">End</h2>
            <label className="flex items-center gap-2 cursor-pointer">
              <span className="text-xs text-slate-500">Active session</span>
              <div
                onClick={() => setHasEnd(v => !v)}
                className={`w-10 h-6 rounded-full transition-colors duration-200 relative cursor-pointer ${hasEnd ? 'bg-slate-700' : 'bg-indigo-600'}`}
              >
                <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${hasEnd ? 'left-0.5' : 'left-4'}`} />
              </div>
            </label>
          </div>
          {hasEnd ? (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={e => setEndDate(e.target.value)}
                  className="input"
                  required={hasEnd}
                  min={startDate}
                />
              </div>
              <div>
                <label className="label">Time</label>
                <input
                  type="time"
                  value={endTime}
                  onChange={e => setEndTime(e.target.value)}
                  className="input"
                  required={hasEnd}
                />
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-500 italic">Session is currently active (no end time)</p>
          )}
        </div>

        {/* Details */}
        <div className="card p-4 space-y-4">
          <h2 className="text-sm font-semibold text-slate-300">Details</h2>
          <div>
            <label className="label">Location</label>
            <input
              type="text"
              value={location}
              onChange={e => setLocation(e.target.value)}
              placeholder="e.g. Office, Home"
              className="input"
            />
          </div>
          <div>
            <label className="label">Notes</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Any notes about this session…"
              rows={3}
              className="input resize-none"
            />
          </div>
        </div>

        {/* Breaks */}
        <div className="card p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-300">Breaks</h2>
            <button type="button" onClick={addBreak} className="flex items-center gap-1 text-indigo-400 hover:text-indigo-300 text-xs font-medium transition-colors">
              <Plus size={14} /> Add Break
            </button>
          </div>
          {breaks.length === 0 ? (
            <p className="text-sm text-slate-600 italic">No breaks added</p>
          ) : (
            breaks.map((brk, i) => (
              <div key={i} className="bg-slate-800/50 rounded-xl p-3 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-400">Break {i + 1}</span>
                  <button
                    type="button"
                    onClick={() => removeBreak(i)}
                    className="text-red-400 hover:text-red-300 p-1 transition-colors"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="label text-xs">Start</label>
                    <input
                      type="time"
                      value={brk.startTime}
                      onChange={e => updateBreak(i, 'startTime', e.target.value)}
                      className="input text-sm py-2"
                    />
                  </div>
                  <div>
                    <label className="label text-xs">End</label>
                    <input
                      type="time"
                      value={brk.endTime}
                      onChange={e => updateBreak(i, 'endTime', e.target.value)}
                      className="input text-sm py-2"
                    />
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <button
          type="submit"
          disabled={saving}
          className="btn-primary w-full text-base py-4"
        >
          {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Add Session'}
        </button>
      </form>
    </div>
  )
}
