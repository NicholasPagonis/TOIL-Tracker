import { useState, useEffect } from 'react'
import { Save, Copy, Check, Eye, EyeOff, Smartphone, ChevronDown, ChevronUp, Database } from 'lucide-react'
import { api } from '../api'
import type { AppSettings, DbConfig } from '../types'

const ROUNDING_OPTIONS = [
  { value: 'NONE', label: 'No rounding' },
  { value: 'NEAREST_5', label: 'Nearest 5 min' },
  { value: 'NEAREST_10', label: 'Nearest 10 min' },
  { value: 'NEAREST_15', label: 'Nearest 15 min' },
]

export default function Settings() {
  const [settings, setSettings] = useState<AppSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [showShortcuts, setShowShortcuts] = useState(false)

  // Local form state
  const [standardHours, setStandardHours] = useState('7.6')
  const [roundingRule, setRoundingRule] = useState<AppSettings['roundingRule']>('NONE')
  const [allowNegative, setAllowNegative] = useState(false)
  const [recipientEmails, setRecipientEmails] = useState('')
  const [subjectTemplate, setSubjectTemplate] = useState('')
  const [reportFooter, setReportFooter] = useState('')

  // Database config state
  const [dbConfig, setDbConfig] = useState<DbConfig | null>(null)
  const [dbProvider, setDbProvider] = useState<'sqlite' | 'mysql'>('sqlite')
  const [dbHost, setDbHost] = useState('')
  const [dbPort, setDbPort] = useState('3306')
  const [dbName, setDbName] = useState('')
  const [dbUser, setDbUser] = useState('')
  const [dbPassword, setDbPassword] = useState('')
  const [showDbPassword, setShowDbPassword] = useState(false)
  const [dbSaving, setDbSaving] = useState(false)
  const [dbSaved, setDbSaved] = useState(false)
  const [dbError, setDbError] = useState<string | null>(null)
  const [dbRestartRequired, setDbRestartRequired] = useState(false)

  useEffect(() => {
    api.getSettings().then(s => {
      setSettings(s)
      setStandardHours((s.standardDailyMinutes / 60).toFixed(2).replace(/\.?0+$/, ''))
      setRoundingRule(s.roundingRule)
      setAllowNegative(s.allowNegativeTil)
      setRecipientEmails(s.reportRecipientEmails.join(', '))
      setSubjectTemplate(s.reportSubjectTemplate)
      setReportFooter(s.reportFooter)
      setLoading(false)
    }).catch(() => setLoading(false))

    api.getDbConfig().then(cfg => {
      setDbConfig(cfg)
      setDbProvider(cfg.provider === 'mysql' ? 'mysql' : 'sqlite')
      if (cfg.provider === 'mysql') {
        setDbHost(cfg.host ?? '')
        setDbPort(String(cfg.port ?? 3306))
        setDbName(cfg.database ?? '')
        setDbUser(cfg.user ?? '')
      }
    }).catch(() => { /* non-critical */ })
  }, [])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      const emails = recipientEmails
        .split(',')
        .map(e => e.trim())
        .filter(Boolean)
      await api.updateSettings({
        standardDailyMinutes: Math.round(parseFloat(standardHours) * 60),
        roundingRule,
        allowNegativeTil: allowNegative,
        reportRecipientEmails: emails,
        reportSubjectTemplate: subjectTemplate,
        reportFooter,
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const handleCopyApiKey = () => {
    if (!settings?.id) return
    // API key isn't exposed in settings response - show the settings ID as placeholder
    navigator.clipboard.writeText('[Set via API_KEY env variable]')
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDbSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setDbSaving(true)
    setDbError(null)
    setDbRestartRequired(false)
    try {
      let result
      if (dbProvider === 'sqlite') {
        result = await api.updateDbConfig({ provider: 'sqlite' })
      } else {
        result = await api.updateDbConfig({
          provider: 'mysql',
          host: dbHost,
          port: dbPort ? parseInt(dbPort, 10) : undefined,
          database: dbName,
          user: dbUser,
          password: dbPassword || undefined,
        })
      }
      setDbConfig(result.config)
      setDbSaved(true)
      setDbRestartRequired(true)
      setTimeout(() => setDbSaved(false), 2000)
    } catch (e) {
      setDbError(e instanceof Error ? e.message : 'Failed to save database configuration')
    } finally {
      setDbSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="px-4 py-6 space-y-4 max-w-lg mx-auto">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="skeleton h-16 rounded-2xl" />
        ))}
      </div>
    )
  }

  return (
    <div className="px-4 py-6 max-w-lg mx-auto lg:px-6 lg:py-8">
      <h1 className="text-xl font-bold text-white mb-6">Settings</h1>

      <form onSubmit={handleSave} className="space-y-5">
        {/* Work hours */}
        <div className="card p-4 space-y-4">
          <h2 className="text-sm font-semibold text-slate-300">Work Hours</h2>

          <div>
            <label className="label">Standard Daily Hours</label>
            <div className="relative">
              <input
                type="number"
                value={standardHours}
                onChange={e => setStandardHours(e.target.value)}
                step="0.25"
                min="1"
                max="24"
                className="input pr-16"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 text-sm">hours</span>
            </div>
            <p className="text-xs text-slate-600 mt-1">
              = {Math.round(parseFloat(standardHours || '0') * 60)} minutes per day
            </p>
          </div>

          <div>
            <label className="label">Rounding Rule</label>
            <select
              value={roundingRule}
              onChange={e => setRoundingRule(e.target.value as AppSettings['roundingRule'])}
              className="input bg-slate-800"
            >
              {ROUNDING_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-300">Allow Negative TOIL</p>
              <p className="text-xs text-slate-500 mt-0.5">Track deficit when working less than standard hours</p>
            </div>
            <button
              type="button"
              onClick={() => setAllowNegative(v => !v)}
              className={`w-12 h-7 rounded-full transition-colors duration-200 relative ${allowNegative ? 'bg-indigo-600' : 'bg-slate-700'}`}
            >
              <span className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform duration-200 ${allowNegative ? 'left-5' : 'left-0.5'}`} />
            </button>
          </div>
        </div>

        {/* Report settings */}
        <div className="card p-4 space-y-4">
          <h2 className="text-sm font-semibold text-slate-300">Report Settings</h2>

          <div>
            <label className="label">Recipient Emails</label>
            <input
              type="text"
              value={recipientEmails}
              onChange={e => setRecipientEmails(e.target.value)}
              placeholder="email@example.com, another@example.com"
              className="input"
            />
            <p className="text-xs text-slate-600 mt-1">Comma-separated email addresses</p>
          </div>

          <div>
            <label className="label">Subject Template</label>
            <input
              type="text"
              value={subjectTemplate}
              onChange={e => setSubjectTemplate(e.target.value)}
              placeholder="TOIL Report {from} to {to}"
              className="input"
            />
            <p className="text-xs text-slate-600 mt-1">Variables: {'{from}'}, {'{to}'}, {'{date}'}</p>
          </div>

          <div>
            <label className="label">Report Footer</label>
            <textarea
              value={reportFooter}
              onChange={e => setReportFooter(e.target.value)}
              placeholder="Generated by TOIL Tracker"
              rows={2}
              className="input resize-none"
            />
          </div>
        </div>

        {/* API Key */}
        <div className="card p-4 space-y-3">
          <h2 className="text-sm font-semibold text-slate-300">API Access</h2>
          <p className="text-xs text-slate-500">
            The API key is set via the <code className="bg-slate-800 px-1.5 py-0.5 rounded text-slate-300">API_KEY</code> environment variable on the server.
          </p>
          <button
            type="button"
            onClick={handleCopyApiKey}
            className="flex items-center gap-2 btn-secondary text-sm py-2.5"
          >
            {copied ? <Check size={15} className="text-green-400" /> : <Copy size={15} />}
            {copied ? 'Copied!' : 'Copy API Key Info'}
          </button>
        </div>

        {/* iOS Shortcuts */}
        <div className="card overflow-hidden">
          <button
            type="button"
            onClick={() => setShowShortcuts(v => !v)}
            className="w-full flex items-center justify-between px-4 py-4 hover:bg-slate-800/30 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-slate-800 rounded-lg flex items-center justify-center">
                <Smartphone size={16} className="text-slate-400" />
              </div>
              <span className="text-sm font-semibold text-slate-300">iOS Shortcuts Guide</span>
            </div>
            {showShortcuts ? <ChevronUp size={16} className="text-slate-500" /> : <ChevronDown size={16} className="text-slate-500" />}
          </button>

          {showShortcuts && (
            <div className="px-4 pb-4 space-y-4 border-t border-slate-800 pt-4">
              <p className="text-xs text-slate-400 leading-relaxed">
                Use Apple Shortcuts to clock in/out automatically with your iPhone. The app exposes a REST API compatible with iOS Shortcuts' <strong className="text-slate-300">Get Contents of URL</strong> action.
              </p>

              <div className="space-y-3">
                <div className="bg-slate-800/50 rounded-xl p-3">
                  <p className="text-xs font-semibold text-indigo-400 mb-1">Clock In Shortcut</p>
                  <p className="text-xs text-slate-400">Method: <code className="text-slate-300">POST</code></p>
                  <p className="text-xs text-slate-400">URL: <code className="text-slate-300">http://YOUR_SERVER/api/sessions/clock-in</code></p>
                  <p className="text-xs text-slate-400 mt-1">Headers: <code className="text-slate-300">X-API-KEY: your-key</code></p>
                  <p className="text-xs text-slate-400">Body: <code className="text-slate-300">{'{}'}</code> (empty JSON)</p>
                </div>

                <div className="bg-slate-800/50 rounded-xl p-3">
                  <p className="text-xs font-semibold text-red-400 mb-1">Clock Out Shortcut</p>
                  <p className="text-xs text-slate-400">Method: <code className="text-slate-300">POST</code></p>
                  <p className="text-xs text-slate-400">URL: <code className="text-slate-300">http://YOUR_SERVER/api/sessions/clock-out</code></p>
                  <p className="text-xs text-slate-400 mt-1">Headers: <code className="text-slate-300">X-API-KEY: your-key</code></p>
                  <p className="text-xs text-slate-400">Body: <code className="text-slate-300">{'{}'}</code> (empty JSON)</p>
                </div>

                <div className="bg-slate-800/50 rounded-xl p-3">
                  <p className="text-xs font-semibold text-slate-300 mb-1">Tips</p>
                  <ul className="text-xs text-slate-400 space-y-1 list-disc list-inside">
                    <li>Add to your Home Screen for one-tap access</li>
                    <li>Use Automation to trigger on WiFi network connect/disconnect</li>
                    <li>Include GPS location using the <em>Get Current Location</em> action</li>
                    <li>Pass <code className="text-slate-300">latitude</code> &amp; <code className="text-slate-300">longitude</code> in the JSON body</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={saving}
          className="btn-primary w-full text-base py-4 flex items-center justify-center gap-2"
        >
          {saved ? (
            <>
              <Check size={18} />
              Saved!
            </>
          ) : (
            <>
              <Save size={18} />
              {saving ? 'Saving…' : 'Save Settings'}
            </>
          )}
        </button>
      </form>

      {/* Database Configuration */}
      <form onSubmit={handleDbSave} className="space-y-5 mt-5">
        <div className="card p-4 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-slate-800 rounded-lg flex items-center justify-center">
              <Database size={16} className="text-slate-400" />
            </div>
            <h2 className="text-sm font-semibold text-slate-300">Database Configuration</h2>
          </div>

          {dbConfig && (
            <div className="bg-slate-800/50 rounded-xl px-3 py-2">
              <p className="text-xs text-slate-400">
                Current provider:{' '}
                <span className="text-slate-200 font-medium">{dbConfig.provider.toUpperCase()}</span>
                {dbConfig.provider === 'mysql' && dbConfig.host && (
                  <>{' \u2014 '}<span className="text-slate-300">{dbConfig.host}:{dbConfig.port ?? 3306}/{dbConfig.database}</span></>
                )}
                {dbConfig.provider === 'sqlite' && dbConfig.file && (
                  <>{' \u2014 '}<span className="text-slate-300">{dbConfig.file}</span></>
                )}
              </p>
            </div>
          )}

          <div>
            <label className="label">Database Provider</label>
            <select
              value={dbProvider}
              onChange={e => setDbProvider(e.target.value as 'sqlite' | 'mysql')}
              className="input bg-slate-800"
            >
              <option value="sqlite">SQLite (local file)</option>
              <option value="mysql">MySQL</option>
            </select>
          </div>

          {dbProvider === 'mysql' && (
            <>
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="label">Host</label>
                  <input
                    type="text"
                    value={dbHost}
                    onChange={e => setDbHost(e.target.value)}
                    placeholder="localhost"
                    className="input"
                    required
                  />
                </div>
                <div>
                  <label className="label">Port</label>
                  <input
                    type="number"
                    value={dbPort}
                    onChange={e => setDbPort(e.target.value)}
                    placeholder="3306"
                    min="1"
                    max="65535"
                    className="input"
                  />
                </div>
              </div>

              <div>
                <label className="label">Database Name</label>
                <input
                  type="text"
                  value={dbName}
                  onChange={e => setDbName(e.target.value)}
                  placeholder="toil_tracker"
                  className="input"
                  required
                />
              </div>

              <div>
                <label className="label">Username</label>
                <input
                  type="text"
                  value={dbUser}
                  onChange={e => setDbUser(e.target.value)}
                  placeholder="root"
                  className="input"
                  required
                  autoComplete="username"
                />
              </div>

              <div>
                <label className="label">Password</label>
                <div className="relative">
                  <input
                    type={showDbPassword ? 'text' : 'password'}
                    value={dbPassword}
                    onChange={e => setDbPassword(e.target.value)}
                    placeholder={dbConfig?.hasPassword ? '(unchanged)' : 'Enter password'}
                    className="input pr-12"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowDbPassword(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    {showDbPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            </>
          )}

          {dbError && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
              <p className="text-red-400 text-sm">{dbError}</p>
            </div>
          )}

          {dbRestartRequired && (
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3">
              <p className="text-amber-400 text-sm font-medium">Server restart required</p>
              <p className="text-amber-400/80 text-xs mt-0.5">
                The new database configuration has been saved to the server's <code className="bg-amber-900/30 px-1 rounded">.env</code> file.
                Restart the server to connect with the new settings.
                {dbProvider === 'mysql' && ' You may also need to run database migrations.'}
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={dbSaving}
            className="btn-primary w-full text-sm py-3 flex items-center justify-center gap-2"
          >
            {dbSaved ? (
              <>
                <Check size={16} />
                Saved!
              </>
            ) : (
              <>
                <Save size={16} />
                {dbSaving ? 'Saving…' : 'Save Database Config'}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
