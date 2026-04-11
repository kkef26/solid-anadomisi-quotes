import { useEffect, useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Search, Users, Plus, X } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import type { Customer } from '@/types'

interface NewCustomerForm {
  full_name: string
  company: string
  phone: string
  email: string
  address: string
  city: string
  postal_code: string
  vat_number: string
  notes: string
}

const EMPTY_FORM: NewCustomerForm = {
  full_name: '', company: '', phone: '', email: '',
  address: '', city: '', postal_code: '', vat_number: '', notes: '',
}

export default function Customers() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState<NewCustomerForm>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)

  async function loadCustomers() {
    const { data } = await supabase
      .from('ergo_customers')
      .select('*')
      .is('deleted_at', null)
      .order('full_name')
    setCustomers((data || []) as Customer[])
    setLoading(false)
  }

  useEffect(() => { loadCustomers() }, [])

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

  async function handleSave() {
    if (!form.full_name.trim()) return
    setSaving(true)
    const { data: userData } = await supabase.rpc('ergo_user_org_id')
    const orgId = userData
    const { error } = await supabase.from('ergo_customers').insert({
      org_id: orgId,
      full_name: form.full_name.trim(),
      company: form.company.trim() || null,
      phone: form.phone.trim() || null,
      email: form.email.trim() || null,
      address: form.address.trim() || null,
      city: form.city.trim() || null,
      postal_code: form.postal_code.trim() || null,
      vat_number: form.vat_number.trim() || null,
      notes: form.notes.trim() || null,
      tags: [],
      total_quoted: 0,
      total_paid: 0,
      job_count: 0,
    })
    setSaving(false)
    if (!error) {
      setForm(EMPTY_FORM)
      setShowModal(false)
      loadCustomers()
    }
  }

  if (loading) {
    return <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="h-14 bg-brand-surface rounded-[6px] animate-pulse" />)}</div>
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-brand-text">Πελάτες</h1>
        <Button size="sm" onClick={() => setShowModal(true)}><Plus size={16} /> Νέος Πελάτης</Button>
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
              <Link key={c.id} to={`/pelates/${c.id}`} className="block px-4 py-3 hover:bg-brand-muted transition-colors">
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
              </Link>
            ))}
          </div>
        </Card>
      )}

      <p className="text-xs text-brand-text-secondary text-center">{filtered.length} πελάτες</p>

      {/* New Customer Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-[6px] shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-brand-border">
              <h2 className="text-base font-semibold text-brand-text">Νέος Πελάτης</h2>
              <button onClick={() => setShowModal(false)} className="p-1 text-brand-text-secondary hover:text-brand-text">
                <X size={18} />
              </button>
            </div>
            <div className="p-4 space-y-3">
              <div>
                <label className="block text-xs font-medium text-brand-text-secondary mb-1">Ονοματεπώνυμο *</label>
                <input
                  type="text"
                  value={form.full_name}
                  onChange={e => setForm({ ...form, full_name: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-brand-surface border border-brand-border rounded-[6px] outline-none focus:border-brand-primary"
                  placeholder="π.χ. Γιώργος Παπαδόπουλος"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-brand-text-secondary mb-1">Εταιρεία</label>
                <input
                  type="text"
                  value={form.company}
                  onChange={e => setForm({ ...form, company: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-brand-surface border border-brand-border rounded-[6px] outline-none focus:border-brand-primary"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-brand-text-secondary mb-1">Τηλέφωνο</label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={e => setForm({ ...form, phone: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-brand-surface border border-brand-border rounded-[6px] outline-none focus:border-brand-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-brand-text-secondary mb-1">Email</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-brand-surface border border-brand-border rounded-[6px] outline-none focus:border-brand-primary"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-brand-text-secondary mb-1">Διεύθυνση</label>
                <input
                  type="text"
                  value={form.address}
                  onChange={e => setForm({ ...form, address: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-brand-surface border border-brand-border rounded-[6px] outline-none focus:border-brand-primary"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-brand-text-secondary mb-1">Πόλη</label>
                  <input
                    type="text"
                    value={form.city}
                    onChange={e => setForm({ ...form, city: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-brand-surface border border-brand-border rounded-[6px] outline-none focus:border-brand-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-brand-text-secondary mb-1">ΤΚ</label>
                  <input
                    type="text"
                    value={form.postal_code}
                    onChange={e => setForm({ ...form, postal_code: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-brand-surface border border-brand-border rounded-[6px] outline-none focus:border-brand-primary"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-brand-text-secondary mb-1">ΑΦΜ</label>
                <input
                  type="text"
                  value={form.vat_number}
                  onChange={e => setForm({ ...form, vat_number: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-brand-surface border border-brand-border rounded-[6px] outline-none focus:border-brand-primary"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-brand-text-secondary mb-1">Σημειώσεις</label>
                <textarea
                  value={form.notes}
                  onChange={e => setForm({ ...form, notes: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 text-sm bg-brand-surface border border-brand-border rounded-[6px] outline-none focus:border-brand-primary resize-none"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 p-4 border-t border-brand-border">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-sm text-brand-text-secondary hover:text-brand-text"
              >
                Ακύρωση
              </button>
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
