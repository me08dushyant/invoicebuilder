import { Document, Page, View, Text, StyleSheet, Font } from "@react-pdf/renderer"
import notoSansExtUrl from "@fontsource/noto-sans/files/noto-sans-latin-ext-400-normal.woff?url"
import type { BillingSnapshot, Client, Invoice } from "@/data/types"
import {
  currencySymbol,
  distinctContactPerson,
  invoiceSubtotal,
  invoiceTaxAmount,
  invoiceTotal,
} from "@/data/types"
import type { BusinessProfile } from "@/hooks/use-business-profile"

// The built-in PDF fonts (Helvetica, etc.) use WinAnsiEncoding, which covers
// $/€/£/¥ but not the Indian Rupee sign (₹) — it's outside that legacy 8-bit
// encoding entirely, so it silently renders as nothing. This font subset
// does have a ₹ glyph, so it's registered as a fallback used only for that
// one character.
Font.register({ family: "NotoSansINR", src: notoSansExtUrl })

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: "Helvetica",
    color: "#1a1a1a",
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 32,
  },
  businessName: {
    fontSize: 14,
    fontWeight: 700,
    marginBottom: 4,
  },
  muted: {
    color: "#666666",
  },
  title: {
    fontSize: 20,
    fontWeight: 700,
    textAlign: "right",
    marginBottom: 6,
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 8,
  },
  metaLabel: {
    color: "#666666",
  },
  billTo: {
    marginBottom: 24,
  },
  sectionLabel: {
    color: "#666666",
    marginBottom: 4,
    textTransform: "uppercase",
    fontSize: 8,
    letterSpacing: 1,
  },
  table: {
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
  },
  tableHeaderRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#1a1a1a",
    paddingVertical: 6,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
    paddingVertical: 6,
  },
  colDescription: { flex: 1 },
  colQty: { width: 60, textAlign: "right" },
  colUnitPrice: { width: 80, textAlign: "right" },
  colAmount: { width: 80, textAlign: "right" },
  tableHeaderText: {
    fontWeight: 700,
    fontSize: 9,
  },
  totalsBlock: {
    marginTop: 16,
    alignItems: "flex-end",
  },
  totalRow: {
    flexDirection: "row",
    gap: 24,
    paddingVertical: 4,
  },
  totalLabel: {
    color: "#666666",
  },
  grandTotalRow: {
    flexDirection: "row",
    gap: 24,
    paddingTop: 8,
    marginTop: 4,
    borderTopWidth: 1,
    borderTopColor: "#1a1a1a",
  },
  grandTotalText: {
    fontSize: 12,
    fontWeight: 700,
  },
  notes: {
    marginTop: 32,
  },
  paymentDetails: {
    marginTop: 24,
  },
  paymentRow: {
    flexDirection: "row",
    gap: 6,
  },
  paymentLabel: {
    color: "#666666",
  },
})

function formatAddress(entity: { address?: string; city?: string; country?: string }): string {
  return [entity.address, entity.city, entity.country].filter(Boolean).join(", ")
}

function CurrencyPrefix({ symbol, currency }: { symbol: string; currency: string | undefined }) {
  if (currency === "INR") {
    return <Text style={{ fontFamily: "NotoSansINR" }}>{symbol}</Text>
  }
  return <>{symbol}</>
}

interface InvoiceDocumentProps {
  invoice: Pick<
    Invoice,
    | "number"
    | "status"
    | "issueDate"
    | "dueDate"
    | "items"
    | "taxRate"
    | "currency"
    | "notes"
    | "billTo"
    | "billFrom"
  >
  // Live client/business records, used only as a fallback for invoices
  // saved before billing snapshots existed. Once an invoice carries its
  // own billTo/billFrom, these are ignored — see the "snapshot" comment
  // on BillingSnapshot in data/types.ts.
  client: Client | undefined
  business: BusinessProfile
}

