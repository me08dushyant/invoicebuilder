export interface BankDetails {
  gstNumber?: string
  vatNumber?: string
  panNumber?: string
  bankName?: string
  bankAccountName?: string
  bankAccountNumber?: string
  bankIfscSwift?: string
}

export interface Client extends BankDetails {
  id: string
  name: string
  contactPerson?: string
  email?: string
  phone?: string
  website?: string
  address?: string
  city?: string
  country?: string
  currency?: string
  createdAt: string
}

// A frozen copy of a client's or business's billing details, captured onto
// an invoice at save time. Invoices render from this snapshot (not a live
// lookup) so that editing a client or business profile later never
// retroactively changes a previously issued invoice.
export interface BillingSnapshot extends BankDetails {
  name: string
  contactPerson?: string
  email?: string
  phone?: string
  website?: string
  address?: string
  city?: string
  country?: string
}

// Skip the contact person when it's just the name again (common for sole
// proprietors/freelancers, e.g. business "Jane Doe" + contact "Jane Doe")
// — printing it twice back to back reads as a mistake, not intent.
export function distinctContactPerson(entity: {
  name: string
  contactPerson?: string
}): string | undefined {
  if (!entity.contactPerson) return undefined
  return entity.contactPerson.trim().toLowerCase() === entity.name.trim().toLowerCase()
    ? undefined
    : entity.contactPerson
}

export const CURRENCIES = [
  { code: "USD", symbol: "$" },
  { code: "EUR", symbol: "€" },
  { code: "GBP", symbol: "£" },
  { code: "INR", symbol: "₹" },
  { code: "AUD", symbol: "A$" },
  { code: "CAD", symbol: "C$" },
  { code: "JPY", symbol: "¥" },
  { code: "CNY", symbol: "¥" },
  { code: "SGD", symbol: "S$" },
  { code: "CHF", symbol: "Fr" },
  { code: "NZD", symbol: "NZ$" },
  { code: "ZAR", symbol: "R" },
] as const

export function currencySymbol(code: string | undefined): string {
  return CURRENCIES.find((c) => c.code === code)?.symbol ?? code ?? "$"
}

export interface InvoiceItem {
  id: string
  description: string
  quantity: number
  unitPrice: number
}

export type InvoiceStatus = "draft" | "unpaid" | "paid"

export interface Invoice {
  id: string
  number: string
  clientId: string
  status: InvoiceStatus
  issueDate: string
  dueDate: string
  items: InvoiceItem[]
  taxRate?: number
  currency?: string
  notes?: string
  billTo?: BillingSnapshot
  billFrom?: BillingSnapshot
  createdAt: string
  updatedAt: string
}

export function invoiceSubtotal(invoice: Pick<Invoice, "items">): number {
  return invoice.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0)
}

export function invoiceTaxAmount(invoice: Pick<Invoice, "items" | "taxRate">): number {
  return invoiceSubtotal(invoice) * ((invoice.taxRate ?? 0) / 100)
}

export function invoiceTotal(invoice: Pick<Invoice, "items" | "taxRate">): number {
  return invoiceSubtotal(invoice) + invoiceTaxAmount(invoice)
}

// wa.me needs digits only — no "+", spaces, dashes, or parens — and no
// leading zeros. It can't add a missing country code for you, though: a
// client phone stored as a plain local number will still open the wrong
// (or no) chat.
export function normalizePhoneForWhatsapp(phone: string): string {
  return phone.replace(/[^\d]/g, "").replace(/^0+/, "")
}

export function buildWhatsAppMessage(params: {
  invoice: Pick<Invoice, "number" | "dueDate" | "currency" | "taxRate" | "items">
  clientName?: string
  businessName?: string
}): string {
  const total = invoiceTotal(params.invoice)
  const symbol = currencySymbol(params.invoice.currency)
  const greeting = params.clientName ? `Hi ${params.clientName},` : "Hi,"
  const from = params.businessName ? ` from ${params.businessName}` : ""
  const due = params.invoice.dueDate ? ` due ${params.invoice.dueDate}` : ""
  return (
    `${greeting} here's invoice ${params.invoice.number}${from} — ` +
    `total ${symbol}${total.toFixed(2)}${due}. I've attached the PDF.`
  )
}
