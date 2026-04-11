import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  ArrowLeft, Send, CheckCircle, XCircle, Briefcase, Printer, FileEdit
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Card, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { StatusBadge } from '@/components/ui/StatusBadge'
import type { Proposal, ProposalItem } from '@/types'

function fmt(n: number) {
  return n.toLocaleString('el-GR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

const UNIT_LABELS: Record<string, string> = {
  m: 'τ.μ.', m2: 'τ.μ.', m3: 'κ.μ.', kg: 'κιλά',
  piece: 'τεμ.', hour: 'ώρα', day: 'ημέρα', lump: 'κατ.αποκ.'
}

export default function ProposalDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [proposal, setProposal] = useState<Proposal | null>(null)
  const [items, setItems] = useState<ProposalItem[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    if (!id) return
    async function load() {
      const { data: p } = await supabase
        .from('ergo_proposals')
        .select('*, customer:ergo_customers(id, full_name, company, phone, email, address, vat_number)')
        .eq('id', id)
        .single()

      const { data: its } = await supabase
        .from('ergo_proposal_items')
        .select('*')
        .eq('proposal_id', id)
        .order('sort_order', { ascending: true })

      setProposal(p as unknown as Proposal)
      setItems((its || []) as unknown as ProposalItem[])
      setLoading(false)
    }
    load()
  }, [id])

  async function updateStatus(status: Proposal['status'], extra?: Record<string, unknown>) {
    if (!proposal) return
    setActionLoading(true)
    const update: Record<string, unknown> = { status, ...extra }
    if (status === 'sent') update.sent_at = new Date().toISOString()
    if (status === 'accepted') update.accepted_at = new Date().toISOString()
    if (status === 'rejected') update.rejected_at = new Date().toISOString()

    const { data } = await supabase
      .from('ergo_proposals')
      .update(update)
      .eq('id', proposal.id)
      .select('*, customer:ergo_customers(id, full_name, company, phone, email, address, vat_number)')
      .single()

    if (data) setProposal(data as unknown as Proposal)
    setActionLoading(false)
  }

  async function convertToJob() {
    if (!proposal) return
    setActionLoading(true)
    // Create job from proposal
    const { data: job } = await supabase
      .from('ergo_jobs')
      .insert({
        org_id: proposal.org_id,
        customer_id: proposal.customer_id,
        proposal_id: proposal.id,
        title: proposal.entity || `Έργο από ${(proposal.customer as any)?.full_name || 'άγνωστο πελάτη'}`,
        status: 'setup',
        budget: proposal.total,
      })
      .select()
      .single()

    if (job) {
      navigate(`/erga/${job.id}`)
    }
    setActionLoading(false)
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 bg-brand-surface rounded-[6px] animate-pulse" />
        <div className="h-32 bg-brand-surface rounded-[6px] animate-pulse" />
        <div className="h-64 bg-brand-surface rounded-[6px] animate-pulse" />
      </div>
    )
  }

  if (!proposal) {
    return (
      <div className="text-center py-16">
        <p className="text-brand-text-secondary">Η προσφορά δεν βρέθηκε.</p>
        <Link to="/prosfores" className="text-brand-primary text-sm mt-2 inline-block">← Πίσω</Link>
      </div>
    )
  }

  const customer = proposal.customer as any
  const groupedItems = items.reduce<Record<string, ProposalItem[]>>((acc, item) => {
    const cat = item.category || 'Γενικά'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(item)
    return acc
  }, {})

  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      {/* Back + actions bar */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <Link
          to="/prosfores"
          className="flex items-center gap-1.5 text-sm text-brand-text-secondary hover:text-brand-text transition-colors"
        >
          <ArrowLeft size={16} />
          Προσφορές
        </Link>
        <div className="flex items-center gap-2 flex-wrap">
          {proposal.status === 'draft' && (
            <>
              <Link to={`/prosfores/${id}/edit`}>
                <Button variant="secondary" size="sm">
                  <FileEdit size={14} />
                  Επεξεργασία
                </Button>
              </Link>
              <Button
                size="sm"
                loading={actionLoading}
                onClick={() => updateStatus('sent', { sent_via: 'hand' })}
              >
                <Send size={14} />
                Στείλε
              </Button>
            </>
          )}
          {proposal.status === 'sent' && (
            <>
              <Button
                variant="secondary"
                size="sm"
                loading={actionLoading}
                onClick={() => updateStatus('rejected')}
              >
                <XCircle size={14} />
                Απόρριψη
              </Button>
              <Button
                size="sm"
                loading={actionLoading}
                onClick={() => updateStatus('accepted')}
              >
                <CheckCircle size={14} />
                Έγκριση
              </Button>
            </>
          )}
          {proposal.status === 'accepted' && (
            <Button size="sm" loading={actionLoading} onClick={convertToJob}>
              <Briefcase size={14} />
              Μετατροπή σε Έργο
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={() => window.print()}>
            <Printer size={14} />
            Εκτύπωση
          </Button>
        </div>
      </div>

      {/* Header card */}
      <Card>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <span className="font-mono text-xl font-semibold text-brand-text">
                {proposal.proposal_number || '#—'}
              </span>
              <StatusBadge status={proposal.status} size="md" />
            </div>
            {proposal.entity && (
              <p className="text-brand-text-secondary text-sm">{proposal.entity}</p>
            )}
          </div>
          <div className="text-right space-y-0.5">
            <p className="font-mono text-2xl font-bold text-brand-text">
              €{fmt(proposal.total)}
            </p>
            <p className="text-xs text-brand-text-secondary">
              συμπ. ΦΠΑ {proposal.vat_pct}%
            </p>
          </div>
        </div>

        {/* Customer + meta row */}
        <div className="mt-4 pt-4 border-t border-brand-border grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {customer && (
            <div>
              <p className="text-xs text-brand-text-secondary mb-1">Πελάτης</p>
              <p className="text-sm font-medium text-brand-text">{customer.full_name}</p>
              {customer.company && <p className="text-xs text-brand-text-secondary">{customer.company}</p>}
              {customer.phone && <p className="text-xs text-brand-text-secondary">{customer.phone}</p>}
              {customer.vat_number && <p className="text-xs text-brand-text-secondary">ΑΦΜ: {customer.vat_number}</p>}
            </div>
          )}
          <div>
            <p className="text-xs text-brand-text-secondary mb-1">Ημερομηνίες</p>
            <p className="text-xs text-brand-text">
              Δημιουργία: {new Date(proposal.created_at).toLocaleDateString('el-GR')}
            </p>
            {proposal.valid_until && (
              <p className="text-xs text-brand-text">
                Ισχύει έως: {new Date(proposal.valid_until).toLocaleDateString('el-GR')}
              </p>
            )}
            {proposal.sent_at && (
              <p className="text-xs text-brand-text">
                Εστάλη: {new Date(proposal.sent_at).toLocaleDateString('el-GR')}
              </p>
            )}
            {proposal.accepted_at && (
              <p className="text-xs text-brand-text">
                Εγκρίθηκε: {new Date(proposal.accepted_at).toLocaleDateString('el-GR')}
              </p>
            )}
          </div>
          {proposal.payment_terms && (
            <div>
              <p className="text-xs text-brand-text-secondary mb-1">Όροι πληρωμής</p>
              <p className="text-xs text-brand-text">{proposal.payment_terms}</p>
            </div>
          )}
        </div>
      </Card>

      {/* Line items */}
      <Card padding="none">
        <div className="px-4 py-3 border-b border-brand-border">
          <h2 className="text-sm font-semibold text-brand-text">Στοιχεία Προσφοράς</h2>
        </div>

        {items.length === 0 ? (
          <p className="px-4 py-6 text-sm text-brand-text-secondary text-center">
            Δεν υπάρχουν στοιχεία
          </p>
        ) : (
          <div>
            {/* Table header */}
            <div className="hidden sm:grid grid-cols-[2fr_1fr_80px_100px_100px_100px] gap-2 px-4 py-2 bg-brand-muted border-b border-brand-border text-xs font-medium text-brand-text-secondary uppercase tracking-wide">
              <span>Περιγραφή</span>
              <span>Κατηγορία</span>
              <span className="text-right">Μον.</span>
              <span className="text-right">Ποσ.</span>
              <span className="text-right">Τιμή/μον.</span>
              <span className="text-right">Σύνολο</span>
            </div>

            {Object.entries(groupedItems).map(([cat, catItems]) => (
              <div key={cat}>
                <div className="px-4 py-1.5 bg-brand-muted/50 border-b border-brand-border">
                  <span className="text-xs font-semibold text-brand-primary uppercase tracking-wide">{cat}</span>
                </div>
                {catItems.map((item) => (
                  <div
                    key={item.id}
                    className="grid grid-cols-1 sm:grid-cols-[2fr_1fr_80px_100px_100px_100px] gap-1 sm:gap-2 px-4 py-2.5 border-b border-brand-border last:border-b-0 hover:bg-brand-muted/30 transition-colors"
                  >
                    <div>
                      <p className="text-sm text-brand-text">{item.description || '—'}</p>
                      {item.notes && <p className="text-xs text-brand-text-secondary mt-0.5">{item.notes}</p>}
                      {item.is_additional && (
                        <span className="inline-block mt-0.5 text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">
                          Επιπλέον
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-brand-text-secondary sm:self-center">
                      <span className="sm:hidden font-medium">Κατ.: </span>
                      {item.category || '—'}
                    </p>
                    <p className="text-sm text-brand-text-secondary sm:text-right sm:self-center">
                      <span className="sm:hidden font-medium">Μον.: </span>
                      {UNIT_LABELS[item.unit || ''] || item.unit || '—'}
                    </p>
                    <p className="font-mono text-sm text-brand-text sm:text-right sm:self-center">
                      <span className="sm:hidden font-medium text-brand-text-secondary font-sans">Ποσ.: </span>
                      {fmt(item.quantity)}
                    </p>
                    <p className="font-mono text-sm text-brand-text sm:text-right sm:self-center">
                      <span className="sm:hidden font-medium text-brand-text-secondary font-sans">Τιμή: </span>
                      €{fmt(item.unit_price)}
                    </p>
                    <p className="font-mono text-sm font-semibold text-brand-text sm:text-right sm:self-center">
                      <span className="sm:hidden font-medium text-brand-text-secondary font-sans">Σύν.: </span>
                      €{fmt(item.total)}
                    </p>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}

        {/* Totals */}
        <div className="border-t border-brand-border px-4 py-4 space-y-1.5 flex flex-col items-end">
          <div className="flex items-center gap-8 text-sm">
            <span className="text-brand-text-secondary">Υποσύνολο</span>
            <span className="font-mono font-medium text-brand-text w-32 text-right">€{fmt(proposal.subtotal)}</span>
          </div>
          <div className="flex items-center gap-8 text-sm">
            <span className="text-brand-text-secondary">ΦΠΑ {proposal.vat_pct}%</span>
            <span className="font-mono font-medium text-brand-text w-32 text-right">€{fmt(proposal.vat_amount)}</span>
          </div>
          <div className="flex items-center gap-8 pt-2 border-t border-brand-border mt-1">
            <span className="text-sm font-semibold text-brand-text">Σύνολο</span>
            <span className="font-mono text-lg font-bold text-brand-primary w-32 text-right">€{fmt(proposal.total)}</span>
          </div>
        </div>
      </Card>

      {/* Notes */}
      {(proposal.notes || proposal.internal_notes) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {proposal.notes && (
            <Card>
              <CardHeader title="Σημειώσεις" />
              <p className="text-sm text-brand-text whitespace-pre-line mt-3">{proposal.notes}</p>
            </Card>
          )}
          {proposal.internal_notes && (
            <Card>
              <CardHeader title="Εσωτερικές σημειώσεις" />
              <p className="text-sm text-brand-text-secondary whitespace-pre-line mt-3">{proposal.internal_notes}</p>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}
