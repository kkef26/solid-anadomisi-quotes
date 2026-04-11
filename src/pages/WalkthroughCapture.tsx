import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Mic, Sparkles, CheckCircle2, Pencil, Trash2, Plus } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader } from '@/components/ui/Card'
import type { Walkthrough, WalkthroughItem } from '@/types'

export default function WalkthroughCapture() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [walkthrough, setWalkthrough] = useState<Walkthrough | null>(null)
  const [rawText, setRawText] = useState('')
  const [items, setItems] = useState<WalkthroughItem[]>([])
  const [editingIdx, setEditingIdx] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [structuring, setStructuring] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    async function load() {
      const { data, error } = await supabase
        .from('ergo_walkthroughs')
        .select('*, customer:ergo_customers(full_name)')
        .eq('id', id)
        .single()
      if (data) {
        setWalkthrough(data as unknown as Walkthrough)
        setRawText(data.raw_text || '')
        setItems(data.structured_items || [])
      }
      if (error) setError(error.message)
      setLoading(false)
    }
    load()
  }, [id])

  async function handleSaveRaw() {
    if (!id) return
    await supabase.from('ergo_walkthroughs').update({ raw_text: rawText }).eq('id', id)
  }

  async function handleStructure() {
    if (!rawText.trim()) return
    setStructuring(true)
    setError(null)
    try {
      const { data, error: fnErr } = await supabase.functions.invoke('ai-structure-walkthrough', {
        body: { text: rawText },
      })
      if (fnErr) throw fnErr
      if (data?.items && Array.isArray(data.items)) {
        const structured = data.items as WalkthroughItem[]
        setItems(structured)
        await supabase.from('ergo_walkthroughs').update({
          raw_text: rawText,
          structured_items: structured,
        }).eq('id', id)
      }
    } catch (e: any) {
      setError('Σφάλμα AI δόμησης. Δοκιμάστε ξανά.')
    } finally {
      setStructuring(false)
    }
  }

  async function handleConvert() {
    if (!id || items.length === 0) return
    setSaving(true)
    await supabase.from('ergo_walkthroughs').update({
      raw_text: rawText,
      structured_items: items,
      status: 'reviewed',
    }).eq('id', id)
    navigate(`/prosfores/nea?walkthrough=${id}`)
  }

  function updateItem(idx: number, field: keyof WalkthroughItem, value: string) {
    setItems(prev =>
      prev.map((item, i) => (i === idx ? { ...item, [field]: value } : item))
    )
  }

  function removeItem(idx: number) {
    setItems(prev => prev.filter((_, i) => i !== idx))
    if (editingIdx === idx) setEditingIdx(null)
  }

  function addItem() {
    const newItem: WalkthroughItem = { category: '', description: '', notes: null, photos: [] }
    setItems(prev => [...prev, newItem])
    setEditingIdx(items.length)
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2].map(i => (
          <div key={i} className="h-32 bg-brand-surface rounded-[6px] animate-pulse" />
        ))}
      </div>
    )
  }

  const customer = walkthrough
    ? ((walkthrough as any).customer as { full_name: string } | null)
    : null

  return (
    <div className="space-y-4 max-w-2xl">
      <div>
        <h1 className="text-lg font-semibold text-brand-text flex items-center gap-2">
          <Mic size={18} className="text-brand-primary" />
          Αυτοψία
        </h1>
        {customer && (
          <p className="text-sm text-brand-text-secondary mt-0.5">{customer.full_name}</p>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-[6px] p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Raw voice-to-text input */}
      <Card>
        <CardHeader title="Φωνητικές σημειώσεις" />
        <textarea
          value={rawText}
          onChange={e => setRawText(e.target.value)}
          onBlur={handleSaveRaw}
          placeholder={'Μιλήστε ή πληκτρολογήστε τις παρατηρήσεις αυτοψίας…\n\nπ.χ. «Στο μπάνιο χρειάζεται αντικατάσταση πλακιδίων, τα μισά είναι σπασμένα. Στο σαλόνι βαψίματα και στόκος. Ηλεκτρολογικός πίνακας παλιός, χρειάζεται αναβάθμιση...»'}
          className="w-full text-sm text-brand-text placeholder:text-brand-text-secondary/50 bg-brand-muted border border-brand-border rounded-[6px] p-3 resize-y focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary leading-relaxed"
          style={{ minHeight: 220 }}
        />
        <div className="flex justify-end mt-3">
          <Button
            variant="primary"
            size="lg"
            onClick={handleStructure}
            loading={structuring}
            disabled={!rawText.trim() || structuring}
          >
            <Sparkles size={16} />
            Δόμηση με AI
          </Button>
        </div>
      </Card>

      {/* Structured items preview */}
      {items.length > 0 && (
        <Card>
          <CardHeader
            title={`Δομημένες εργασίες (${items.length})`}
            action={
              <button
                onClick={addItem}
                className="text-xs text-brand-primary font-medium flex items-center gap-1 min-h-[44px] px-2"
              >
                <Plus size={14} />
                Προσθήκη
              </button>
            }
          />
          <div className="space-y-3">
            {items.map((item, idx) => (
              <div key={idx} className="border border-brand-border rounded-[6px] p-3">
                {editingIdx === idx ? (
                  <div className="space-y-2">
                    <input
                      value={item.category}
                      onChange={e => updateItem(idx, 'category', e.target.value)}
                      placeholder="Κατηγορία (π.χ. Βαφές, Πλακάκια, Ηλεκτρολογικά…)"
                      className="w-full text-xs font-medium bg-brand-muted border border-brand-border rounded px-2 py-2 min-h-[44px] focus:outline-none focus:ring-1 focus:ring-brand-primary"
                    />
                    <textarea
                      value={item.description}
                      onChange={e => updateItem(idx, 'description', e.target.value)}
                      placeholder="Περιγραφή εργασίας"
                      className="w-full text-sm bg-brand-muted border border-brand-border rounded px-2 py-2 resize-none focus:outline-none focus:ring-1 focus:ring-brand-primary"
                      rows={2}
                    />
                    <input
                      value={item.notes || ''}
                      onChange={e => updateItem(idx, 'notes', e.target.value)}
                      placeholder="Σημειώσεις (προαιρετικό)"
                      className="w-full text-xs bg-brand-muted border border-brand-border rounded px-2 py-2 min-h-[44px] focus:outline-none focus:ring-1 focus:ring-brand-primary"
                    />
                    <button
                      onClick={() => setEditingIdx(null)}
                      className="text-xs text-brand-primary font-medium min-h-[44px] flex items-center gap-1.5"
                    >
                      <CheckCircle2 size={14} />
                      Αποθήκευση
                    </button>
                  </div>
                ) : (
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      {item.category && (
                        <span className="text-xs bg-brand-primary/10 text-brand-primary font-medium px-2 py-0.5 rounded mb-1.5 inline-block">
                          {item.category}
                        </span>
                      )}
                      <p className="text-sm text-brand-text">{item.description || '—'}</p>
                      {item.notes && (
                        <p className="text-xs text-brand-text-secondary mt-0.5">{item.notes}</p>
                      )}
                    </div>
                    <div className="flex gap-0 shrink-0">
                      <button
                        onClick={() => setEditingIdx(idx)}
                        className="p-2 text-brand-text-secondary hover:text-brand-text rounded-[6px] min-h-[44px] min-w-[44px] flex items-center justify-center"
                        aria-label="Επεξεργασία"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => removeItem(idx)}
                        className="p-2 text-brand-text-secondary hover:text-red-500 rounded-[6px] min-h-[44px] min-w-[44px] flex items-center justify-center"
                        aria-label="Διαγραφή"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Convert to proposal */}
      {items.length > 0 && (
        <div className="flex justify-end pb-6">
          <Button
            variant="primary"
            size="lg"
            onClick={handleConvert}
            loading={saving}
            disabled={saving}
          >
            Μετατροπή σε Προσφορά →
          </Button>
        </div>
      )}
    </div>
  )
}
