// Ergotaxia v2 — Core Types

export interface Organization {
  id: string
  name: string
  slug: string
  logo_url: string | null
  brand_colors: Record<string, string>
  contact_email: string | null
  contact_phone: string | null
  address: string | null
  google_calendar_id: string | null
  settings: Record<string, unknown>
  created_at: string
  updated_at: string
}

export interface ErgoUser {
  id: string
  org_id: string
  role: 'admin' | 'contractor' | 'secretary'
  full_name: string
  phone: string | null
  email: string | null
  avatar_url: string | null
  created_at: string
  updated_at: string
}

export interface Customer {
  id: string
  org_id: string
  full_name: string
  company: string | null
  phone: string | null
  email: string | null
  address: string | null
  city: string | null
  area: string | null
  postal_code: string | null
  vat_number: string | null
  notes: string | null
  tags: string[]
  source: 'referral' | 'website' | 'phone' | 'other' | null
  total_quoted: number
  total_paid: number
  job_count: number
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export interface Appointment {
  id: string
  org_id: string
  customer_id: string | null
  assigned_to: string | null
  title: string
  address: string | null
  scheduled_at: string
  duration_minutes: number
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled'
  google_event_id: string | null
  notes: string | null
  created_at: string
  updated_at: string
  // Joined
  customer?: Customer
  assignee?: ErgoUser
}

export interface Walkthrough {
  id: string
  org_id: string
  customer_id: string | null
  appointment_id: string | null
  raw_text: string | null
  structured_items: WalkthroughItem[]
  status: 'draft' | 'reviewed' | 'converted'
  created_by: string | null
  created_at: string
  updated_at: string
  // Joined
  customer?: Customer
}

export interface WalkthroughItem {
  category: string
  description: string
  notes: string | null
  photos: string[]
}

export interface Proposal {
  id: string
  org_id: string
  customer_id: string | null
  walkthrough_id: string | null
  proposal_number: string | null
  entity: string | null
  status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired'
  subtotal: number
  vat_pct: number
  vat_amount: number
  total: number
  valid_until: string | null
  payment_terms: string | null
  notes: string | null
  internal_notes: string | null
  sent_via: 'email' | 'viber' | 'whatsapp' | 'hand' | null
  sent_at: string | null
  accepted_at: string | null
  rejected_at: string | null
  template_id: string | null
  created_by: string | null
  created_at: string
  updated_at: string
  deleted_at: string | null
  // Joined
  customer?: Customer
  items?: ProposalItem[]
}

export interface ProposalItem {
  id: string
  proposal_id: string
  sort_order: number
  category: string | null
  description: string | null
  unit: string | null
  quantity: number
  unit_price: number
  total: number
  notes: string | null
  is_additional: boolean
  created_at: string
  updated_at: string
}

export interface Job {
  id: string
  org_id: string
  customer_id: string | null
  proposal_id: string | null
  job_number: string | null
  title: string | null
  address: string | null
  status: 'setup' | 'active' | 'paused' | 'completed' | 'cancelled'
  start_date: string | null
  estimated_end_date: string | null
  actual_end_date: string | null
  budget: number
  actual_cost: number
  notes: string | null
  created_at: string
  updated_at: string
  // Joined
  customer?: Customer
  pieces?: JobPiece[]
  proposal?: Proposal
}

export interface JobPiece {
  id: string
  job_id: string
  proposal_item_id: string | null
  category: string | null
  description: string | null
  execution_type: 'internal' | 'subcontract'
  status: 'pending' | 'in_progress' | 'completed'
  estimated_cost: number
  actual_cost: number
  notes: string | null
  created_at: string
  updated_at: string
}

export interface Worker {
  id: string
  org_id: string
  full_name: string
  company: string | null
  phone: string | null
  email: string | null
  worker_type: 'employee' | 'subcontractor'
  specialties: string[]
  rating: number | null
  notes: string | null
  total_paid: number
  job_count: number
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export interface WorkerAssignment {
  id: string
  job_piece_id: string
  worker_id: string
  worker_quote: number
  deposit_paid: number
  total_paid: number
  bonus: number
  notes: string | null
  status: 'assigned' | 'active' | 'completed' | 'disputed'
  created_at: string
  updated_at: string
  // Joined
  worker?: Worker
}

export interface Payment {
  id: string
  org_id: string
  job_id: string | null
  direction: 'incoming' | 'outgoing'
  payment_type: 'deposit' | 'progress' | 'final' | 'bonus' | 'material' | 'extra'
  related_type: 'customer' | 'worker' | 'supplier' | null
  related_id: string | null
  amount: number
  method: 'cash' | 'transfer' | 'check' | 'card' | null
  description: string | null
  receipt_url: string | null
  paid_at: string
  created_at: string
}

export interface Material {
  id: string
  job_id: string
  job_piece_id: string | null
  description: string | null
  supplier: string | null
  quantity: number
  unit: string | null
  unit_cost: number
  total_cost: number
  invoice_url: string | null
  notes: string | null
  purchased_at: string | null
  created_at: string
}

export interface Photo {
  id: string
  job_id: string
  job_piece_id: string | null
  worker_assignment_id: string | null
  storage_path: string
  caption: string | null
  taken_at: string | null
  created_at: string
}

export interface QuoteAdjustment {
  id: string
  job_id: string
  original_proposal_id: string | null
  adjustment_type: 'quantity_change' | 'new_scope' | 'price_change'
  description: string | null
  old_value: string | null
  new_value: string | null
  amount_difference: number
  approved_by_customer: boolean
  approved_at: string | null
  created_at: string
}

// Greek status labels
export const STATUS_LABELS: Record<string, string> = {
  // Proposal
  draft: 'Πρόχειρο',
  sent: 'Εστάλη',
  accepted: 'Εγκρίθηκε',
  rejected: 'Απορρίφθηκε',
  expired: 'Έληξε',
  // Job
  setup: 'Ρύθμιση',
  active: 'Ενεργό',
  paused: 'Σε παύση',
  completed: 'Ολοκληρώθηκε',
  cancelled: 'Ακυρώθηκε',
  // Appointment
  pending: 'Εκκρεμεί',
  confirmed: 'Επιβεβαιωμένο',
  // Job piece
  in_progress: 'Σε εξέλιξη',
  // Worker
  assigned: 'Ανατεθειμένο',
  disputed: 'Αμφισβητούμενο',
  // Walkthrough
  reviewed: 'Ελεγμένο',
  converted: 'Μετατράπηκε',
}

export const PAYMENT_TYPE_LABELS: Record<string, string> = {
  deposit: 'Προκαταβολή',
  progress: 'Δόση',
  final: 'Εξόφληση',
  bonus: 'Μπόνους',
  material: 'Υλικά',
  extra: 'Έξτρα',
}

export const METHOD_LABELS: Record<string, string> = {
  cash: 'Μετρητά',
  transfer: 'Μεταφορά',
  check: 'Επιταγή',
  card: 'Κάρτα',
}
