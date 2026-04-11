import { supabase } from '@/lib/supabase'
import { useAppStore } from '@/lib/store'

export function useAuth() {
  const { user, org, loading } = useAppStore()

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    useAppStore.getState().setUser(null)
    useAppStore.getState().setOrg(null)
  }

  return { user, org, loading, signIn, signOut }
}
