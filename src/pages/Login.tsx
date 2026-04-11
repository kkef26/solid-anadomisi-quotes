import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/Button'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { user, signIn } = useAuth()
  const navigate = useNavigate()

  // When user state is populated (by onAuthStateChange), redirect to dashboard
  useEffect(() => {
    if (user) {
      navigate('/', { replace: true })
    }
  }, [user, navigate])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error } = await signIn(email, password)
    if (error) {
      setError(error.message)
      setLoading(false)
    }
    // Don't navigate here — the useEffect above will handle it
    // once onAuthStateChange loads the profile and sets `user`
  }

  return (
    <div className="min-h-screen bg-brand-muted flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-[6px] bg-brand-primary mx-auto flex items-center justify-center mb-4">
            <span className="text-white text-2xl font-semibold">Ε</span>
          </div>
          <h1 className="text-xl font-semibold text-brand-text">Εργοτάξια</h1>
          <p className="text-sm text-brand-text-secondary mt-1">Solid Anadomisi EE</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-brand-surface border border-brand-border rounded-[6px] p-6 space-y-4">
          {error && (
            <div className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-[4px]">{error}</div>
          )}

          <div>
            <label className="block text-xs font-medium text-brand-text-secondary mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-brand-border rounded-[2px] outline-none focus:border-brand-primary"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-brand-text-secondary mb-1">Κωδικός</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-brand-border rounded-[2px] outline-none focus:border-brand-primary"
              required
            />
          </div>

          <Button type="submit" loading={loading} className="w-full" size="lg">
            Σύνδεση
          </Button>
        </form>
      </div>
    </div>
  )
}
