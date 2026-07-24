import * as React from "react"
import { Link } from "react-router-dom"
import { pdf } from "@react-pdf/renderer"
import {
  ChevronDown,
  ChevronUp,
  ChevronsUpDown,
  Download,
  Eye,
  Trash2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useDeleteInvoice, useInvoices } from "@/hooks/use-invoices"
import { useClients } from "@/hooks/use-clients"
import { useBusinessProfile } from "@/hooks/use-business-profile"
import { useDocumentTitle } from "@/hooks/use-document-title"
import { InvoiceDocument } from "@/components/invoice-pdf"
import { currencySymbol, invoiceTotal, type Client, type Invoice } from "@/data/types"

type SortKey = "number" | "client" | "status" | "issueDate" | "dueDate" | "total"
type SortDir = "asc" | "desc"

function SortableHead({
  label,
  sortKey,
  activeKey,
  dir,
  onSort,
  className,
}: {
  label: string
  sortKey: SortKey
  activeKey: SortKey | null
  dir: SortDir
  onSort: (key: SortKey) => void
  className?: string
}) {
  const isActive = activeKey === sortKey
  const Icon = isActive ? (dir === "asc" ? ChevronUp : ChevronDown) : ChevronsUpDown
  return (
    <TableHead className={className}>
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className={cn(
          "inline-flex items-center gap-1 hover:text-foreground",
          isActive ? "text-foreground" : "text-muted-foreground"
        )}
      >
        {label}
        <Icon className="size-3.5" />
      </button>
    </TableHead>
  )
}

