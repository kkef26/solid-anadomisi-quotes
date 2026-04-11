import { useEffect, useState } from 'react'
import { HardHat, Plus } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import type { Worker } from '@/types'

export default function Workers() {
  const [workers, setWorkers] = useState<Worker[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('ergo_workers')
        .select('*')
        .is('deleted_at', null)
        .order('full_name')
      setWorkers((data || []) as Worker[])
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return <div className="h-40 bg-brand-surface rounded-[6px] animate-pulse" />

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-brand-text">Συνεργάτες</h1>
        <Button size="sm"><Plus size={16} /> Νέος Συνεργάτης</Button>
      </div>

      {workers.length === 0 ? (
        <EmptyState icon={<HardHat size={32} />} title="Κανένας συνεργάτης" description="Προσθέστε εργαζόμενους και υπεργολάβους." />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {workers.map(w => (
            <Card key={w.id}>
              <div className="flex items-start justify-between mb-2">
                <h3 className="text-sm font-semibold text-brand-text">{w.full_name}</h3>
                <span className="text-xs px-2 py-0.5 rounded-[4px] bg-gray-100 text-gray-600">
                  {w.worker_type === 'employee' ? 'Εργαζόμενος' : 'Υπεργολάβος'}
                </span>
              </div>
              {w.phone && <p className="text-xs text-brand-text-secondary">{w.phone}</p>}
              {w.specialties.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {w.specialties.map(s => (
                    <span key={s} className="text-xs px-1.5 py-0.5 bg-brand-muted rounded-[4px] text-brand-text-secondary">{s}</span>
                  ))}
                </div>
              )}
              {w.total_paid > 0 && (
                <div className="mt-2 pt-2 border-t border-brand-border flex justify-between">
                  <span className="text-xs text-brand-text-secondary">{w.job_count} έργα</span>
                  <span className="text-xs font-mono">€{w.total_paid.toLocaleString('el-GR')}</span>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
