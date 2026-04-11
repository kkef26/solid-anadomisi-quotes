import { useEffect, useState } from 'react'
import { HardHat, Plus, X } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import type { Worker } from '@/types'

interface WorkerForm {
  full_name: string
  company: string
  phone: string
  email: string
  worker_type: 'employee' | 'subcontractor'
  specialties_text: string
  notes: string
}

const EMPTY: WorkerForm = { full_name: '', company: '', phone: '', email: '', worker_type: 'subcontractor', specialties_text: '', notes: '' }

export default function Workers() {
  const [workers, setWorkers] = useState<Worker[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState<WorkerForm>(EMPTY)
  const [saving, setSaving] = useState(false)

  async function loadWorkers() {
    const { data } = await supabase.from('ergo_workers').select('*').is('deleted_at', null).order('full_name')
    setWorkers((data || []) as Worker[])
    setLoading(false)
  }

  useEffect(() => { loadWorkers() }, [])

  async function handleSave() {
    if (!form.full_name.trim()) return
    setSaving(true)
    const { data: orgId } = await supabase.rpc('ergo_user_org_id')
    const specialties = form.specialties_text.split(',').map(s => s.trim()).filter(Boolean)
    await supabase.from('ergo_workers').insert({
      org_id: orgId,
      full_name: form.full_name.trim(),
      company: form.company.trim() || null,
      phone: form.phone.trim() || null,
      email: form.email.trim() || null,
      worker_type: form.worker_type,
      specialties,
      notes: form.notes.trim() || null,
      total_paid: 0,
      job_count: 0,
    })
    setSaving(false)
    setForm(EMPTY)
    setShowModal(false)
    loadWorkers()
  }

  if (loading) return <div className="h-40 bg-brand-surface rounded-[6px] animate-pulse" />

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-brand-text">Συνεργάτες</h1>
        <Button size="sm" onClick={() => setShowModal(true)}><Plus size={16} /> Νέος Συνεργάτης</Button>
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

      {showModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-[6px] shadow-xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-brand-border">
              <h2 className="text-base font-semibold text-brand-text">Νέος Συνεργάτης</h2>
              <button onClick={() => setShowModal(false)} className="p-1 text-brand-text-secondary hover:text-brand-text"><X size={18} /></button>
            </div>
            <div className="p-4 space-y-3">
              <div>
                <label className="block text-xs font-medium text-brand-text-secondary mb-1">Ονοματεπώνυμο *</label>
                <input type="text" value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-brand-surface border border-brand-border rounded-[6px] outline-none focus:border-brand-primary"
                  placeholder="π.χ. Νίκος Ηλεκτρολόγος" autoFocus />
              </div>
              <div>
                <label className="block text-xs font-medium text-brand-text-secondary mb-1">Εταιρεία</label>
                <input type="text" value={form.company} onChange={e => setForm({ ...form, company: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-brand-surface border border-brand-border rounded-[6px] outline-none focus:border-brand-primary" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-brand-text-secondary mb-1">Τηλέφωνο</label>
                  <input type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-brand-surface border border-brand-border rounded-[6px] outline-none focus:border-brand-primary" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-brand-text-secondary mb-1">Email</label>
                  <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-brand-surface border border-brand-border rounded-[6px] outline-none focus:border-brand-primary" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-brand-text-secondary mb-1">Τύπος</label>
                <select value={form.worker_type} onChange={e => setForm({ ...form, worker_type: e.target.value as 'employee' | 'subcontractor' })}
                  className="w-full px-3 py-2 text-sm bg-brand-surface border border-brand-border rounded-[6px] outline-none focus:border-brand-primary">
                  <option value="subcontractor">Υπεργολάβος</option>
                  <option value="employee">Εργαζόμενος</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-brand-text-secondary mb-1">Ειδικότητες (χωρισμένες με κόμμα)</label>
                <input type="text" value={form.specialties_text} onChange={e => setForm({ ...form, specialties_text: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-brand-surface border border-brand-border rounded-[6px] outline-none focus:border-brand-primary"
                  placeholder="π.χ. Ηλεκτρολόγος, Υδραυλικός" />
              </div>
              <div>
                <label className="block text-xs font-medium text-brand-text-secondary mb-1">Σημειώσεις</label>
                <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2}
                  className="w-full px-3 py-2 text-sm bg-brand-surface border border-brand-border rounded-[6px] outline-none focus:border-brand-primary resize-none" />
              </div>
            </div>
            <div className="flex justify-end gap-2 p-4 border-t border-brand-border">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-brand-text-secondary hover:text-brand-text">Ακύρωση</button>
              <Button size="sm" onClick={handleSave} disabled={saving || !form.full_name.trim()}>
                {saving ? 'Αποθήκευση...' : 'Αποθήκευση'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
