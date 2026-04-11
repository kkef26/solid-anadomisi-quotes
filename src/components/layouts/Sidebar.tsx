import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  PhoneIncoming,
  Calendar,
  FileText,
  Briefcase,
  Users,
  HardHat,
  Settings,
  X,
} from 'lucide-react'
import { useAppStore } from '@/lib/store'

const NAV_ITEMS = [
  { to: '/', icon: LayoutDashboard, label: 'Πίνακας' },
  { to: '/aitimata', icon: PhoneIncoming, label: 'Αιτήματα' },
  { to: '/imerologio', icon: Calendar, label: 'Ημερολόγιο' },
  { to: '/prosfores', icon: FileText, label: 'Προσφορές' },
  { to: '/erga', icon: Briefcase, label: 'Έργα' },
  { to: '/pelates', icon: Users, label: 'Πελάτες' },
  { to: '/synergates', icon: HardHat, label: 'Συνεργάτες' },
  { to: '/rithmiseis', icon: Settings, label: 'Ρυθμίσεις' },
]

export function Sidebar() {
  const { sidebarOpen, setSidebarOpen } = useAppStore()

  return (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 z-50 h-full w-64 bg-brand-surface border-r border-brand-border
          transform transition-transform duration-200 ease-out
          md:static md:transform-none
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
      >
        {/* Brand */}
        <div className="flex items-center justify-between h-14 px-4 border-b border-brand-border">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-[6px] bg-brand-primary flex items-center justify-center">
              <span className="text-white text-sm font-semibold">Ε</span>
            </div>
            <span className="font-semibold text-brand-text text-[15px]">Εργοτάξια</span>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="md:hidden p-1 text-brand-text-secondary hover:text-brand-text"
          >
            <X size={20} />
          </button>
        </div>

        {/* Nav */}
        <nav className="p-2 flex flex-col gap-0.5">
          {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-[6px] text-[14px] font-medium transition-colors
                ${isActive
                  ? 'bg-brand-primary/10 text-brand-primary'
                  : 'text-brand-text-secondary hover:bg-brand-muted hover:text-brand-text'
                }`
              }
            >
              <Icon size={18} strokeWidth={1.8} />
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  )
}
