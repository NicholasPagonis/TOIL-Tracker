import { Outlet, NavLink, useLocation } from 'react-router-dom'
import { Home, Calendar, Plus, BarChart2, Settings } from 'lucide-react'
import { format } from 'date-fns'

const navItems = [
  { to: '/', icon: Home, label: 'Dashboard' },
  { to: '/log', icon: Calendar, label: 'Log' },
  { to: '/add', icon: Plus, label: 'Add' },
  { to: '/reports', icon: BarChart2, label: 'Reports' },
  { to: '/settings', icon: Settings, label: 'Settings' },
]

export default function Layout() {
  const location = useLocation()

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-slate-950">
      {/* Sidebar - desktop */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 bg-slate-900 border-r border-slate-800">
        <div className="flex items-center gap-3 px-6 py-6 border-b border-slate-800">
          <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center">
            <svg viewBox="0 0 24 24" className="w-5 h-5 text-white fill-none stroke-current stroke-2">
              <circle cx="12" cy="12" r="9" />
              <polyline points="12 7 12 12 15 15" />
            </svg>
          </div>
          <div>
            <h1 className="font-bold text-white text-base leading-tight">TOIL Tracker</h1>
            <p className="text-xs text-slate-500">{format(new Date(), 'EEE d MMM')}</p>
          </div>
        </div>
        <nav className="flex-1 px-4 py-4 space-y-1">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-all duration-150 ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="px-6 py-4 border-t border-slate-800">
          <p className="text-xs text-slate-600">v1.0.0</p>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        {/* Mobile header */}
        <header className="lg:hidden sticky top-0 z-30 bg-slate-950/95 backdrop-blur-sm border-b border-slate-800/50">
          <div className="flex items-center justify-between px-4 py-3 pt-safe">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                <svg viewBox="0 0 24 24" className="w-4 h-4 text-white fill-none stroke-current stroke-2">
                  <circle cx="12" cy="12" r="9" />
                  <polyline points="12 7 12 12 15 15" />
                </svg>
              </div>
              <h1 className="font-bold text-white text-lg">TOIL Tracker</h1>
            </div>
            <span className="text-sm text-slate-400">{format(new Date(), 'EEE d MMM')}</span>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto pb-24 lg:pb-8">
          <Outlet />
        </main>

        {/* Bottom nav - mobile */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-slate-900/95 backdrop-blur-sm border-t border-slate-800">
          <div className="flex items-center justify-around px-2 pb-safe">
            {navItems.map(({ to, icon: Icon, label }) => {
              const isActive =
                to === '/'
                  ? location.pathname === '/'
                  : location.pathname.startsWith(to)

              return (
                <NavLink
                  key={to}
                  to={to}
                  className="flex flex-col items-center gap-0.5 pt-2 pb-1 px-3 min-w-[56px]"
                >
                  <div
                    className={`p-1.5 rounded-xl transition-all duration-150 ${
                      isActive ? 'bg-indigo-600' : ''
                    }`}
                  >
                    <Icon
                      size={20}
                      className={isActive ? 'text-white' : 'text-slate-500'}
                    />
                  </div>
                  <span
                    className={`text-[10px] font-medium transition-colors duration-150 ${
                      isActive ? 'text-indigo-400' : 'text-slate-600'
                    }`}
                  >
                    {label}
                  </span>
                </NavLink>
              )
            })}
          </div>
        </nav>
      </div>
    </div>
  )
}
