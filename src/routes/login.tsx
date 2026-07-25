import * as React from "react"
import { Link, useNavigate } from "react-router-dom"
import { FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useAuth } from "@/hooks/use-auth"
import { useDocumentTitle } from "@/hooks/use-document-title"

// lucide-react doesn't ship brand/logo icons (GitHub included), so the
// mark is a small inline SVG instead of a library import.
function GitHubIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" fill="currentColor" aria-hidden="true">
      <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.09 3.29 9.4 7.86 10.93.57.1.79-.25.79-.55 0-.27-.01-1.16-.02-2.1-3.2.7-3.88-1.36-3.88-1.36-.52-1.34-1.28-1.69-1.28-1.69-1.04-.72.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.55-.29-5.24-1.28-5.24-5.68 0-1.26.45-2.28 1.19-3.09-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11 11 0 0 1 5.79 0c2.2-1.49 3.17-1.18 3.17-1.18.64 1.59.24 2.76.12 3.05.74.81 1.18 1.83 1.18 3.09 0 4.41-2.69 5.39-5.25 5.67.41.36.78 1.06.78 2.14 0 1.55-.01 2.79-.01 3.17 0 .3.21.66.8.55A10.52 10.52 0 0 0 23.5 12c0-6.35-5.15-11.5-11.5-11.5Z" />
    </svg>
  )
}

export function Login() {
  useDocumentTitle("Login")
  const { user, loading, signInWithGitHub, cloudEnabled } = useAuth()
  const navigate = useNavigate()
  const [githubError, setGithubError] = React.useState<string | null>(null)
  const [redirectingToGithub, setRedirectingToGithub] = React.useState(false)

  React.useEffect(() => {
    if (user) navigate("/app", { replace: true })
  }, [user, navigate])

  // While auth is still resolving (or a signed-in user is about to be
  // redirected away), render nothing rather than flashing the sign-in form.
  if (loading || user) return null

  const handleGitHub = async () => {
    setRedirectingToGithub(true)
    setGithubError(null)
    const { error } = await signInWithGitHub()
    // A success here just means the redirect to GitHub started — the page
    // is about to navigate away, so there's no "signed in" state to reach
    // locally. Only a failure (e.g. the provider isn't configured yet)
    // leaves us on this page.
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
          across your devices.
        </p>
      </div>

      <Card className="max-w-sm w-full">
        <CardContent className="flex flex-col gap-4 pt-6">
          {cloudEnabled ? (
            <>
              <div className="flex flex-col gap-1.5">
                <Button
                  type="button"
                  onClick={handleGitHub}
                  disabled={redirectingToGithub}
                  className="bg-neutral-900 text-white hover:bg-neutral-800"
                >
                  <GitHubIcon />
                  {redirectingToGithub ? "Redirecting to GitHub…" : "Sign in with GitHub"}
                </Button>
                {githubError ? (
                  <span className="text-xs text-destructive">{githubError}</span>
                ) : null}
              </div>
              <Button asChild variant="link" className="px-0 w-fit self-center">
                <Link to="/app">Continue as guest instead</Link>
              </Button>
            </>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                Cloud sign-in isn't configured for this deployment yet, but
                you don't need it — everything below works fully offline,
                stored only on this device.
              </p>
              <Button asChild variant="outline" className="w-fit self-center">
                <Link to="/app">Continue as guest</Link>
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
