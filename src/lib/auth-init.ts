import { supabase } from '@/lib/supabase'
import { useAppStore } from '@/lib/store'
import type { ErgoUser, Organization } from '@/types'

const { setUser, setOrg, setLoading } = useAppStore.getState()

async function loadProfile(userId: string) {
  const { data: ergoUser } = await supabase
    .from('ergo_users')
    .select('*')
    .eq('id', userId)
    .single()

  if (ergoUser) {
    setUser(ergoUser as ErgoUser)
    const { data: orgData } = await supabase
      .from('ergo_organizations')
      .select('*')
      .eq('id', (ergoUser as ErgoUser).org_id)
      .single()
    if (orgData) setOrg(orgData as Organization)
  }
}

// Run once on app boot — NOT inside React
async function initAuth() {
  const { data: { session } } = await supabase.auth.getSession()

  if (session?.user) {
    await loadProfile(session.user.id)
  }

  setLoading(false)

  // Single subscription for the lifetime of the app
  supabase.auth.onAuthStateChange(async (_event, session) => {
    if (!session?.user) {
      setUser(null)
      setOrg(null)
      return
    }

    setLoading(true)
    await loadProfile(session.user.id)
    setLoading(false)
  })
}

initAuth()
