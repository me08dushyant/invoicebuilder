import * as React from "react"
import { Link, NavLink, Outlet } from "react-router-dom"
import { Building2, FileText, Users } from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/hooks/use-auth"
import { Button } from "@/components/ui/button"
import { GitHubIcon } from "@/components/github-icon"

const navItems = [
  { to: "/app", label: "Invoices", icon: FileText, end: true },
  { to: "/app/clients", label: "Clients", icon: Users },
  { to: "/app/business-profile", label: "Your business", icon: Building2 },
]

export function RootLayout() {
  const { user, cloudEnabled, signInWithGitHub, signOut } = useAuth()
  const [redirectingToGithub, setRedirectingToGithub] = React.useState(false)
  const [githubError, setGithubError] = React.useState<string | null>(null)

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
    <div className="min-h-svh grid grid-cols-[220px_1fr]">
      <aside className="border-r border-neutral-800 bg-neutral-900 text-neutral-100 flex flex-col gap-1 p-4">
        <Link to="/" className="font-semibold px-2 mb-4 hover:text-white">
          FreeInvoiceBuilder
        </Link>
        {navItems.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm",
                isActive
                  ? "bg-neutral-800 text-white"
                  : "text-neutral-400 hover:bg-neutral-800 hover:text-neutral-100"
              )
            }
          >
            <Icon className="size-4" />
            {label}
          </NavLink>
        ))}
        <div className="mt-auto px-2 text-xs text-neutral-400">
          {cloudEnabled && user ? (
            <div className="flex flex-col gap-2">
              <span>{user.email}</span>
              <Button
                variant="outline"
                size="sm"
                className="border-neutral-700 bg-transparent text-neutral-100 hover:bg-neutral-800 hover:text-white"
                onClick={() => signOut()}
              >
                Sign out
              </Button>
            </div>
          ) : cloudEnabled ? (
            <div className="flex flex-col gap-1.5">
              <Button
                size="sm"
                onClick={handleGitHub}
                disabled={redirectingToGithub}
                className="border-neutral-700 bg-transparent text-neutral-100 hover:bg-neutral-800 hover:text-white"
                variant="outline"
              >
                <GitHubIcon />
                {redirectingToGithub ? "Redirecting…" : "Sign in with GitHub"}
              </Button>
              {githubError ? <span className="text-destructive">{githubError}</span> : null}
            </div>
          ) : (
            <span>Guest mode (data stays on this device)</span>
          )}
        </div>
      </aside>
      <main className="p-6">
        <Outlet />
      </main>
    </div>
  )
}
