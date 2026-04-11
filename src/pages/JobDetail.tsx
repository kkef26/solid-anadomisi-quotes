import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Briefcase, TrendingUp, TrendingDown, Camera } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Card, CardHeader } from '@/components/ui/Card'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { EmptyState } from '@/components/ui/EmptyState'
import type { Job, JobPiece, WorkerAssignment, Material, Payment, Photo } from '@/types'
import { PAYMENT_TYPE_LABELS, METHOD_LABELS } from '@/types'

function fmt(n: number) {
  return '€' + n.toLocaleString('el-GR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function fmtDate(s: string | null) {
  if (!s) return '—'
  return new Date(s).toLocaleDateString('el-GR')
}

type AssignmentRow = WorkerAssignment & {
  worker?: { full_name: string; phone: string | null }
}

export default function JobDetail() {
  const { id } = useParams<{ id: string }>()
  const [job, setJob] = useState<Job | null>(null)
  const [pieces, setPieces] = useState<JobPiece[]>([])
  const [assignments, setAssignments] = useState<AssignmentRow[]>([])
  const [materials, setMaterials] = useState<Material[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
  const [photos, setPhotos] = useState<Photo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    async function load() {
      try {
        const [jobRes, piecesRes, matsRes, paymentsRes, photosRes] = await Promise.all([
          supabase.from('ergo_jobs').select('*, customer:ergo_customers(full_name, phone)').eq('id', id).single(),
          supabase.from('ergo_job_pieces').select('*').eq('job_id', id).order('created_at'),
          supabase.from('ergo_materials').select('*').eq('job_id', id).order('created_at'),
          supabase.from('ergo_payments').select('*').eq('job_id', id).order('paid_at', { ascending: false }),
          supabase.from('ergo_photos').select('*').eq('job_id', id).order('created_at'),
        ])
        if (jobRes.error) throw jobRes.error
        setJob(jobRes.data as unknown as Job)
        setPieces((piecesRes.data || []) as JobPiece[])
        setMaterials((matsRes.data || []) as Material[])
        setPayments((paymentsRes.data || []) as Payment[])
        setPhotos((photosRes.data || []) as Photo[])
        if (piecesRes.data && piecesRes.data.length > 0) {
          const pieceIds = piecesRes.data.map((p: any) => p.id)
          const { data: assignData } = await supabase
            .from('ergo_worker_assignments')
            .select('*, worker:ergo_workers(full_name, phone)')
            .in('job_piece_id', pieceIds)
          setAssignments((assignData || []) as AssignmentRow[])
        }
      } catch (e: any) {
        setError(e.message || 'Σφάλμα φόρτωσης')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-24 bg-brand-surface rounded-[6px] animate-pulse" />
        ))}
      </div>
    )
  }

  if (error || !job) {
    return (
      <EmptyState
        icon={<Briefcase size={32} />}
        title="Το έργο δεν βρέθηκε"
        description={error || 'Ελέγξτε τον σύνδεσμο και δοκιμάστε ξανά.'}
        action={
          <Link to="/erga" className="text-brand-primary text-sm font-medium">
            ← Πίσω στα Έργα
          </Link>
        }
      />
    )
  }

  const customer = (job as any).customer as { full_name: string; phone: string | null } | null
  const budgetPct = job.budget > 0 ? Math.min((job.actual_cost / job.budget) * 100, 100) : 0
  const overBudget = job.budget > 0 && job.actual_cost > job.budget
  const incoming = payments.filter(p => p.direction === 'incoming')
  const outgoing = payments.filter(p => p.direction === 'outgoing')
  const totalIn = incoming.reduce((s, p) => s + p.amount, 0)
  const totalOut = outgoing.reduce((s, p) => s + p.amount, 0)

  return (
    <div className="space-y-4 max-w-3xl">
      <Link
        to="/erga"
        className="inline-flex items-center gap-1.5 text-sm text-brand-text-secondary hover:text-brand-text transition-colors"
      >
        <ArrowLeft size={14} />
        Έργα
      </Link>

      {/* Job header */}
      <Card>
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-xs text-brand-text-secondary">{job.job_number || '#—'}</span>
              <StatusBadge status={job.status} />
            </div>
            <h1 className="text-base font-semibold text-brand-text">{job.title || 'Χωρίς τίτλο'}</h1>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-xs text-brand-text-secondary mb-0.5">Πελάτης</p>
            <p className="font-medium text-brand-text">{customer?.full_name || '—'}</p>
            {customer?.phone && <p className="text-xs text-brand-text-secondary">{customer.phone}</p>}
          </div>
          <div>
            <p className="text-xs text-brand-text-secondary mb-0.5">Διεύθυνση</p>
            <p className="text-brand-text">{job.address || '—'}</p>
          </div>
          <div>
            <p className="text-xs text-brand-text-secondary mb-0.5">Έναρξη</p>
            <p className="text-brand-text">{fmtDate(job.start_date)}</p>
          </div>
          <div>
            <p className="text-xs text-brand-text-secondary mb-0.5">Εκτιμ. Λήξη</p>
            <p className="text-brand-text">{fmtDate(job.estimated_end_date)}</p>
          </div>
        </div>
        {job.budget > 0 && (
          <div className="mt-4 pt-3 border-t border-brand-border">
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-xs text-brand-text-secondary">Προϋπολογισμός vs Πραγματικό</span>
              <span className={`text-xs font-mono font-semibold ${overBudget ? 'text-red-500' : 'text-green-600'}`}>
                {fmt(job.actual_cost)} / {fmt(job.budget)}
              </span>
            </div>
            <div className="h-2 bg-brand-muted rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${overBudget ? 'bg-red-500' : 'bg-brand-primary'}`}
                style={{ width: `${budgetPct}%` }}
              />
            </div>
            <p className="text-xs text-brand-text-secondary mt-1">
              {budgetPct.toFixed(0)}% χρησιμοποιήθηκε{overBudget && ' — Υπέρβαση προϋπολογισμού!'}
            </p>
          </div>
        )}
      </Card>

      {/* Job Pieces */}
      <Card>
        <CardHeader title={`Εργασίες (${pieces.length})`} />
        {pieces.length === 0 ? (
          <p className="text-xs text-brand-text-secondary text-center py-4">Δεν υπάρχουν εγγεγραμμένες εργασίες.</p>
        ) : (
          <div className="space-y-0">
            {pieces.map(p => (
              <div key={p.id} className="flex items-start justify-between gap-2 py-3 border-b border-brand-border last:border-0">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-1.5 mb-1">
                    {p.category && (
                      <span className="text-xs bg-brand-muted text-brand-text-secondary px-1.5 py-0.5 rounded">{p.category}</span>
                    )}
                    <StatusBadge status={p.status} size="sm" />
                    <span className="text-xs text-brand-text-secondary">
                      {p.execution_type === 'internal' ? 'Ίδια δύναμη' : 'Υπεργολαβία'}
                    </span>
                  </div>
                  <p className="text-sm text-brand-text">{p.description || '—'}</p>
                  {p.notes && <p className="text-xs text-brand-text-secondary mt-0.5">{p.notes}</p>}
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs text-brand-text-secondary">Εκτ.</p>
                  <p className="font-mono text-xs">{fmt(p.estimated_cost)}</p>
                  {p.actual_cost > 0 && (
                    <>
                      <p className="text-xs text-brand-text-secondary mt-1">Πραγμ.</p>
                      <p className={`font-mono text-xs ${p.actual_cost > p.estimated_cost ? 'text-red-500' : 'text-green-600'}`}>
                        {fmt(p.actual_cost)}
                      </p>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Workers */}
      <Card>
        <CardHeader title={`Συνεργάτες (${assignments.length})`} />
        {assignments.length === 0 ? (
          <p className="text-xs text-brand-text-secondary text-center py-4">Δεν υπάρχουν ανατεθειμένοι συνεργάτες.</p>
        ) : (
          <div className="space-y-0">
            {assignments.map(a => {
              const w = a.worker
              const piece = pieces.find(pc => pc.id === a.job_piece_id)
              return (
                <div key={a.id} className="flex items-start justify-between gap-2 py-3 border-b border-brand-border last:border-0">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-sm font-medium text-brand-text">{w?.full_name || '—'}</p>
                      <StatusBadge status={a.status} size="sm" />
                    </div>
                    {w?.phone && <p className="text-xs text-brand-text-secondary">{w.phone}</p>}
                    {piece && (
                      <p className="text-xs text-brand-text-secondary mt-0.5">
                        {piece.category && `${piece.category} · `}{piece.description}
                      </p>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs text-brand-text-secondary">Συμφωνημένο</p>
                    <p className="font-mono text-xs">{fmt(a.worker_quote)}</p>
                    <p className="text-xs text-brand-text-secondary mt-1">Πληρωμένο</p>
                    <p className="font-mono text-xs text-green-600">{fmt(a.total_paid)}</p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </Card>

      {/* Materials */}
      <Card>
        <CardHeader title={`Υλικά (${materials.length})`} />
        {materials.length === 0 ? (
          <p className="text-xs text-brand-text-secondary text-center py-4">Δεν υπάρχουν καταχωρημένα υλικά.</p>
        ) : (
          <>
            <div className="space-y-0">
              {materials.map(m => (
                <div key={m.id} className="flex items-start justify-between gap-2 py-3 border-b border-brand-border last:border-0">
                  <div className="flex-1">
                    <p className="text-sm text-brand-text">{m.description || '—'}</p>
                    {m.supplier && <p className="text-xs text-brand-text-secondary">Προμηθευτής: {m.supplier}</p>}
                    {m.purchased_at && <p className="text-xs text-brand-text-secondary">{fmtDate(m.purchased_at)}</p>}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs text-brand-text-secondary">{m.quantity} {m.unit || 'τεμ.'}</p>
                    <p className="font-mono text-xs">{fmt(m.total_cost)}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-between pt-3 mt-1 border-t border-brand-border">
              <span className="text-xs font-semibold text-brand-text">Σύνολο υλικών</span>
              <span className="font-mono text-xs font-semibold">
                {fmt(materials.reduce((s, m) => s + m.total_cost, 0))}
              </span>
            </div>
          </>
        )}
      </Card>

      {/* Payments */}
      <Card>
        <CardHeader title="Πληρωμές" />
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-green-50 rounded-[6px] p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <TrendingUp size={14} className="text-green-600" />
              <span className="text-xs text-green-700 font-medium">Εισπράξεις</span>
            </div>
            <p className="font-mono text-sm font-semibold text-green-700">{fmt(totalIn)}</p>
            <p className="text-xs text-green-600 mt-0.5">{incoming.length} κινήσεις</p>
          </div>
          <div className="bg-red-50 rounded-[6px] p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <TrendingDown size={14} className="text-red-600" />
              <span className="text-xs text-red-700 font-medium">Πληρωμές</span>
            </div>
            <p className="font-mono text-sm font-semibold text-red-700">{fmt(totalOut)}</p>
            <p className="text-xs text-red-600 mt-0.5">{outgoing.length} κινήσεις</p>
          </div>
        </div>
        {payments.length === 0 ? (
          <p className="text-xs text-brand-text-secondary text-center py-2">Δεν υπάρχουν πληρωμές.</p>
        ) : (
          <div className="space-y-0">
            {payments.map(p => (
              <div key={p.id} className="flex items-center justify-between gap-2 py-3 border-b border-brand-border last:border-0">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                      p.direction === 'incoming' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                    }`}>
                      {p.direction === 'incoming' ? '↓ Είσπραξη' : '↑ Πληρωμή'}
                    </span>
                    <span className="text-xs text-brand-text-secondary">
                      {PAYMENT_TYPE_LABELS[p.payment_type] || p.payment_type}
                    </span>
                  </div>
                  {p.description && <p className="text-xs text-brand-text-secondary">{p.description}</p>}
                  <p className="text-xs text-brand-text-secondary">
                    {fmtDate(p.paid_at)}{p.method ? ` · ${METHOD_LABELS[p.method] || p.method}` : ''}
                  </p>
                </div>
                <p className={`font-mono text-sm font-semibold shrink-0 ${
                  p.direction === 'incoming' ? 'text-green-700' : 'text-red-600'
                }`}>
                  {p.direction === 'incoming' ? '+' : '-'}  {fmt(p.amount)}
                </p>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Photos */}
      <Card>
        <CardHeader title={`Φωτογραφίες (${photos.length})`} />
        {photos.length === 0 ? (
          <EmptyState
            icon={<Camera size={24} />}
            title="Χωρίς φωτογραφίες"
            description="Οι φωτογραφίες προστίθενται από τους συνεργάτες."
          />
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {photos.map(ph => (
              <a
                key={ph.id}
                href={`https://ynxcbvfhrwuenjnvsceq.supabase.co/storage/v1/object/public/${ph.storage_path}`}
                target="_blank"
                rel="noopener noreferrer"
                className="aspect-square rounded-[6px] overflow-hidden bg-brand-muted border border-brand-border hover:opacity-90 transition-opacity block"
              >
                <img
                  src={`https://ynxcbvfhrwuenjnvsceq.supabase.co/storage/v1/object/public/${ph.storage_path}`}
                  alt={ph.caption || 'Φωτογραφία'}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </a>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
