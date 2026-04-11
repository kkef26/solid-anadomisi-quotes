import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Phone, Mail, MapPin, FileText, Briefcase, CreditCard } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Card, CardHeader } from '@/components/ui/Card'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { EmptyState } from '@/components/ui/EmptyState'
import type { Customer, Proposal, Job, Payment } from '@/types'
import { PAYMENT_TYPE_LABELS, METHOD_LABELS } from '@/types'

function fmt(n: number) {
  return '€' + n.toLocaleString('el-GR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function fmtDate(s: string | null) {
  if (!s) return '—'
  return new Date(s).toLocaleDateString('el-GR')
}

export default function CustomerDetail() {
  const { id } = useParams<{ id: string }>()
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [proposals, setProposals] = useState<Proposal[]>([])
  const [jobs, setJobs] = useState<Job[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    async function load() {
      const [custRes, propRes, jobRes, payRes] = await Promise.all([
        supabase.from('ergo_customers').select('*').eq('id', id).single(),
        supabase.from('ergo_proposals').select('*').eq('customer_id', id).is('deleted_at', null).order('created_at', { ascending: false }),
        supabase.from('ergo_jobs').select('*').eq('customer_id', id).order('created_at', { ascending: false }),
        supabase.from('ergo_payments').select('*').eq('related_type', 'customer').eq('related_id', id).order('paid_at', { ascending: false }),
      ])
      if (custRes.data) setCustomer(custRes.data as Customer)
      setProposals((propRes.data || []) as Proposal[])
      setJobs((jobRes.data || []) as Job[])
      setPayments((payRes.data || []) as Payment[])
      setLoading(false)
    }
    load()
  }, [id])

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 w-48 bg-brand-surface rounded-[6px]" />
        <div className="h-40 bg-brand-surface rounded-[6px]" />
      </div>
    )
  }

  if (!customer) {
    return (
      <div className="space-y-4">
        <Link to="/pelates" className="flex items-center gap-2 text-sm text-brand-text-secondary hover:text-brand-text">
          <ArrowLeft size={16} /> Πελάτες
        </Link>
        <EmptyState title="Ο πελάτης δεν βρέθηκε" description="Ελέγξτε τον σύνδεσμο ή επιστρέψτε στη λίστα πελατών." />
      </div>
    )
  }

  const totalQuoted = proposals.reduce((sum, p) => sum + (p.total || 0), 0)
  const totalPaid = payments.filter(p => p.direction === 'incoming').reduce((sum, p) => sum + p.amount, 0)

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Back */}
      <Link to="/pelates" className="flex items-center gap-2 text-sm text-brand-text-secondary hover:text-brand-text">
        <ArrowLeft size={16} /> Πελάτες
      </Link>

      {/* Customer Info Card */}
      <Card>
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold text-brand-text">{customer.full_name}</h1>
            {customer.company && (
              <p className="text-sm text-brand-text-secondary mt-0.5">{customer.company}</p>
            )}
            <div className="flex flex-wrap gap-4 mt-3">
              {customer.phone && (
                <a href={`tel:${customer.phone}`} className="flex items-center gap-1.5 text-sm text-brand-text-secondary hover:text-brand-primary">
                  <Phone size={14} /> {customer.phone}
                </a>
              )}
              {customer.email && (
                <a href={`mailto:${customer.email}`} className="flex items-center gap-1.5 text-sm text-brand-text-secondary hover:text-brand-primary">
                  <Mail size={14} /> {customer.email}
                </a>
              )}
              {(customer.address || customer.city) && (
                <span className="flex items-center gap-1.5 text-sm text-brand-text-secondary">
                  <MapPin size={14} /> {[customer.address, customer.city, customer.postal_code].filter(Boolean).join(', ')}
                </span>
              )}
            </div>
            {customer.vat_number && (
              <p className="text-xs text-brand-text-secondary mt-2">ΑΦΜ: <span className="font-mono">{customer.vat_number}</span></p>
            )}
          </div>
          <div className="flex gap-4 shrink-0">
            <div className="text-center">
              <p className="text-xs text-brand-text-secondary">Προσφορές</p>
              <p className="text-lg font-mono font-semibold text-brand-text">{fmt(totalQuoted)}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-brand-text-secondary">Πληρωμένα</p>
              <p className="text-lg font-mono font-semibold text-green-600">{fmt(totalPaid)}</p>
            </div>
          </div>
        </div>
        {customer.notes && (
          <p className="mt-4 pt-3 border-t border-brand-border text-sm text-brand-text-secondary">{customer.notes}</p>
        )}
        {customer.tags && customer.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-3">
            {customer.tags.map(t => (
              <span key={t} className="text-xs px-2 py-0.5 bg-brand-muted rounded-[4px] text-brand-text-secondary">{t}</span>
            ))}
          </div>
        )}
      </Card>

      {/* Proposals */}
      <Card padding="none">
        <div className="p-4 pb-2">
          <CardHeader title={`Προσφορές (${proposals.length})`} />
        </div>
        {proposals.length === 0 ? (
          <div className="px-4 pb-4">
            <EmptyState icon={<FileText size={24} />} title="Καμία προσφορά" description="Δεν υπάρχουν προσφορές για αυτόν τον πελάτη." />
          </div>
        ) : (
          <div className="divide-y divide-brand-border">
            {proposals.map(p => (
              <Link key={p.id} to={`/prosfores/${p.id}`} className="block px-4 py-3 hover:bg-brand-muted transition-colors">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-mono font-medium text-brand-text">{p.proposal_number || '#—'}</span>
                      <StatusBadge status={p.status} />
                    </div>
                    <p className="text-xs text-brand-text-secondary mt-0.5">
                      {p.entity || '—'} · {fmtDate(p.created_at)}
                    </p>
                  </div>
                  <span className="text-sm font-mono font-semibold">{p.total > 0 ? fmt(p.total) : '—'}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </Card>

      {/* Jobs */}
      <Card padding="none">
        <div className="p-4 pb-2">
          <CardHeader title={`Έργα (${jobs.length})`} />
        </div>
        {jobs.length === 0 ? (
          <div className="px-4 pb-4">
            <EmptyState icon={<Briefcase size={24} />} title="Κανένα έργο" description="Δεν υπάρχουν έργα για αυτόν τον πελάτη." />
          </div>
        ) : (
          <div className="divide-y divide-brand-border">
            {jobs.map(j => (
              <Link key={j.id} to={`/erga/${j.id}`} className="block px-4 py-3 hover:bg-brand-muted transition-colors">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-mono font-medium text-brand-text">{j.job_number || '#—'}</span>
                      <StatusBadge status={j.status} />
                    </div>
                    <p className="text-xs text-brand-text-secondary mt-0.5">{j.title || '—'} · {j.address || '—'}</p>
                  </div>
                  <span className="text-sm font-mono font-semibold">{j.budget > 0 ? fmt(j.budget) : '—'}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </Card>

      {/* Payments */}
      <Card padding="none">
        <div className="p-4 pb-2">
          <CardHeader title={`Πληρωμές (${payments.length})`} />
        </div>
        {payments.length === 0 ? (
          <div className="px-4 pb-4">
            <EmptyState icon={<CreditCard size={24} />} title="Καμία πληρωμή" description="Δεν υπάρχουν πληρωμές για αυτόν τον πελάτη." />
          </div>
        ) : (
          <div className="divide-y divide-brand-border">
            {payments.map(p => (
              <div key={p.id} className="px-4 py-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-brand-text">
                      {PAYMENT_TYPE_LABELS[p.payment_type] || p.payment_type}
                      {p.method && ` · ${METHOD_LABELS[p.method] || p.method}`}
                    </p>
                    <p className="text-xs text-brand-text-secondary mt-0.5">
                      {p.description || '—'} · {fmtDate(p.paid_at)}
                    </p>
                  </div>
                  <span className={`text-sm font-mono font-semibold ${p.direction === 'incoming' ? 'text-green-600' : 'text-red-600'}`}>
                    {p.direction === 'incoming' ? '+' : '−'}{fmt(p.amount)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