export function Invoices() {
  useDocumentTitle()
  const { data: invoices = [], isLoading } = useInvoices()
  const { data: clients = [] } = useClients()
  const { profile } = useBusinessProfile()
  const deleteInvoice = useDeleteInvoice()
  const [downloadingId, setDownloadingId] = React.useState<string | null>(null)
  const [sortKey, setSortKey] = React.useState<SortKey | null>(null)
  const [sortDir, setSortDir] = React.useState<SortDir>("asc")
  const [deleteTarget, setDeleteTarget] = React.useState<Invoice | null>(null)

  const clientNameById = React.useMemo(
    () => new Map(clients.map((c) => [c.id, c.name])),
    [clients]
  )

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((prev) => (prev === "asc" ? "desc" : "asc"))
    } else {
      setSortKey(key)
      setSortDir("asc")
    }
  }

  const sortedInvoices = React.useMemo(() => {
    if (!sortKey) return invoices
    const dir = sortDir === "asc" ? 1 : -1
    const compare = (a: Invoice, b: Invoice): number => {
      switch (sortKey) {
        case "number":
          return a.number.localeCompare(b.number)
        case "client":
          return (clientNameById.get(a.clientId) ?? "").localeCompare(
            clientNameById.get(b.clientId) ?? ""
          )
        case "status":
          return a.status.localeCompare(b.status)
        case "issueDate":
          return a.issueDate.localeCompare(b.issueDate)
        case "dueDate":
          return a.dueDate.localeCompare(b.dueDate)
        case "total":
          return invoiceTotal(a) - invoiceTotal(b)
      }
    }
    return [...invoices].sort((a, b) => compare(a, b) * dir)
  }, [invoices, sortKey, sortDir, clientNameById])

  const downloadPdf = async (invoice: Invoice, client: Client | undefined) => {
    const blob = await pdf(
      <InvoiceDocument invoice={invoice} client={client} business={profile} />
    ).toBlob()
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `${invoice.number}.pdf`
    link.click()
    URL.revokeObjectURL(url)
  }

  const handleDownload = async (invoice: Invoice) => {
    setDownloadingId(invoice.id)
    try {
      const client = clients.find((c) => c.id === invoice.clientId)
      await downloadPdf(invoice, client)
    } finally {
      setDownloadingId(null)
    }
  }

  const confirmDelete = () => {
    if (deleteTarget) {
      deleteInvoice.mutate(deleteTarget.id)
      setDeleteTarget(null)
    }
  }

  const pendingInvoices = invoices.filter((i) => i.status !== "paid")
  const pendingCurrencies = new Set(pendingInvoices.map((i) => i.currency ?? "USD"))
  const pendingTotal = pendingInvoices.reduce((sum, i) => sum + invoiceTotal(i), 0)

  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto w-full">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold">Invoices</h1>
          {!isLoading && invoices.length > 0 ? (
            <p className="text-sm text-muted-foreground">
              {pendingInvoices.length === 0
                ? "No pending invoices."
                : `${pendingInvoices.length} pending invoice${pendingInvoices.length === 1 ? "" : "s"}` +
                  (pendingCurrencies.size === 1
                    ? ` · ${currencySymbol([...pendingCurrencies][0])}${pendingTotal.toFixed(2)} owed`
                    : "")}
            </p>
          ) : null}
        </div>
        <Button asChild>
          <Link to="/app/invoices/new">New invoice</Link>
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <SortableHead
              label="Number"
              sortKey="number"
              activeKey={sortKey}
              dir={sortDir}
              onSort={handleSort}
            />
            <SortableHead
              label="Client"
              sortKey="client"
              activeKey={sortKey}
              dir={sortDir}
              onSort={handleSort}
            />
            <SortableHead
              label="Status"
              sortKey="status"
              activeKey={sortKey}
              dir={sortDir}
              onSort={handleSort}
            />
            <SortableHead
              label="Issue date"
              sortKey="issueDate"
              activeKey={sortKey}
              dir={sortDir}
              onSort={handleSort}
            />
            <SortableHead
              label="Due date"
              sortKey="dueDate"
              activeKey={sortKey}
              dir={sortDir}
              onSort={handleSort}
            />
            <SortableHead
              label="Total"
              sortKey="total"
              activeKey={sortKey}
              dir={sortDir}
              onSort={handleSort}
              className="text-right"
            />
            <TableHead className="w-10" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading && (
            <TableRow>
              <TableCell colSpan={7}>Loading…</TableCell>
            </TableRow>
          )}
          {!isLoading && invoices.length === 0 && (
            <TableRow>
              <TableCell colSpan={7} className="text-muted-foreground">
                No invoices yet.
              </TableCell>
            </TableRow>
          )}
          {sortedInvoices.map((invoice) => {
            const rowClient = clients.find((c) => c.id === invoice.clientId)
            return (
            <TableRow key={invoice.id}>
              <TableCell>
                <Link to={`/app/invoices/${invoice.id}`} className="underline">
                  {invoice.number}
                </Link>
              </TableCell>
              <TableCell>{rowClient?.name ?? "—"}</TableCell>
              <TableCell>
                <Badge variant={invoice.status === "paid" ? "default" : "secondary"}>
                  {invoice.status}
                </Badge>
              </TableCell>
              <TableCell>{invoice.issueDate}</TableCell>
              <TableCell>{invoice.dueDate}</TableCell>
              <TableCell className="text-right">
                {currencySymbol(invoice.currency)}
                {invoiceTotal(invoice).toFixed(2)}
              </TableCell>
              <TableCell>
                <div className="flex justify-end gap-1">
                  <Button variant="ghost" size="icon" asChild>
                    <Link to={`/app/invoices/${invoice.id}/preview`} title="Preview">
                      <Eye className="size-4" />
                    </Link>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    title="Download PDF"
                    disabled={downloadingId === invoice.id}
                    onClick={() => handleDownload(invoice)}
                  >
                    <Download className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    title="Delete"
                    onClick={() => setDeleteTarget(invoice)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
            )
          })}
        </TableBody>
      </Table>

      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete invoice?</DialogTitle>
            <DialogDescription>
              {deleteTarget
                ? `${deleteTarget.number} will be permanently deleted. This can't be undone.`
                : null}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
