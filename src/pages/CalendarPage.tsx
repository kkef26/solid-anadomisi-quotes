import { useEffect, useState } from 'react'
import { Calendar, Plus, X } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { EmptyState } from '@/components/ui/EmptyState'
import type { Appointment, Customer } from '@/types'

interface ApptForm {
  title: string
  customer_id: string
  address: string
  scheduled_at: string
  duration_minutes: number
  notes: string
}

const EMPTY: ApptForm = { title: '', customer_id: '', address: '', scheduled_at: '', duration_minutes: 60, notes: '' }

export default function CalendarPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState<ApptForm>(EMPTY)
  const [saving, setSaving] = useState(false)

  async function loadData() {
    const [apptRes, custRes] = await Promise.all([
      supabase.from('ergo_appointments').select('*, customer:ergo_customers(full_name)')
        .gte('scheduled_at', new Date(Date.now() - 7 * 86400000).toISOString()).order('scheduled_at'),
      supabase.from('ergo_customers').select('id, full_name').is('deleted_at', null).order('full_name'),
    ])
    setAppointments((apptRes.data || []) as unknown as Appointment[])
    setCustomers((custRes.data || []) as Customer[])
    setLoading(false)
  }

  useEffect(() => { loadData() }, [])

  async function handleSave() {
    if (!form.title.trim() || !form.scheduled_at) return
    setSaving(true)
    const { data: orgId } = await supabase.rpc('ergo_user_org_id')
    await supabase.from('ergo_appointments').insert({
      org_id: orgId,
      title: form.title.trim(),
      customer_id: form.customer_id || null,
      address: form.address.trim() || null,
      scheduled_at: new Date(form.scheduled_at).toISOString(),
      duration_minutes: form.duration_minutes,
      status: 'pending',
      notes: form.notes.trim() || null,
    })
    setSaving(false)
    setForm(EMPTY)
    setShowModal(false)
    loadData()
  }

  if (loading) return <div className="h-40 bg-brand-surface rounded-[6px] animate-pulse" />

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
        <Button size="sm" onClick={() => setShowModal(true)}><Plus size={16} /> Νέο Ραντεβού</Button>
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

      {showModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-[6px] shadow-xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-brand-border">
              <h2 className="text-base font-semibold text-brand-text">Νέο Ραντεβού</h2>
              <button onClick={() => setShowModal(false)} className="p-1 text-brand-text-secondary hover:text-brand-text"><X size={18} /></button>
            </div>
            <div className="p-4 space-y-3">
              <div>
                <label className="block text-xs font-medium text-brand-text-secondary mb-1">Τίτλος *</label>
                <input type="text" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-brand-surface border border-brand-border rounded-[6px] outline-none focus:border-brand-primary"
                  placeholder="π.χ. Αυτοψία μπάνιου" autoFocus />
              </div>
              <div>
                <label className="block text-xs font-medium text-brand-text-secondary mb-1">Πελάτης</label>
                <select value={form.customer_id} onChange={e => setForm({ ...form, customer_id: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-brand-surface border border-brand-border rounded-[6px] outline-none focus:border-brand-primary">
                  <option value="">— Επιλέξτε —</option>
                  {customers.map(c => <option key={c.id} value={c.id}>{c.full_name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-brand-text-secondary mb-1">Διεύθυνση</label>
                <input type="text" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-brand-surface border border-brand-border rounded-[6px] outline-none focus:border-brand-primary" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-brand-text-secondary mb-1">Ημ/νία & Ώρα *</label>
                  <input type="datetime-local" value={form.scheduled_at} onChange={e => setForm({ ...form, scheduled_at: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-brand-surface border border-brand-border rounded-[6px] outline-none focus:border-brand-primary" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-brand-text-secondary mb-1">Διάρκεια (λεπτά)</label>
                  <input type="number" value={form.duration_minutes} onChange={e => setForm({ ...form, duration_minutes: parseInt(e.target.value) || 60 })}
                    className="w-full px-3 py-2 text-sm bg-brand-surface border border-brand-border rounded-[6px] outline-none focus:border-brand-primary" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-brand-text-secondary mb-1">Σημειώσεις</label>
                <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2}
                  className="w-full px-3 py-2 text-sm bg-brand-surface border border-brand-border rounded-[6px] outline-none focus:border-brand-primary resize-none" />
              </div>
            </div>
            <div className="flex justify-end gap-2 p-4 border-t border-brand-border">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-brand-text-secondary hover:text-brand-text">Ακύρωση</button>
              <Button size="sm" onClick={handleSave} disabled={saving || !form.title.trim() || !form.scheduled_at}>
                {saving ? 'Αποθήκευση...' : 'Αποθήκευση'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
