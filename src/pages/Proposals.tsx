import { useEffect, useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Search } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { EmptyState } from '@/components/ui/EmptyState'
import type { Proposal } from '@/types'

type StatusFilter = 'all' | 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired'

const FILTERS: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'Όλες' },
  { value: 'draft', label: 'Πρόχειρα' },
  { value: 'sent', label: 'Εστάλησαν' },
  { value: 'accepted', label: 'Εγκρίθηκαν' },
  { value: 'rejected', label: 'Απορρίφθηκαν' },
]

export default function Proposals() {
  const [proposals, setProposals] = useState<Proposal[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('ergo_proposals')
        .select('*, customer:ergo_customers(full_name, company, phone)')
        .is('deleted_at', null)
        .order('created_at', { ascending: false })

      setProposals((data || []) as unknown as Proposal[])
      setLoading(false)
    }
    load()
  }, [])

  const filtered = useMemo(() => {
    let result = proposals
    if (statusFilter !== 'all') {
      result = result.filter(p => p.status === statusFilter)
    }
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(p =>
        (p.proposal_number || '').toLowerCase().includes(q) ||
        ((p as any).customer as Record<string, string> | null)?.full_name?.toLowerCase().includes(q) ||
        (p.entity || '').toLowerCase().includes(q)
      )
    }
    return result
  }, [proposals, statusFilter, search])

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => <div key={i} className="h-16 bg-brand-surface rounded-[6px] animate-pulse" />)}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-brand-text">Προσφορές</h1>
        <Link to="/prosfores/nea">
          <Button size="sm">
            <Plus size={16} />
            Νέα Προσφορά
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-text-secondary" />
          <input
            type="text"
            placeholder="Αναζήτηση..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm bg-brand-surface border border-brand-border rounded-[6px] outline-none focus:border-brand-primary transition-colors"
          />
        </div>
        <div className="flex gap-1 overflow-x-auto">
          {FILTERS.map(f => (
            <button
              key={f.value}
              onClick={() => setStatusFilter(f.value)}
              className={`px-3 py-1.5 text-xs font-medium rounded-[4px] whitespace-nowrap transition-colors
                ${statusFilter === f.value
                  ? 'bg-brand-primary text-white'
                  : 'bg-brand-surface border border-brand-border text-brand-text-secondary hover:bg-brand-muted'
                }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <EmptyState
          title="Δεν βρέθηκαν προσφορές"
          description={search ? 'Δοκιμάστε διαφορετική αναζήτηση' : 'Δημιουργήστε την πρώτη προσφορά σας'}
        />
      ) : (
        <Card padding="none">
          <div className="divide-y divide-brand-border">
            {filtered.map((p) => {
              const customer = (p as any).customer as Record<string, string> | null
              return (
                <Link
                  key={p.id}
                  to={`/prosfores/${p.id}`}
                  className="block px-4 py-3 hover:bg-brand-muted transition-colors"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-mono font-medium text-brand-text">
                          {p.proposal_number || '#—'}
                        </span>
                        <StatusBadge status={p.status} />
                      </div>
                      <p className="text-sm text-brand-text-secondary truncate mt-0.5">
                        {customer?.full_name || 'Χωρίς πελάτη'}
                        {p.entity ? ` · ${p.entity}` : ''}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-mono font-semibold text-brand-text">
                        {p.total > 0 ? `€${p.total.toLocaleString('el-GR', { minimumFractionDigits: 2 })}` : '—'}
                      </p>
                      <p className="text-xs text-brand-text-secondary">
                        {new Date(p.created_at).toLocaleDateString('el-GR')}
                      </p>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        </Card>
      )}

      <p className="text-xs text-brand-text-secondary text-center">
        {filtered.length} από {proposals.length} προσφορές
      </p>
    </div>
  )
}
