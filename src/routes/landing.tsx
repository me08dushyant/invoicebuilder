import * as React from "react"
import { Link, useNavigate } from "react-router-dom"
import { FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { GitHubIcon } from "@/components/github-icon"
import { useAuth } from "@/hooks/use-auth"
import { useDocumentTitle } from "@/hooks/use-document-title"

export function Landing() {
  useDocumentTitle()
  const { user, loading, cloudEnabled, signInWithGitHub } = useAuth()
  const navigate = useNavigate()
  const [githubError, setGithubError] = React.useState<string | null>(null)
  const [redirectingToGithub, setRedirectingToGithub] = React.useState(false)

  // The GitHub OAuth callback redirects here (the site root) — if that
  // just signed you in, skip straight to the app.
  React.useEffect(() => {
    if (user) navigate("/app", { replace: true })
  }, [user, navigate])

  // While auth is still resolving (or once it has, but a signed-in user is
  // about to be redirected away), render nothing rather than flashing the
  // guest/sign-in choice for a frame.
  if (loading || user) return null

  const handleGitHub = async () => {
    setRedirectingToGithub(true)
    setGithubError(null)
    const { error } = await signInWithGitHub()
    // A success here just means the redirect to GitHub started — the page
    // is about to navigate away. Only a failure leaves us on this page.
    if (error) {
      setGithubError(error)
      setRedirectingToGithub(false)
    }
  }

  return (
    <div className="min-h-svh flex flex-col items-center justify-center gap-8 p-6 text-center">
      <div className="flex flex-col items-center gap-3">
        <div className="flex items-center gap-2 text-xl font-semibold">
          <FileText className="size-6" />
          <h1>FreeInvoiceBuilder</h1>
        </div>
        <p className="text-muted-foreground max-w-sm">
          Free invoicing for freelancers and small businesses — create,
          send, and track invoices in minutes. Sign in to sync everything
          across your devices, or jump right in as a guest.
        </p>
      </div>

      <div className="flex flex-col items-center gap-2">
        <div className="flex items-center gap-3">
          <Button asChild size="lg" variant="outline">
            <Link to="/app">Continue as guest</Link>
          </Button>
          {cloudEnabled ? (
            <Button
              type="button"
              size="lg"
              onClick={handleGitHub}
              disabled={redirectingToGithub}
              className="bg-neutral-900 text-white hover:bg-neutral-800"
            >
              <GitHubIcon />
              {redirectingToGithub ? "Redirecting…" : "Sign in with GitHub"}
            </Button>
          ) : null}
        </div>
        {githubError ? <span className="text-xs text-destructive">{githubError}</span> : null}
      </div>

      <p className="text-xs text-muted-foreground max-w-sm">
        Guest invoices are stored only on this device. Sign in to sync them
        across devices instead.
      </p>
    </div>
  )
}
