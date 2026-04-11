import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Plus, Trash2, ChevronUp, ChevronDown, Send, Save } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Card, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import type { Customer } from '@/types'
import { useAuth } from '@/hooks/useAuth'

interface LineItem {
  id: string // local only
  category: string
  description: string
  unit: string
  quantity: number
  unit_price: number
}

const UNITS = [
  { value: 'm2', label: 'τ.μ.' },
  { value: 'm3', label: 'κ.μ.' },
  { value: 'piece', label: 'τεμ.' },
  { value: 'hour', label: 'ώρα' },
  { value: 'day', label: 'ημέρα' },
  { value: 'kg', label: 'κιλά' },
  { value: 'lump', label: 'κατ.αποκ.' },
  { value: 'm', label: 'μ.μ.' },
]

const CATEGORIES = [
  'Αποξηλώσεις', 'Κτίσιμο', 'Σοβάδες', 'Ηλεκτρολογικά', 'Υδραυλικά',
  'Πλακάκια', 'Ξύλινα', 'Αλουμίνια', 'Βαψίματα', 'Εξωτερικά', 'Γενικά'
]

function uuid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

function fmt(n: number) {
  return n.toLocaleString('el-GR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function emptyItem(): LineItem {
  return { id: uuid(), category: '', description: '', unit: 'm2', quantity: 1, unit_price: 0 }
}

export default function NewProposal() {
  const navigate = useNavigate()
  const { user } = useAuth()

  const [customers, setCustomers] = useState<Customer[]>([])
  const [customerId, setCustomerId] = useState<string>('')
  const [entity, setEntity] = useState('')
  const [validUntil, setValidUntil] = useState('')
  const [paymentTerms, setPaymentTerms] = useState('')
  const [notes, setNotes] = useState('')
  const [internalNotes, setInternalNotes] = useState('')
  const [vatPct, setVatPct] = useState<0 | 24>(24)
  const [items, setItems] = useState<LineItem[]>([emptyItem()])
  const [saving, setSaving] = useState(false)
  const [orgId, setOrgId] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      // Get org_id from ergo_users
      if (user) {
        const { data: eu } = await supabase
          .from('ergo_users')
          .select('org_id')
          .eq('id', user.id)
          .single()
        if (eu) setOrgId(eu.org_id)
      }
      const { data } = await supabase
        .from('ergo_customers')
        .select('id, full_name, company')
        .is('deleted_at', null)
        .order('full_name', { ascending: true })
      setCustomers((data || []) as unknown as Customer[])
    }
    load()
  }, [user])

  function updateItem(id: string, field: keyof LineItem, value: string | number) {
    setItems(prev => prev.map(it => it.id === id ? { ...it, [field]: value } : it))
  }

  function addItem() {
    setItems(prev => [...prev, emptyItem()])
  }

  function removeItem(id: string) {
    setItems(prev => prev.filter(it => it.id !== id))
  }

  function moveItem(id: string, dir: -1 | 1) {
    setItems(prev => {
      const idx = prev.findIndex(it => it.id === id)
      if (idx < 0) return prev
      const next = idx + dir
      if (next < 0 || next >= prev.length) return prev
      const arr = [...prev]
      ;[arr[idx], arr[next]] = [arr[next], arr[idx]]
      return arr
    })
  }

  const lineItems = items.map(it => ({
    ...it,
    total: parseFloat((it.quantity * it.unit_price).toFixed(2))
  }))
  const subtotal = parseFloat(lineItems.reduce((s, it) => s + it.total, 0).toFixed(2))
  const vatAmount = parseFloat((subtotal * vatPct / 100).toFixed(2))
  const total = parseFloat((subtotal + vatAmount).toFixed(2))

  async function save(sendAfter = false) {
    if (!orgId) { alert('Δεν βρέθηκε οργανισμός. Συνδεθείτε ξανά.'); return }
    setSaving(true)

    // Generate proposal number
    const { count } = await supabase
      .from('ergo_proposals')
      .select('*', { count: 'exact', head: true })
      .eq('org_id', orgId)
    const num = ((count || 0) + 1).toString().padStart(4, '0')
    const year = new Date().getFullYear().toString().slice(-2)
    const proposalNumber = `ΠΡ-${year}-${num}`

    const { data: p, error } = await supabase
      .from('ergo_proposals')
      .insert({
        org_id: orgId,
        customer_id: customerId || null,
        entity: entity || null,
        proposal_number: proposalNumber,
        status: sendAfter ? 'sent' : 'draft',
        subtotal,
        vat_pct: vatPct,
        vat_amount: vatAmount,
        total,
        valid_until: validUntil || null,
        payment_terms: paymentTerms || null,
        notes: notes || null,
        internal_notes: internalNotes || null,
        sent_at: sendAfter ? new Date().toISOString() : null,
        sent_via: sendAfter ? 'hand' : null,
        created_by: user?.id || null,
      })
      .select()
      .single()

    if (error || !p) {
      alert('Σφάλμα αποθήκευσης: ' + (error?.message || 'Άγνωστο σφάλμα'))
      setSaving(false)
      return
    }

    // Insert line items
    const rows = lineItems
      .filter(it => it.description.trim())
      .map((it, idx) => ({
        proposal_id: p.id,
        sort_order: idx,
        category: it.category || null,
        description: it.description,
        unit: it.unit || null,
        quantity: it.quantity,
        unit_price: it.unit_price,
        total: it.total,
        is_additional: false,
      }))

    if (rows.length > 0) {
      await supabase.from('ergo_proposal_items').insert(rows)
    }

    setSaving(false)
    navigate(`/prosfores/${p.id}`)
  }

  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <Link
          to="/prosfores"
          className="flex items-center gap-1.5 text-sm text-brand-text-secondary hover:text-brand-text transition-colors"
        >
          <ArrowLeft size={16} />
          Προσφορές
        </Link>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" loading={saving} onClick={() => save(false)}>
            <Save size={14} />
            Αποθήκευση
          </Button>
          <Button size="sm" loading={saving} onClick={() => save(true)}>
            <Send size={14} />
            Αποθήκευση & Αποστολή
          </Button>
        </div>
      </div>

      {/* Basic info */}
      <Card>
        <CardHeader title="Βασικά στοιχεία" />
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-brand-text-secondary mb-1">Πελάτης</label>
            <select
              value={customerId}
              onChange={e => setCustomerId(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-brand-surface border border-brand-border rounded-[6px] outline-none focus:border-brand-primary transition-colors"
            >
              <option value="">— Επιλέξτε πελάτη —</option>
              {customers.map(c => (
                <option key={c.id} value={c.id}>
                  {c.full_name}{c.company ? ` (${c.company})` : ''}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-brand-text-secondary mb-1">Φορέας / Ονομασία έργου</label>
            <input
              type="text"
              value={entity}
              onChange={e => setEntity(e.target.value)}
              placeholder="π.χ. Ιδιωτικό έργο Δροσιά"
              className="w-full px-3 py-2 text-sm bg-brand-surface border border-brand-border rounded-[6px] outline-none focus:border-brand-primary transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-brand-text-secondary mb-1">Ισχύει έως</label>
            <input
              type="date"
              value={validUntil}
              onChange={e => setValidUntil(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-brand-surface border border-brand-border rounded-[6px] outline-none focus:border-brand-primary transition-colors"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-brand-text-secondary mb-1">Όροι πληρωμής</label>
            <input
              type="text"
              value={paymentTerms}
              onChange={e => setPaymentTerms(e.target.value)}
              placeholder="π.χ. 30% προκαταβολή, υπόλοιπο παράδοση"
              className="w-full px-3 py-2 text-sm bg-brand-surface border border-brand-border rounded-[6px] outline-none focus:border-brand-primary transition-colors"
            />
          </div>
        </div>
      </Card>

      {/* Line items */}
      <Card padding="none">
        <div className="px-4 py-3 border-b border-brand-border flex items-center justify-between">
          <h2 className="text-sm font-semibold text-brand-text">Στοιχεία προσφοράς</h2>
          <Button variant="secondary" size="sm" onClick={addItem}>
            <Plus size={14} />
            Προσθήκη γραμμής
          </Button>
        </div>

        {/* Column headers — desktop */}
        <div className="hidden md:grid md:grid-cols-[140px_1fr_90px_80px_100px_100px_60px] gap-2 px-4 py-2 bg-brand-muted border-b border-brand-border text-xs font-medium text-brand-text-secondary uppercase tracking-wide">
          <span>Κατηγορία</span>
          <span>Περιγραφή</span>
          <span>Μονάδα</span>
          <span className="text-right">Ποσ.</span>
          <span className="text-right">Τιμή/μον.</span>
          <span className="text-right">Σύνολο</span>
          <span />
        </div>

        <div className="divide-y divide-brand-border">
          {lineItems.map((item, idx) => (
            <div key={item.id} className="px-4 py-3 grid grid-cols-1 md:grid-cols-[140px_1fr_90px_80px_100px_100px_60px] gap-2 items-center">
              {/* Category */}
              <div>
                <label className="md:hidden text-xs text-brand-text-secondary">Κατηγορία</label>
                <select
                  value={item.category}
                  onChange={e => updateItem(item.id, 'category', e.target.value)}
                  className="w-full px-2 py-1.5 text-xs bg-brand-surface border border-brand-border rounded-[6px] outline-none focus:border-brand-primary transition-colors"
                >
                  <option value="">—</option>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              {/* Description */}
              <div>
                <label className="md:hidden text-xs text-brand-text-secondary">Περιγραφή</label>
                <input
                  type="text"
                  value={item.description}
                  onChange={e => updateItem(item.id, 'description', e.target.value)}
                  placeholder="Περιγραφή εργασίας..."
                  className="w-full px-2 py-1.5 text-sm bg-brand-surface border border-brand-border rounded-[6px] outline-none focus:border-brand-primary transition-colors"
                />
              </div>
              {/* Unit */}
              <div>
                <label className="md:hidden text-xs text-brand-text-secondary">Μονάδα</label>
                <select
                  value={item.unit}
                  onChange={e => updateItem(item.id, 'unit', e.target.value)}
                  className="w-full px-2 py-1.5 text-xs bg-brand-surface border border-brand-border rounded-[6px] outline-none focus:border-brand-primary transition-colors"
                >
                  {UNITS.map(u => <option key={u.value} value={u.value}>{u.label}</option>)}
                </select>
              </div>
              {/* Quantity */}
              <div>
                <label className="md:hidden text-xs text-brand-text-secondary">Ποσότητα</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={item.quantity}
                  onChange={e => updateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                  className="w-full px-2 py-1.5 text-sm font-mono bg-brand-surface border border-brand-border rounded-[6px] outline-none focus:border-brand-primary transition-colors text-right"
                />
              </div>
              {/* Unit price */}
              <div>
                <label className="md:hidden text-xs text-brand-text-secondary">Τιμή/μον.</label>
                <div className="relative">
                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-brand-text-secondary">€</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.unit_price}
                    onChange={e => updateItem(item.id, 'unit_price', parseFloat(e.target.value) || 0)}
                    className="w-full pl-5 pr-2 py-1.5 text-sm font-mono bg-brand-surface border border-brand-border rounded-[6px] outline-none focus:border-brand-primary transition-colors text-right"
                  />
                </div>
              </div>
              {/* Line total */}
              <div className="text-right">
                <label className="md:hidden text-xs text-brand-text-secondary">Σύνολο: </label>
                <span className="font-mono text-sm font-semibold text-brand-text">
                  €{fmt(item.total)}
                </span>
              </div>
              {/* Actions */}
              <div className="flex items-center gap-1 justify-end md:justify-center">
                <button
                  onClick={() => moveItem(item.id, -1)}
                  disabled={idx === 0}
                  className="p-1 rounded hover:bg-brand-muted disabled:opacity-30 transition-colors"
                >
                  <ChevronUp size={14} className="text-brand-text-secondary" />
                </button>
                <button
                  onClick={() => moveItem(item.id, 1)}
                  disabled={idx === lineItems.length - 1}
                  className="p-1 rounded hover:bg-brand-muted disabled:opacity-30 transition-colors"
                >
                  <ChevronDown size={14} className="text-brand-text-secondary" />
                </button>
                <button
                  onClick={() => removeItem(item.id)}
                  disabled={lineItems.length === 1}
                  className="p-1 rounded hover:bg-red-50 disabled:opacity-30 transition-colors"
                >
                  <Trash2 size={14} className="text-red-500" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Add row button */}
        <div className="px-4 py-2 border-t border-brand-border">
          <button
            onClick={addItem}
            className="flex items-center gap-1.5 text-sm text-brand-primary hover:text-brand-primary/80 transition-colors"
          >
            <Plus size={14} />
            Προσθήκη γραμμής
          </button>
        </div>

        {/* Totals */}
        <div className="border-t-2 border-brand-border px-4 py-4 space-y-1.5 flex flex-col items-end">
          <div className="flex items-center gap-8 text-sm">
            <span className="text-brand-text-secondary">Υποσύνολο</span>
            <span className="font-mono font-medium text-brand-text w-32 text-right">€{fmt(subtotal)}</span>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <span className="text-brand-text-secondary">ΦΠΑ</span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setVatPct(0)}
                className={`px-2 py-0.5 text-xs rounded transition-colors ${vatPct === 0 ? 'bg-brand-primary text-white' : 'bg-brand-surface border border-brand-border text-brand-text-secondary'}`}
              >
                0%
              </button>
              <button
                onClick={() => setVatPct(24)}
                className={`px-2 py-0.5 text-xs rounded transition-colors ${vatPct === 24 ? 'bg-brand-primary text-white' : 'bg-brand-surface border border-brand-border text-brand-text-secondary'}`}
              >
                24%
              </button>
            </div>
            <span className="font-mono font-medium text-brand-text w-32 text-right">€{fmt(vatAmount)}</span>
          </div>
          <div className="flex items-center gap-8 pt-2 border-t border-brand-border mt-1">
            <span className="text-sm font-semibold text-brand-text">Σύνολο</span>
            <span className="font-mono text-xl font-bold text-brand-primary w-32 text-right">€{fmt(total)}</span>
          </div>
        </div>
      </Card>

      {/* Notes */}
      <Card>
        <CardHeader title="Σημειώσεις" />
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-brand-text-secondary mb-1">Σημειώσεις (για τον πελάτη)</label>
            <textarea
              rows={3}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Εμφανίζεται στην προσφορά..."
              className="w-full px-3 py-2 text-sm bg-brand-surface border border-brand-border rounded-[6px] outline-none focus:border-brand-primary transition-colors resize-none"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-brand-text-secondary mb-1">Εσωτερικές σημειώσεις</label>
            <textarea
              rows={3}
              value={internalNotes}
              onChange={e => setInternalNotes(e.target.value)}
              placeholder="Μόνο για εσωτερική χρήση..."
              className="w-full px-3 py-2 text-sm bg-brand-surface border border-brand-border rounded-[6px] outline-none focus:border-brand-primary transition-colors resize-none"
            />
          </div>
        </div>
      </Card>

      {/* Bottom save bar */}
      <div className="flex items-center justify-end gap-3 pb-8">
        <Button variant="secondary" size="md" loading={saving} onClick={() => save(false)}>
          <Save size={16} />
          Αποθήκευση ως πρόχειρο
        </Button>
        <Button size="md" loading={saving} onClick={() => save(true)}>
          <Send size={16} />
          Αποθήκευση & Αποστολή
        </Button>
      </div>
    </div>
  )
}
