import { Menu, Bell } from 'lucide-react'
import { useAppStore } from '@/lib/store'

export function Header() {
  const { user, toggleSidebar } = useAppStore()

  return (
    <header className="h-14 bg-brand-surface border-b border-brand-border flex items-center justify-between px-4 shrink-0">
      <button
        onClick={toggleSidebar}
        className="md:hidden p-2 -ml-2 text-brand-text-secondary hover:text-brand-text"
      >
        <Menu size={20} />
      </button>

      <div className="hidden md:block" />

      <div className="flex items-center gap-3">
        <button className="p-2 text-brand-text-secondary hover:text-brand-text relative">
          <Bell size={18} />
        </button>
        {user && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-brand-primary/10 flex items-center justify-center">
              <span className="text-brand-primary text-xs font-semibold">
                {user.full_name.charAt(0).toUpperCase()}
              </span>
            </div>
            <span className="hidden sm:block text-sm text-brand-text-secondary">
              {user.full_name}
            </span>
          </div>
        )}
      </div>
    </header>
  )
}
