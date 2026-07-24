import { Link } from "react-router-dom"
import { FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useDocumentTitle } from "@/hooks/use-document-title"

export function Landing() {
  useDocumentTitle()
  return (
    <div className="min-h-svh flex flex-col items-center justify-center gap-8 p-6 text-center">
      <div className="flex flex-col items-center gap-3">
        <div className="flex items-center gap-2 text-xl font-semibold">
          <FileText className="size-6" />
          FreeInvoiceBuilder
        </div>
        <p className="text-muted-foreground max-w-sm">
          Create, preview, and download professional invoices as a PDF —
          free, with no account required.
        </p>
      </div>

      <div className="flex items-center gap-3">
        <Button asChild size="lg">
          <Link to="/app">Continue as guest</Link>
        </Button>
        <Button asChild size="lg" variant="outline">
          <Link to="/login">Login</Link>
        </Button>
      </div>

      <p className="text-xs text-muted-foreground max-w-sm">
        Guest invoices are stored only on this device. Login to sync them
        across devices instead.
      </p>
    </div>
  )
}
