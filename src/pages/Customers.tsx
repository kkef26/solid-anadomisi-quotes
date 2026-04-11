import { useEffect, useState, useMemo } from 'react'
import { Search, Users, Plus } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import type { Customer } from '@/types'

export default function Customers() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('ergo_customers')
        .select('*')
        .is('deleted_at', null)
        .order('full_name')
      setCustomers((data || []) as Customer[])
      setLoading(false)
    }
    load()
  }, [])

  const filtered = useMemo(() => {
    if (!search.trim()) return customers
    const q = search.toLowerCase()
    return customers.filter(c =>
      c.full_name.toLowerCase().includes(q) ||
      (c.company || '').toLowerCase().includes(q) ||
      (c.phone || '').includes(q) ||
      (c.address || '').toLowerCase().includes(q)
    )
  }, [customers, search])

  if (loading) {
    return <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="h-14 bg-brand-surface rounded-[6px] animate-pulse" />)}</div>
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-brand-text">Πελάτες</h1>
        <Button size="sm"><Plus size={16} /> Νέος Πελάτης</Button>
      </div>

      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-text-secondary" />
        <input
          type="text"
          placeholder="Αναζήτηση πελάτη..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-3 py-2 text-sm bg-brand-surface border border-brand-border rounded-[6px] outline-none focus:border-brand-primary transition-colors"
        />
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={<Users size={32} />} title="Δεν βρέθηκαν πελάτες" />
      ) : (
        <Card padding="none">
          <div className="divide-y divide-brand-border">
            {filtered.map((c) => (
              <div key={c.id} className="px-4 py-3 hover:bg-brand-muted transition-colors">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-brand-text">{c.full_name}</p>
                    <p className="text-xs text-brand-text-secondary">
                      {[c.company, c.phone, c.city].filter(Boolean).join(' · ') || '—'}
                    </p>
                  </div>
                  <div className="text-right">
                    {c.job_count > 0 && (
                      <p className="text-xs text-brand-text-secondary">{c.job_count} έργα</p>
                    )}
                    {c.total_paid > 0 && (
                      <p className="text-xs font-mono font-medium text-green-600">€{c.total_paid.toLocaleString('el-GR')}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      <p className="text-xs text-brand-text-secondary text-center">{filtered.length} πελάτες</p>
    </div>
  )
}
