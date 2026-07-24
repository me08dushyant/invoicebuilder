import * as React from "react"
import { Link, useNavigate } from "react-router-dom"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/hooks/use-auth"
import { useDocumentTitle } from "@/hooks/use-document-title"

export function Login() {
  useDocumentTitle("Login")
  const { user, signInWithEmail, cloudEnabled } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = React.useState("")
  const [status, setStatus] = React.useState<string | null>(null)
  const [sending, setSending] = React.useState(false)

  React.useEffect(() => {
    if (user) navigate("/app", { replace: true })
  }, [user, navigate])

  if (!cloudEnabled) {
    return (
      <div className="min-h-svh flex items-center justify-center p-6">
        <Card className="max-w-sm">
          <CardHeader>
            <CardTitle>Cloud sync not configured</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 text-sm text-muted-foreground">
            <p>
              Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY in .env.local to
              enable sign-in and cross-device sync. Until then, your data stays
              on this device.
            </p>
            <Button asChild variant="outline" className="w-fit">
              <Link to="/app">Continue as guest instead</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSending(true)
    setStatus(null)
    try {
      const { error } = await signInWithEmail(email)
      setStatus(error ?? "Check your email for a sign-in link.")
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="min-h-svh flex items-center justify-center p-6">
      <Card className="max-w-sm w-full">
        <CardHeader>
          <CardTitle>Sign in</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Button type="submit" disabled={sending}>
              {sending ? "Sending…" : "Send magic link"}
            </Button>
            {sending ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" />
                Sending the magic link…
              </div>
            ) : status ? (
              <p className="text-sm text-muted-foreground">{status}</p>
            ) : null}
          </form>
          <Button asChild variant="link" className="px-0 mt-2">
            <Link to="/app">Continue as guest instead</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
