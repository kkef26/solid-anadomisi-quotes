import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAppStore } from '@/lib/store'
import type { ErgoUser, Organization } from '@/types'

export function useAuth() {
  const { user, org, loading, setUser, setOrg, setLoading } = useAppStore()

  useEffect(() => {
    let mounted = true

    async function loadSession() {
      const { data: { session } } = await supabase.auth.getSession()

      if (!session?.user || !mounted) {
        setLoading(false)
        return
      }

      // Load ergo_user profile
      const { data: ergoUser } = await supabase
        .from('ergo_users')
        .select('*')
        .eq('id', session.user.id)
        .single()

      if (ergoUser && mounted) {
        setUser(ergoUser as ErgoUser)

        // Load org
        const { data: orgData } = await supabase
          .from('ergo_organizations')
          .select('*')
          .eq('id', ergoUser.org_id)
          .single()

        if (orgData && mounted) {
          setOrg(orgData as Organization)
        }
      }

      if (mounted) setLoading(false)
    }

    loadSession()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (!session?.user) {
          setUser(null)
          setOrg(null)
          return
        }

        const { data: ergoUser } = await supabase
          .from('ergo_users')
          .select('*')
          .eq('id', session.user.id)
          .single()

        if (ergoUser) {
          setUser(ergoUser as ErgoUser)
          const { data: orgData } = await supabase
            .from('ergo_organizations')
            .select('*')
            .eq('id', ergoUser.org_id)
            .single()
          if (orgData) setOrg(orgData as Organization)
        }
      }
    )

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [setUser, setOrg, setLoading])

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setOrg(null)
  }

  return { user, org, loading, signIn, signOut }
}
