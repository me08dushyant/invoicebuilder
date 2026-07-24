import * as React from "react"
import { useQueryClient } from "@tanstack/react-query"
import type { Session, User } from "@supabase/supabase-js"
import { isCloudConfigured, supabase } from "@/data/supabase"
import { migrateGuestDataToCloud } from "@/data/repository"

// Guards the guest -> cloud migration to run at most once per device, not
// once per sign-in — otherwise switching accounts on the same browser (or
// just refreshing) would re-upload or duplicate data.
const MIGRATION_FLAG_KEY = "fib-guest-migrated"

interface AuthContextValue {
  user: User | null
  session: Session | null
  loading: boolean
  cloudEnabled: boolean
  signInWithEmail: (email: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
}

const AuthContext = React.createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = React.useState<Session | null>(null)
  const [loading, setLoading] = React.useState(isCloudConfigured)
  const queryClient = useQueryClient()

  React.useEffect(() => {
    if (!supabase) {
      setLoading(false)
      return
    }

    // Fires for a fresh sign-in and for a session already persisted from a
    // previous visit alike — either way, if this device has a signed-in
    // user and hasn't migrated yet, it should.
    const maybeMigrate = (activeSession: Session | null) => {
      if (!activeSession?.user || localStorage.getItem(MIGRATION_FLAG_KEY)) return
      localStorage.setItem(MIGRATION_FLAG_KEY, "1")
      const userId = activeSession.user.id
      migrateGuestDataToCloud(userId)
        .then(() => {
          queryClient.invalidateQueries({ queryKey: ["invoices", userId] })
          queryClient.invalidateQueries({ queryKey: ["clients", userId] })
        })
        .catch((err) => {
          console.error("Guest data migration failed:", err)
        })
    }

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
      maybeMigrate(data.session)
    })
    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession)
      maybeMigrate(newSession)
    })
    return () => listener.subscription.unsubscribe()
  }, [queryClient])

  const signInWithEmail = React.useCallback(async (email: string) => {
    if (!supabase) return { error: "Cloud sync isn't configured yet." }
    const { error } = await supabase.auth.signInWithOtp({ email })
    return { error: error?.message ?? null }
  }, [])

  const signOut = React.useCallback(async () => {
    if (!supabase) return
    await supabase.auth.signOut()
  }, [])

  const value: AuthContextValue = {
    user: session?.user ?? null,
    session,
    loading,
    cloudEnabled: isCloudConfigured,
    signInWithEmail,
    signOut,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = React.useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within AuthProvider")
  return ctx
}
