import { useState, useEffect, useCallback } from 'react'
import { Download, Mail, ExternalLink, Calendar, TrendingUp, Clock } from 'lucide-react'
import { format } from 'date-fns'
import { api } from '../api'
import type { SummaryResponse, AppSettings } from '../types'
import { formatMinutes, getCurrentWeekRange, getLastWeekRange, getCurrentMonthRange, getLastMonthRange, toYMD, formatDate } from '../utils'

type Preset = 'this-week' | 'last-week' | 'this-month' | 'last-month' | 'custom'

const PRESETS: { id: Preset; label: string }[] = [
  { id: 'this-week', label: 'This Week' },
  { id: 'last-week', label: 'Last Week' },
  { id: 'this-month', label: 'This Month' },
  { id: 'last-month', label: 'Last Month' },
  { id: 'custom', label: 'Custom' },
]

function getRange(preset: Preset): { from: string; to: string } {
  switch (preset) {
    case 'this-week': return getCurrentWeekRange()
    case 'last-week': return getLastWeekRange()
    case 'this-month': return getCurrentMonthRange()
    case 'last-month': return getLastMonthRange()
    default: return getCurrentWeekRange()
  }
}

export default function Reports() {
  const [preset, setPreset] = useState<Preset>('this-week')
  const [from, setFrom] = useState(getCurrentWeekRange().from)
  const [to, setTo] = useState(getCurrentWeekRange().to)
  const [summary, setSummary] = useState<SummaryResponse | null>(null)
  const [settings, setSettings] = useState<AppSettings | null>(null)
  const [loading, setLoading] = useState(false)
  const [downloading, setDownloading] = useState(false)

  const loadSummary = useCallback(async () => {
    setLoading(true)
    try {
      const [sum, cfg] = await Promise.all([
        api.getSummary({ from, to }),
        api.getSettings(),
      ])
      setSummary(sum)
      setSettings(cfg)
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }, [from, to])

  useEffect(() => {
    loadSummary()
  }, [loadSummary])

  const handlePreset = (p: Preset) => {
    setPreset(p)
    if (p !== 'custom') {
      const range = getRange(p)
      setFrom(range.from)
      setTo(range.to)
    }
  }

  const handleDownloadCsv = async () => {
    setDownloading(true)
    try {
      const csv = await api.getReportCsv({ from, to })
      const blob = new Blob([csv], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `toil-report-${from}-${to}.csv`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      // ignore
    } finally {
      setDownloading(false)
    }
  }

  const handleOpenHtml = async () => {
    setDownloading(true)
    try {
      const html = await api.getReportHtml({ from, to })
      const blob = new Blob([html], { type: 'text/html' })
      const url = URL.createObjectURL(blob)
      window.open(url, '_blank')
    } catch {
      // ignore
    } finally {
      setDownloading(false)
    }
  }

  const handleEmail = () => {
    if (!settings || !summary) return
    const subject = settings.reportSubjectTemplate
      .replace('{from}', from)
      .replace('{to}', to)
      .replace('{date}', format(new Date(), 'yyyy-MM-dd'))

    const days = summary.days.filter(d => d.sessions.length > 0)
    const body = [
      `TOIL Report: ${from} to ${to}`,
      '',
      `Total Worked: ${formatMinutes(summary.totalWorkedMinutes)}`,
      `Total TOIL: ${formatMinutes(summary.totalTilMinutes)}`,
      '',
      'Daily breakdown:',
      ...days.map(d =>
        `  ${d.date}: ${formatMinutes(d.totalMinutes)} worked, ${d.tilMinutes >= 0 ? '+' : ''}${formatMinutes(d.tilMinutes)} TOIL`
      ),
      '',
      settings.reportFooter,
    ].join('\n')

    const emails = settings.reportRecipientEmails.join(',')
    window.location.href = `mailto:${emails}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
  }

  const activeDays = summary?.days.filter(d => d.sessions.length > 0) ?? []

  return (
    <div className="px-4 py-6 space-y-5 max-w-2xl mx-auto lg:px-6 lg:py-8">
      <h1 className="text-xl font-bold text-white">Reports</h1>

      {/* Preset selector */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-hide">
        {PRESETS.map(p => (
          <button
            key={p.id}
            onClick={() => handlePreset(p.id)}
            className={`shrink-0 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-150 ${
              preset === p.id
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Custom date range */}
      {preset === 'custom' && (
        <div className="card p-4 grid grid-cols-2 gap-3">
          <div>
            <label className="label">From</label>
            <input
              type="date"
              value={from}
              onChange={e => setFrom(e.target.value)}
              className="input"
            />
          </div>
          <div>
            <label className="label">To</label>
            <input
              type="date"
              value={to}
              onChange={e => setTo(e.target.value)}
              className="input"
              min={from}
            />
          </div>
        </div>
      )}

      {/* Summary totals */}
      <div className="grid grid-cols-3 gap-3">
        <div className="card p-3 text-center">
          <div className="w-8 h-8 bg-violet-500/10 rounded-lg flex items-center justify-center mx-auto mb-2">
            <Calendar size={15} className="text-violet-400" />
          </div>
          <p className="text-lg font-bold text-white">{activeDays.length}</p>
          <p className="text-xs text-slate-500">Days</p>
        </div>
        <div className="card p-3 text-center">
          <div className="w-8 h-8 bg-indigo-500/10 rounded-lg flex items-center justify-center mx-auto mb-2">
            <Clock size={15} className="text-indigo-400" />
          </div>
          <p className="text-lg font-bold text-white">
            {loading ? '—' : formatMinutes(summary?.totalWorkedMinutes ?? 0)}
          </p>
          <p className="text-xs text-slate-500">Worked</p>
        </div>
        <div className="card p-3 text-center">
          <div className="w-8 h-8 bg-green-500/10 rounded-lg flex items-center justify-center mx-auto mb-2">
            <TrendingUp size={15} className="text-green-400" />
          </div>
          <p className={`text-lg font-bold ${(summary?.totalTilMinutes ?? 0) >= 0 ? 'text-green-400' : 'text-amber-400'}`}>
            {loading ? '—' : `${(summary?.totalTilMinutes ?? 0) >= 0 ? '+' : ''}${formatMinutes(summary?.totalTilMinutes ?? 0)}`}
          </p>
          <p className="text-xs text-slate-500">TOIL</p>
        </div>
      </div>

      {/* Daily table */}
      <div className="card overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-800">
          <h2 className="text-sm font-semibold text-slate-300">Daily Breakdown</h2>
        </div>
        {loading ? (
          <div className="p-4 space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="skeleton h-10 rounded-lg" />
            ))}
          </div>
        ) : activeDays.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <p className="text-slate-600 text-sm">No data for this period</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-800">
            {activeDays.map(day => (
              <div key={day.date} className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-slate-300">{formatDate(day.date + 'T00:00:00')}</p>
                  <p className="text-xs text-slate-600">
                    {day.sessions.length} session{day.sessions.length !== 1 ? 's' : ''}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-white">{formatMinutes(day.totalMinutes)}</p>
                  <p className={`text-xs font-medium ${day.tilMinutes >= 0 ? 'text-green-400' : 'text-amber-400'}`}>
                    {day.tilMinutes >= 0 ? '+' : ''}{formatMinutes(day.tilMinutes)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="space-y-2.5">
        <button
          onClick={handleEmail}
          disabled={!summary || !settings}
          className="w-full flex items-center justify-center gap-2.5 card py-3.5 px-5 text-slate-300 hover:text-white hover:border-indigo-500/30 font-medium transition-all duration-150 disabled:opacity-40"
        >
          <Mail size={17} className="text-indigo-400" />
          Open in Email
        </button>

        <button
          onClick={handleDownloadCsv}
          disabled={downloading || !summary}
          className="w-full flex items-center justify-center gap-2.5 card py-3.5 px-5 text-slate-300 hover:text-white hover:border-indigo-500/30 font-medium transition-all duration-150 disabled:opacity-40"
        >
          <Download size={17} className="text-violet-400" />
          Download CSV
        </button>

        <button
          onClick={handleOpenHtml}
          disabled={downloading || !summary}
          className="w-full flex items-center justify-center gap-2.5 card py-3.5 px-5 text-slate-300 hover:text-white hover:border-indigo-500/30 font-medium transition-all duration-150 disabled:opacity-40"
        >
          <ExternalLink size={17} className="text-green-400" />
          Open HTML Report
        </button>
      </div>
    </div>
  )
}
