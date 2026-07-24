import { useLocation, useNavigate, useParams, Link } from "react-router-dom"
import { PDFViewer, PDFDownloadLink } from "@react-pdf/renderer"
import { ArrowLeft, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useInvoices } from "@/hooks/use-invoices"
import { useClients } from "@/hooks/use-clients"
import { useBusinessProfile } from "@/hooks/use-business-profile"
import { useDocumentTitle } from "@/hooks/use-document-title"
import { InvoiceDocument } from "@/components/invoice-pdf"

export function InvoicePreview() {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { data: invoices = [], isLoading } = useInvoices()
  const { data: clients = [] } = useClients()
  const { profile } = useBusinessProfile()

  const invoice = invoices.find((inv) => inv.id === id)
  const client = clients.find((c) => c.id === invoice?.clientId)

  useDocumentTitle(invoice ? `Invoice preview | ${invoice.number}` : "Invoice preview")

  if (isLoading) {
    return <p className="text-muted-foreground">Loading…</p>
  }

  if (!invoice) {
    return (
      <div className="flex flex-col gap-4">
        <p className="text-muted-foreground">Invoice not found.</p>
        <Button asChild variant="outline" className="w-fit">
          <Link to="/app/invoices">Back to invoices</Link>
        </Button>
      </div>
    )
  }

  const document = <InvoiceDocument invoice={invoice} client={client} business={profile} />

  // Go back to wherever the user actually came from (the invoices list, or
  // the editor's own Preview button) rather than always assuming "edit" —
  // landing here straight from the list shouldn't dump you into edit mode.
  // `location.key === "default"` means this was a direct load/refresh with
  // no in-app history to return to, so fall back to the list.
  const handleBack = () => {
    if (location.key !== "default") {
      navigate(-1)
    } else {
      navigate("/app/invoices")
    }
  }

  return (
    <div className="flex flex-col gap-4 h-full">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={handleBack}>
          <ArrowLeft className="size-4" /> Back
        </Button>
        <PDFDownloadLink document={document} fileName={`${invoice.number}.pdf`}>
          {({ loading }) => (
            <Button disabled={loading}>
              <Download className="size-4" /> {loading ? "Preparing…" : "Download PDF"}
            </Button>
          )}
        </PDFDownloadLink>
      </div>

      <PDFViewer className="w-full grow rounded-md border" style={{ minHeight: "80vh" }}>
        {document}
      </PDFViewer>
    </div>
  )
}
