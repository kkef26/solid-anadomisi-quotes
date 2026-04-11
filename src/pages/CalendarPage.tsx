import { useEffect, useState } from 'react'
import { Calendar, Plus } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { EmptyState } from '@/components/ui/EmptyState'
import type { Appointment } from '@/types'

export default function CalendarPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('ergo_appointments')
        .select('*, customer:ergo_customers(full_name)')
        .gte('scheduled_at', new Date(Date.now() - 7 * 86400000).toISOString())
        .order('scheduled_at')
      setAppointments((data || []) as unknown as Appointment[])
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return <div className="h-40 bg-brand-surface rounded-[6px] animate-pulse" />

  // Group by date
  const grouped = appointments.reduce<Record<string, Appointment[]>>((acc, a) => {
    const date = new Date(a.scheduled_at).toLocaleDateString('el-GR', { weekday: 'long', day: 'numeric', month: 'long' })
    if (!acc[date]) acc[date] = []
    acc[date].push(a)
    return acc
  }, {})

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-brand-text">Ημερολόγιο</h1>
        <Button size="sm"><Plus size={16} /> Νέο Ραντεβού</Button>
      </div>

      {appointments.length === 0 ? (
        <EmptyState icon={<Calendar size={32} />} title="Κανένα ραντεβού" description="Προγραμματίστε ένα ραντεβού με πελάτη." />
      ) : (
        <div className="space-y-4">
          {Object.entries(grouped).map(([date, appts]) => (
            <div key={date}>
              <h2 className="text-xs font-semibold text-brand-text-secondary uppercase tracking-wide mb-2">{date}</h2>
              <Card padding="none">
                <div className="divide-y divide-brand-border">
                  {appts.map(a => {
                    const customer = (a as any).customer as Record<string, string> | null
                    return (
                      <div key={a.id} className="px-4 py-3 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="text-center min-w-[50px]">
                            <p className="text-sm font-mono font-semibold text-brand-text">
                              {new Date(a.scheduled_at).toLocaleTimeString('el-GR', { hour: '2-digit', minute: '2-digit' })}
                            </p>
                            <p className="text-xs text-brand-text-secondary">{a.duration_minutes}λ</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-brand-text">{a.title}</p>
                            <p className="text-xs text-brand-text-secondary">{customer?.full_name || '—'} · {a.address || '—'}</p>
                          </div>
                        </div>
                        <StatusBadge status={a.status} />
                      </div>
                    )
                  })}
                </div>
              </Card>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