export function InvoiceDocument({ invoice, client, business }: InvoiceDocumentProps) {
  const subtotal = invoiceSubtotal(invoice)
  const taxAmount = invoiceTaxAmount(invoice)
  const total = invoiceTotal(invoice)
  const taxRate = invoice.taxRate ?? 0
  const symbol = currencySymbol(invoice.currency)
  const billFrom: BillingSnapshot = invoice.billFrom ?? business
  const billTo: BillingSnapshot | undefined = invoice.billTo ?? client
  const businessAddress = formatAddress(billFrom)
  const clientAddress = formatAddress(billTo ?? {})
  const billFromContact = distinctContactPerson(billFrom)
  const billToContact = billTo ? distinctContactPerson(billTo) : undefined

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.businessName}>{billFrom.name || "Your business"}</Text>
            {billFromContact ? <Text style={styles.muted}>{billFromContact}</Text> : null}
            {billFrom.email ? <Text style={styles.muted}>{billFrom.email}</Text> : null}
            {billFrom.phone ? <Text style={styles.muted}>{billFrom.phone}</Text> : null}
            {billFrom.website ? <Text style={styles.muted}>{billFrom.website}</Text> : null}
            {businessAddress ? <Text style={styles.muted}>{businessAddress}</Text> : null}
            {billFrom.gstNumber ? (
              <Text style={styles.muted}>GSTIN: {billFrom.gstNumber}</Text>
            ) : null}
            {billFrom.vatNumber ? (
              <Text style={styles.muted}>VAT: {billFrom.vatNumber}</Text>
            ) : null}
            {billFrom.panNumber ? (
              <Text style={styles.muted}>PAN: {billFrom.panNumber}</Text>
            ) : null}
          </View>
          <View>
            <Text style={styles.title}>INVOICE #{invoice.number}</Text>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Issued on</Text>
              <Text>{invoice.issueDate || "—"}</Text>
            </View>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Due by</Text>
              <Text>{invoice.dueDate || "—"}</Text>
            </View>
          </View>
        </View>

        <View style={styles.billTo}>
          <Text style={styles.sectionLabel}>Bill to</Text>
          <Text>{billTo?.name ?? "No client selected"}</Text>
          {billToContact ? <Text style={styles.muted}>{billToContact}</Text> : null}
          {billTo?.email ? <Text style={styles.muted}>{billTo.email}</Text> : null}
          {billTo?.phone ? <Text style={styles.muted}>{billTo.phone}</Text> : null}
          {billTo?.website ? <Text style={styles.muted}>{billTo.website}</Text> : null}
          {clientAddress ? <Text style={styles.muted}>{clientAddress}</Text> : null}
          {billTo?.gstNumber ? <Text style={styles.muted}>GSTIN: {billTo.gstNumber}</Text> : null}
          {billTo?.vatNumber ? <Text style={styles.muted}>VAT: {billTo.vatNumber}</Text> : null}
          {billTo?.panNumber ? <Text style={styles.muted}>PAN: {billTo.panNumber}</Text> : null}
        </View>

        <View style={styles.table}>
          <View style={styles.tableHeaderRow}>
            <Text style={[styles.colDescription, styles.tableHeaderText]}>Description</Text>
            <Text style={[styles.colQty, styles.tableHeaderText]}>Qty</Text>
            <Text style={[styles.colUnitPrice, styles.tableHeaderText]}>Unit price</Text>
            <Text style={[styles.colAmount, styles.tableHeaderText]}>Amount</Text>
          </View>
          {invoice.items.map((item) => (
            <View style={styles.tableRow} key={item.id}>
              <Text style={styles.colDescription}>{item.description || "—"}</Text>
              <Text style={styles.colQty}>{item.quantity}</Text>
              <Text style={styles.colUnitPrice}>
                <CurrencyPrefix symbol={symbol} currency={invoice.currency} />
                {item.unitPrice.toFixed(2)}
              </Text>
              <Text style={styles.colAmount}>
                <CurrencyPrefix symbol={symbol} currency={invoice.currency} />
                {(item.quantity * item.unitPrice).toFixed(2)}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.totalsBlock}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal</Text>
            <Text>
              <CurrencyPrefix symbol={symbol} currency={invoice.currency} />
              {subtotal.toFixed(2)}
            </Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Tax ({taxRate}%)</Text>
            <Text>
              <CurrencyPrefix symbol={symbol} currency={invoice.currency} />
              {taxAmount.toFixed(2)}
            </Text>
          </View>
          <View style={styles.grandTotalRow}>
            <Text style={styles.grandTotalText}>Total</Text>
            <Text style={styles.grandTotalText}>
              <CurrencyPrefix symbol={symbol} currency={invoice.currency} />
              {total.toFixed(2)}
            </Text>
          </View>
        </View>

        {billFrom.bankName || billFrom.bankAccountNumber ? (
          <View style={styles.paymentDetails}>
            <Text style={styles.sectionLabel}>Payment details</Text>
            {billFrom.bankName ? (
              <View style={styles.paymentRow}>
                <Text style={styles.paymentLabel}>Bank:</Text>
                <Text>{billFrom.bankName}</Text>
              </View>
            ) : null}
            {billFrom.bankAccountName ? (
              <View style={styles.paymentRow}>
                <Text style={styles.paymentLabel}>Account name:</Text>
                <Text>{billFrom.bankAccountName}</Text>
              </View>
            ) : null}
            {billFrom.bankAccountNumber ? (
              <View style={styles.paymentRow}>
                <Text style={styles.paymentLabel}>Account number:</Text>
                <Text>{billFrom.bankAccountNumber}</Text>
              </View>
            ) : null}
            {billFrom.bankIfscSwift ? (
              <View style={styles.paymentRow}>
                <Text style={styles.paymentLabel}>IFSC / SWIFT:</Text>
                <Text>{billFrom.bankIfscSwift}</Text>
              </View>
            ) : null}
          </View>
        ) : null}

        {invoice.notes ? (
          <View style={styles.notes}>
            <Text style={styles.sectionLabel}>Invoice terms</Text>
            <Text>{invoice.notes}</Text>
          </View>
        ) : null}
      </Page>
    </Document>
  )
}
