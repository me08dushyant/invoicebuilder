import * as React from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import { pdf } from "@react-pdf/renderer"
import { Download, MessageCircle, Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { useClients } from "@/hooks/use-clients"
import { useInvoices, useSaveInvoice } from "@/hooks/use-invoices"
import { useBusinessProfile } from "@/hooks/use-business-profile"
import { useDocumentTitle } from "@/hooks/use-document-title"
import { InvoiceDocument } from "@/components/invoice-pdf"
import { sendInvoiceViaWhatsApp } from "@/lib/send-whatsapp"
import type { BillingSnapshot, Invoice, InvoiceItem, InvoiceStatus } from "@/data/types"
import {
  buildWhatsAppMessage,
  CURRENCIES,
  currencySymbol,
  distinctContactPerson,
  invoiceSubtotal,
  invoiceTaxAmount,
  invoiceTotal,
} from "@/data/types"

function emptyItem(): InvoiceItem {
  return { id: crypto.randomUUID(), description: "", quantity: 1, unitPrice: 0 }
}

function addDays(dateStr: string, days: number): string {
  const date = new Date(dateStr)
  date.setDate(date.getDate() + days)
  return date.toISOString().slice(0, 10)
}

// Best-effort "next" number: the highest numeric run found in any existing
// invoice number, plus one, zero-padded to 4 digits. Falls back to 0001
// when there's nothing to go on (e.g. no invoices yet, or none purely
// numeric) — always just a starting suggestion, never enforced.
function nextInvoiceNumber(invoices: Invoice[]): string {
  const highest = invoices.reduce((max, inv) => {
    const parsed = parseInt(inv.number.replace(/\D/g, ""), 10)
    return Number.isFinite(parsed) && parsed > max ? parsed : max
  }, 0)
  return String(highest + 1).padStart(4, "0")
}

export function InvoiceEditor() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isNew = !id || id === "new"

  const { data: clients = [] } = useClients()
  const { data: invoices = [] } = useInvoices()
  const saveInvoice = useSaveInvoice()
  const { profile } = useBusinessProfile()
  const [downloading, setDownloading] = React.useState(false)
  const [sendingWhatsApp, setSendingWhatsApp] = React.useState(false)

  const existing = isNew ? undefined : invoices.find((inv) => inv.id === id)

  const [number, setNumber] = React.useState(existing?.number ?? "")
  const [clientId, setClientId] = React.useState(existing?.clientId ?? "")
  const [status, setStatus] = React.useState<InvoiceStatus>(existing?.status ?? "draft")
  const [issueDate, setIssueDate] = React.useState(
    existing?.issueDate ?? new Date().toISOString().slice(0, 10)
  )
  // New invoices default to a 15-day payment window — just a starting
  // point, freely editable afterward, not kept in sync with issue date.
  const [dueDate, setDueDate] = React.useState(existing?.dueDate ?? addDays(issueDate, 15))
  const [items, setItems] = React.useState<InvoiceItem[]>(
    existing?.items ?? [emptyItem()]
  )
  const [taxRate, setTaxRate] = React.useState(existing?.taxRate ?? 0)
  const [currency, setCurrency] = React.useState(existing?.currency ?? "USD")
  const [terms, setTerms] = React.useState(existing?.notes ?? "")

  useDocumentTitle(isNew ? "New invoice" : `Invoice edit | ${number}`)

  React.useEffect(() => {
    if (existing) {
      setNumber(existing.number)
      setClientId(existing.clientId)
      setStatus(existing.status)
      setIssueDate(existing.issueDate)
      setDueDate(existing.dueDate)
      setItems(existing.items)
      setTaxRate(existing.taxRate ?? 0)
      setCurrency(existing.currency ?? "USD")
      setTerms(existing.notes ?? "")
    }
  }, [existing])

  // Suggest the next number once the invoice list has actually loaded —
  // only while the field is still untouched, so it never overwrites
  // something the user already typed.
  React.useEffect(() => {
    if (isNew && number === "") {
      setNumber(nextInvoiceNumber(invoices))
    }
  }, [isNew, invoices, number])

  const isDuplicateNumber = invoices.some(
    (inv) =>
      inv.id !== existing?.id && inv.number.trim().toLowerCase() === number.trim().toLowerCase()
  )

  // A client is required, not optional: it's what makes bill-to and this
  // invoice's client_id meaningful, and the cloud (Postgres) schema stores
  // client_id as a uuid column, which rejects an empty string outright.
  const noClientSelected = !clientId

  const handleClientChange = (id: string) => {
    setClientId(id)
    const client = clients.find((c) => c.id === id)
    if (client?.currency) setCurrency(client.currency)
  }

  const updateItem = (itemId: string, patch: Partial<InvoiceItem>) => {
    setItems((prev) =>
      prev.map((item) => (item.id === itemId ? { ...item, ...patch } : item))
    )
  }

  const selectedClient = clients.find((c) => c.id === clientId)

  const subtotal = invoiceSubtotal({ items })
  const taxAmount = invoiceTaxAmount({ items, taxRate })
  const total = invoiceTotal({ items, taxRate })
  const symbol = currencySymbol(currency)

  const computedBillTo: BillingSnapshot | undefined = selectedClient
    ? {
        name: selectedClient.name,
        contactPerson: selectedClient.contactPerson,
        email: selectedClient.email,
        phone: selectedClient.phone,
        website: selectedClient.website,
        address: selectedClient.address,
        city: selectedClient.city,
        country: selectedClient.country,
        gstNumber: selectedClient.gstNumber,
        vatNumber: selectedClient.vatNumber,
        panNumber: selectedClient.panNumber,
      }
    : undefined

  const computedBillFrom: BillingSnapshot = {
    name: profile.name,
    contactPerson: profile.contactPerson,
    email: profile.email,
    phone: profile.phone,
    website: profile.website,
    address: profile.address,
    city: profile.city,
    country: profile.country,
    gstNumber: profile.gstNumber,
    vatNumber: profile.vatNumber,
    panNumber: profile.panNumber,
    bankName: profile.bankName,
    bankAccountName: profile.bankAccountName,
    bankAccountNumber: profile.bankAccountNumber,
    bankIfscSwift: profile.bankIfscSwift,
  }

  const buildPayload = (): Omit<Invoice, "id" | "createdAt" | "updatedAt"> & {
    id?: string
  } => ({
    id: existing?.id,
    number: number || String(Date.now()),
    clientId,
    status,
    issueDate,
    dueDate,
    items,
    taxRate,
    currency,
    notes: terms,
    billTo: computedBillTo,
    billFrom: computedBillFrom,
  })

  const handleSave = async () => {
    if (isDuplicateNumber || noClientSelected) return
    try {
      await saveInvoice.mutateAsync(buildPayload())
      navigate("/app/invoices")
    } catch {
      // surfaced via saveInvoice.error below
    }
  }

  const handlePreview = async () => {
    if (isDuplicateNumber || noClientSelected) return
    try {
      const saved = await saveInvoice.mutateAsync(buildPayload())
      navigate(`/app/invoices/${saved.id}/preview`)
    } catch {
      // surfaced via saveInvoice.error below
    }
  }

  const downloadPdf = async (payload: ReturnType<typeof buildPayload>) => {
    const blob = await pdf(
      <InvoiceDocument invoice={payload} client={selectedClient} business={profile} />
    ).toBlob()
    const url = URL.createObjectURL(blob)
    const link = window.document.createElement("a")
    link.href = url
    link.download = `${payload.number}.pdf`
    link.click()
    URL.revokeObjectURL(url)
  }

  const handleDownload = async () => {
    if (isDuplicateNumber || noClientSelected) return
    setDownloading(true)
    try {
      const payload = buildPayload()
      await saveInvoice.mutateAsync(payload)
      await downloadPdf(payload)
    } catch {
      // surfaced via saveInvoice.error below
    } finally {
      setDownloading(false)
    }
  }

  const handleSendWhatsApp = async () => {
    if (isDuplicateNumber || !selectedClient?.phone) return
    setSendingWhatsApp(true)
    try {
      const payload = buildPayload()
      await saveInvoice.mutateAsync(payload)
      const message = buildWhatsAppMessage({
        invoice: payload,
        clientName: selectedClient.contactPerson || selectedClient.name,
        businessName: profile.name,
      })
      await sendInvoiceViaWhatsApp({
        document: <InvoiceDocument invoice={payload} client={selectedClient} business={profile} />,
        fileName: `${payload.number}.pdf`,
        phone: selectedClient.phone,
        message,
      })
    } catch {
      // surfaced via saveInvoice.error below
    } finally {
      setSendingWhatsApp(false)
    }
  }

  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto w-full">
      <div className="grid grid-cols-[1fr_260px] gap-6 items-start">
        <div className="flex flex-col gap-6 min-w-0 rounded-xl border bg-card p-8 shadow-lg shadow-black/5">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="number">Invoice number</Label>
              <Input
                id="number"
                value={number}
                onChange={(e) => setNumber(e.target.value)}
                placeholder="0001"
                aria-invalid={isDuplicateNumber}
                className={isDuplicateNumber ? "border-destructive" : undefined}
              />
              {isDuplicateNumber ? (
                <span className="text-xs text-destructive">
                  Another invoice already uses this number.
                </span>
              ) : null}
            </div>

            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="issue-date">Issue date</Label>
                <Input
                  id="issue-date"
                  type="date"
                  value={issueDate}
                  onChange={(e) => setIssueDate(e.target.value)}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="due-date">Due date</Label>
                <Input
                  id="due-date"
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </div>
            </div>
          </div>

          {selectedClient ? (
            <div className="flex flex-col gap-0.5">
              <span className="text-xs uppercase tracking-wide text-muted-foreground">
                Bill to
              </span>
              <span className="text-sm font-medium">{selectedClient.name}</span>
              {distinctContactPerson(selectedClient) ? (
                <span className="text-sm text-muted-foreground">
                  {distinctContactPerson(selectedClient)}
                </span>
              ) : null}
              {selectedClient.email ? (
                <span className="text-sm text-muted-foreground">{selectedClient.email}</span>
              ) : null}
              {selectedClient.phone ? (
                <span className="text-sm text-muted-foreground">{selectedClient.phone}</span>
              ) : null}
              {selectedClient.website ? (
                <span className="text-sm text-muted-foreground">{selectedClient.website}</span>
              ) : null}
              {selectedClient.address ? (
                <span className="text-sm text-muted-foreground">{selectedClient.address}</span>
              ) : null}
            </div>
          ) : null}

          <Card>
            <CardContent className="flex flex-col gap-3">
              <div className="grid grid-cols-[1fr_100px_120px_36px] gap-2 text-sm font-medium text-muted-foreground">
                <span>Description</span>
                <span>Quantity</span>
                <span>Unit price</span>
                <span />
              </div>
              {items.map((item) => (
                <div key={item.id} className="grid grid-cols-[1fr_100px_120px_36px] gap-2">
                  <Input
                    placeholder="Description"
                    value={item.description}
                    onChange={(e) => updateItem(item.id, { description: e.target.value })}
                  />
                  <Input
                    type="number"
                    min={0}
                    value={item.quantity}
                    onChange={(e) =>
                      updateItem(item.id, { quantity: Number(e.target.value) })
                    }
                  />
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    value={item.unitPrice}
                    onChange={(e) =>
                      updateItem(item.id, { unitPrice: Number(e.target.value) })
                    }
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setItems((prev) => prev.filter((i) => i.id !== item.id))}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                className="w-fit"
                onClick={() => setItems((prev) => [...prev, emptyItem()])}
              >
                <Plus className="size-4" /> Add line item
              </Button>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <div className="flex flex-col gap-1.5 w-full max-w-xs">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{symbol}{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  Tax
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    value={taxRate}
                    onChange={(e) => setTaxRate(Number(e.target.value))}
                    className="h-7 w-16 px-2"
                  />
                  %
                </span>
                <span>{symbol}{taxAmount.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between text-base font-semibold border-t pt-1.5 mt-1">
                <span>Total</span>
                <span>{symbol}{total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="terms">Invoice terms</Label>
            <Textarea
              id="terms"
              value={terms}
              onChange={(e) => setTerms(e.target.value)}
              placeholder="Payment due within 15 days. Bank details, late fees, or other billing terms…"
            />
          </div>
        </div>

        <Card className="sticky top-6">
          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label>Client</Label>
              <Select value={clientId} onValueChange={handleClientChange}>
                <SelectTrigger className="w-full" aria-invalid={noClientSelected}>
                  <SelectValue placeholder="Select a client" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {clients.length === 0 ? (
                <span className="text-xs text-destructive">
                  No clients yet —{" "}
                  <Link to="/app/clients" className="underline">
                    add one
                  </Link>{" "}
                  before saving this invoice.
                </span>
              ) : noClientSelected ? (
                <span className="text-xs text-destructive">Select a client before saving.</span>
              ) : null}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>Currency</Label>
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map((c) => (
                    <SelectItem key={c.code} value={c.code}>
                      {c.code} ({c.symbol})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as InvoiceStatus)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="unpaid">Unpaid</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-2 border-t pt-4">
              {saveInvoice.isError ? (
                <p className="text-xs text-destructive">
                  Couldn't save: {(saveInvoice.error as Error).message}
                </p>
              ) : null}
              <Button
                onClick={handleSave}
                disabled={saveInvoice.isPending || isDuplicateNumber || noClientSelected}
              >
                {saveInvoice.isPending ? "Saving…" : "Save invoice"}
              </Button>
              <Button
                variant="outline"
                onClick={handlePreview}
                disabled={saveInvoice.isPending || isDuplicateNumber || noClientSelected}
              >
                Preview
              </Button>
              <Button
                variant="outline"
                onClick={handleDownload}
                disabled={downloading || isDuplicateNumber || noClientSelected}
              >
                <Download className="size-4" /> {downloading ? "Preparing…" : "Download PDF"}
              </Button>
              <Button
                variant="outline"
                onClick={handleSendWhatsApp}
                disabled={sendingWhatsApp || isDuplicateNumber || !selectedClient?.phone}
                title={
                  !selectedClient?.phone
                    ? "This client has no phone number on file"
                    : "A pre-written message is copied to your clipboard — paste it into WhatsApp"
                }
              >
                <MessageCircle className="size-4" />
                {sendingWhatsApp ? "Preparing…" : "Send via WhatsApp"}
              </Button>
              <Button variant="ghost" onClick={() => navigate("/app/invoices")}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
