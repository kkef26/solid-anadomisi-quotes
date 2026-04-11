import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Calendar, FileText, Briefcase, Users, ArrowRight } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Card, CardHeader } from '@/components/ui/Card'
import { StatusBadge } from '@/components/ui/StatusBadge'
import type { Appointment, Proposal, Job } from '@/types'

interface DashboardStats {
  customers: number
  proposals: number
  activeJobs: number
  todayAppointments: number
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({ customers: 0, proposals: 0, activeJobs: 0, todayAppointments: 0 })
  const [recentProposals, setRecentProposals] = useState<Proposal[]>([])
  const [upcomingAppts, setUpcomingAppts] = useState<Appointment[]>([])
  const [activeJobs, setActiveJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const today = new Date().toISOString().split('T')[0]

      const [customersRes, proposalsRes, jobsRes, apptsRes, recentPropRes, upcomingRes, activeRes] = await Promise.all([
        supabase.from('ergo_customers').select('id', { count: 'exact', head: true }),
        supabase.from('ergo_proposals').select('id', { count: 'exact', head: true }),
        supabase.from('ergo_jobs').select('id', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('ergo_appointments').select('id', { count: 'exact', head: true }).gte('scheduled_at', today).lt('scheduled_at', today + 'T23:59:59'),
        supabase.from('ergo_proposals').select('*, customer:ergo_customers(full_name)').order('created_at', { ascending: false }).limit(5),
        supabase.from('ergo_appointments').select('*, customer:ergo_customers(full_name)').gte('scheduled_at', new Date().toISOString()).order('scheduled_at').limit(5),
        supabase.from('ergo_jobs').select('*, customer:ergo_customers(full_name)').eq('status', 'active').order('created_at', { ascending: false }).limit(5),
      ])

      setStats({
        customers: customersRes.count || 0,
        proposals: proposalsRes.count || 0,
        activeJobs: jobsRes.count || 0,
        todayAppointments: apptsRes.count || 0,
      })
      setRecentProposals((recentPropRes.data || []) as unknown as Proposal[])
      setUpcomingAppts((upcomingRes.data || []) as unknown as Appointment[])
      setActiveJobs((activeRes.data || []) as unknown as Job[])
      setLoading(false)
    }
    load()
  }, [])

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-24 bg-brand-surface rounded-[6px]" />)}
        </div>
      </div>
    )
  }

  const statCards = [
    { label: 'Σημερινά Ραντεβού', value: stats.todayAppointments, icon: Calendar, color: 'text-blue-600 bg-blue-50' },
    { label: 'Προσφορές', value: stats.proposals, icon: FileText, color: 'text-brand-primary bg-orange-50' },
    { label: 'Ενεργά Έργα', value: stats.activeJobs, icon: Briefcase, color: 'text-green-600 bg-green-50' },
    { label: 'Πελάτες', value: stats.customers, icon: Users, color: 'text-purple-600 bg-purple-50' },
  ]

  return (
    <div className="space-y-6">
      <h1 className="text-lg font-semibold text-brand-text">Πίνακας Ελέγχου</h1>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {statCards.map(({ label, value, icon: Icon, color }) => (
          <Card key={label}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-brand-text-secondary">{label}</p>
                <p className="text-2xl font-semibold font-mono mt-1">{value}</p>
              </div>
              <div className={`p-2 rounded-[6px] ${color}`}>
                <Icon size={18} />
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Upcoming Appointments */}
        <Card padding="none">
          <div className="p-4 pb-2">
            <CardHeader
              title="Επόμενα Ραντεβού"
              action={
                <Link to="/imerologio" className="text-xs text-brand-primary hover:underline flex items-center gap-1">
                  Όλα <ArrowRight size={12} />
                </Link>
              }
            />
          </div>
          {upcomingAppts.length === 0 ? (
            <p className="px-4 pb-4 text-sm text-brand-text-secondary">Κανένα ραντεβού</p>
          ) : (
            <div className="divide-y divide-brand-border">
              {upcomingAppts.map((a) => (
                <div key={a.id} className="px-4 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-brand-text">{a.title}</p>
                    <p className="text-xs text-brand-text-secondary">
                      {(a as any).customer ? ((a as any).customer as Record<string, string>).full_name : '—'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-mono text-brand-text-secondary">
                      {new Date(a.scheduled_at).toLocaleDateString('el-GR', { day: '2-digit', month: 'short' })}
                    </p>
                    <StatusBadge status={a.status} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Recent Proposals */}
        <Card padding="none">
          <div className="p-4 pb-2">
            <CardHeader
              title="Πρόσφατες Προσφορές"
              action={
                <Link to="/prosfores" className="text-xs text-brand-primary hover:underline flex items-center gap-1">
                  Όλες <ArrowRight size={12} />
                </Link>
              }
            />
          </div>
          {recentProposals.length === 0 ? (
            <p className="px-4 pb-4 text-sm text-brand-text-secondary">Καμία προσφορά</p>
          ) : (
            <div className="divide-y divide-brand-border">
              {recentProposals.map((p) => (
                <Link key={p.id} to={`/prosfores/${p.id}`} className="block px-4 py-3 hover:bg-brand-muted transition-colors">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-brand-text">
                        {p.proposal_number || 'Χωρίς αριθμό'}
                      </p>
                      <p className="text-xs text-brand-text-secondary">
                        {(p as any).customer ? ((p as any).customer as Record<string, string>).full_name : '—'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-mono font-medium">
                        {p.total > 0 ? `€${p.total.toLocaleString('el-GR')}` : '—'}
                      </p>
                      <StatusBadge status={p.status} />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Active Jobs */}
      {activeJobs.length > 0 && (
        <Card padding="none">
          <div className="p-4 pb-2">
            <CardHeader
              title="Ενεργά Έργα"
              action={
                <Link to="/erga" className="text-xs text-brand-primary hover:underline flex items-center gap-1">
                  Όλα <ArrowRight size={12} />
                </Link>
              }
            />
          </div>
          <div className="divide-y divide-brand-border">
            {activeJobs.map((j) => (
              <Link key={j.id} to={`/erga/${j.id}`} className="block px-4 py-3 hover:bg-brand-muted transition-colors">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-brand-text">
                      {j.title || j.job_number || 'Χωρίς τίτλο'}
                    </p>
                    <p className="text-xs text-brand-text-secondary">{j.address || '—'}</p>
                  </div>
                  <StatusBadge status={j.status} />
                </div>
              </Link>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}
