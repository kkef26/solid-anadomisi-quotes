import { STATUS_LABELS } from '@/types'

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-600',
  pending: 'bg-amber-50 text-amber-700',
  confirmed: 'bg-blue-50 text-blue-700',
  sent: 'bg-blue-50 text-blue-700',
  accepted: 'bg-green-50 text-green-700',
  rejected: 'bg-red-50 text-red-600',
  expired: 'bg-gray-100 text-gray-500',
  setup: 'bg-amber-50 text-amber-700',
  active: 'bg-green-50 text-green-700',
  in_progress: 'bg-blue-50 text-blue-700',
  paused: 'bg-orange-50 text-orange-600',
  completed: 'bg-blue-50 text-blue-700',
  cancelled: 'bg-red-50 text-red-600',
  assigned: 'bg-purple-50 text-purple-700',
  disputed: 'bg-red-50 text-red-600',
  reviewed: 'bg-teal-50 text-teal-700',
  converted: 'bg-green-50 text-green-700',
}

interface StatusBadgeProps {
  status: string
  size?: 'sm' | 'md'
}

export function StatusBadge({ status, size = 'sm' }: StatusBadgeProps) {
  const color = STATUS_COLORS[status] || 'bg-gray-100 text-gray-600'
  const label = STATUS_LABELS[status] || status

  return (
    <span
      className={`
        inline-flex items-center rounded-[4px] font-medium
        ${color}
        ${size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-sm'}
      `}
    >
      {label}
    </span>
  )
}
