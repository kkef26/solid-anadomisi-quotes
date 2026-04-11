import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { AppShell } from '@/components/layouts/AppShell'
import Login from '@/pages/Login'
import Dashboard from '@/pages/Dashboard'
import Leads from '@/pages/Leads'
import CalendarPage from '@/pages/CalendarPage'
import Proposals from '@/pages/Proposals'
import Jobs from '@/pages/Jobs'
import JobDetail from '@/pages/JobDetail'
import WalkthroughCapture from '@/pages/WalkthroughCapture'
import Customers from '@/pages/Customers'
import Workers from '@/pages/Workers'
import SettingsPage from '@/pages/SettingsPage'

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-muted flex items-center justify-center">
        <div className="w-10 h-10 rounded-[6px] bg-brand-primary animate-pulse flex items-center justify-center">
          <span className="text-white text-lg font-semibold">Ε</span>
        </div>
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />
  return <>{children}</>
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          element={
            <RequireAuth>
              <AppShell />
            </RequireAuth>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="aitimata" element={<Leads />} />
          <Route path="imerologio" element={<CalendarPage />} />
          <Route path="prosfores" element={<Proposals />} />
          <Route path="prosfores/:id" element={<div className="p-4 text-brand-text-secondary">Λεπτομέρειες Προσφοράς — σύντομα</div>} />
          <Route path="prosfores/nea" element={<div className="p-4 text-brand-text-secondary">Νέα Προσφορά — σύντομα</div>} />
          <Route path="erga" element={<Jobs />} />
          <Route path="erga/:id" element={<JobDetail />} />
          <Route path="aftopsia/:id" element={<WalkthroughCapture />} />
          <Route path="pelates" element={<Customers />} />
          <Route path="pelates/:id" element={<div className="p-4 text-brand-text-secondary">Λεπτομέρειες Πελάτη — σύντομα</div>} />
          <Route path="synergates" element={<Workers />} />
          <Route path="rithmiseis" element={<SettingsPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
