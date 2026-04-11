import { Settings } from 'lucide-react'
import { Card, CardHeader } from '@/components/ui/Card'
import { useAppStore } from '@/lib/store'

export default function SettingsPage() {
  const { org, user } = useAppStore()

  return (
    <div className="space-y-4 max-w-2xl">
      <h1 className="text-lg font-semibold text-brand-text">Ρυθμίσεις</h1>

      <Card>
        <CardHeader title="Οργανισμός" />
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-brand-text-secondary">Επωνυμία</span>
            <span className="font-medium">{org?.name || '—'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-brand-text-secondary">Email</span>
            <span className="font-medium">{org?.contact_email || '—'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-brand-text-secondary">Τηλέφωνο</span>
            <span className="font-medium">{org?.contact_phone || '—'}</span>
          </div>
        </div>
      </Card>

      <Card>
        <CardHeader title="Χρήστης" />
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-brand-text-secondary">Όνομα</span>
            <span className="font-medium">{user?.full_name || '—'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-brand-text-secondary">Ρόλος</span>
            <span className="font-medium capitalize">{user?.role || '—'}</span>
          </div>
        </div>
      </Card>

      <Card>
        <CardHeader title="Σύστημα" />
        <div className="space-y-2 text-sm text-brand-text-secondary">
          <div className="flex justify-between">
            <span>Έκδοση</span>
            <span className="font-mono">2.0.0-alpha</span>
          </div>
          <div className="flex justify-between">
            <span>Supabase</span>
            <span className="font-mono text-xs">ynxcbvfhrwuenjnvsceq</span>
          </div>
        </div>
      </Card>
    </div>
  )
}
