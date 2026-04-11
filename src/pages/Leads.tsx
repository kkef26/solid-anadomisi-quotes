import { PhoneIncoming } from 'lucide-react'
import { EmptyState } from '@/components/ui/EmptyState'
import { Button } from '@/components/ui/Button'

export default function Leads() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-brand-text">Αιτήματα</h1>
        <Button size="sm">+ Νέο Αίτημα</Button>
      </div>
      <EmptyState
        icon={<PhoneIncoming size={32} />}
        title="Κανένα αίτημα"
        description="Τα αιτήματα εμφανίζονται εδώ όταν ένας πελάτης καλεί ή στέλνει email."
      />
    </div>
  )
}
