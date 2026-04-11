import type { ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  className?: string
  padding?: 'none' | 'sm' | 'md'
}

export function Card({ children, className = '', padding = 'md' }: CardProps) {
  const pad = { none: '', sm: 'p-3', md: 'p-4 md:p-5' }[padding]

  return (
    <div className={`bg-brand-surface border border-brand-border rounded-[6px] ${pad} ${className}`}>
      {children}
    </div>
  )
}

interface CardHeaderProps {
  title: string
  action?: ReactNode
}

export function CardHeader({ title, action }: CardHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-3">
      <h3 className="text-sm font-semibold text-brand-text">{title}</h3>
      {action}
    </div>
  )
}
