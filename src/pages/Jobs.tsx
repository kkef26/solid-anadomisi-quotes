import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Briefcase } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Card } from '@/components/ui/Card'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { EmptyState } from '@/components/ui/EmptyState'
import type { Job } from '@/types'

export default function Jobs() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('ergo_jobs')
        .select('*, customer:ergo_customers(full_name)')
        .order('created_at', { ascending: false })
      setJobs((data || []) as unknown as Job[])
      setLoading(false)
    }
    load()
  }, [])

  if (loading) {
    return <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="h-20 bg-brand-surface rounded-[6px] animate-pulse" />)}</div>
  }

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold text-brand-text">Έργα</h1>

      {jobs.length === 0 ? (
        <EmptyState
          icon={<Briefcase size={32} />}
          title="Κανένα έργο"
          description="Τα έργα δημιουργούνται αυτόματα όταν μια προσφορά εγκριθεί."
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {jobs.map((j) => {
            const customer = (j as any).customer as Record<string, string> | null
            return (
              <Link key={j.id} to={`/erga/${j.id}`}>
                <Card className="hover:border-brand-primary/30 transition-colors h-full">
                  <div className="flex items-start justify-between mb-2">
                    <span className="text-xs font-mono text-brand-text-secondary">{j.job_number || '#—'}</span>
                    <StatusBadge status={j.status} />
                  </div>
                  <h3 className="text-sm font-semibold text-brand-text mb-1">{j.title || 'Χωρίς τίτλο'}</h3>
                  <p className="text-xs text-brand-text-secondary">{customer?.full_name || '—'}</p>
                  {j.address && <p className="text-xs text-brand-text-secondary mt-1">{j.address}</p>}
                  {j.budget > 0 && (
                    <div className="mt-3 pt-2 border-t border-brand-border flex justify-between">
                      <span className="text-xs text-brand-text-secondary">Προϋπολογισμός</span>
                      <span className="text-xs font-mono font-semibold">€{j.budget.toLocaleString('el-GR')}</span>
                    </div>
                  )}
                </Card>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
