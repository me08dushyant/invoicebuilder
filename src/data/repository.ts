// Single data-access layer that both the "guest" (local) and
// "signed-in" (cloud) modes go through. Callers don't need to know
// which backend is active — pass `userId` (or null for guest) and this
// picks Dexie/IndexedDB or Supabase/Postgres underneath.
import { supabase } from "./supabase"
import { db } from "./db"
import type { Client, Invoice } from "./types"

function newId() {
  return crypto.randomUUID()
}

// ---------- Clients ----------

export async function listClients(userId: string | null): Promise<Client[]> {
  if (userId && supabase) {
    const { data, error } = await supabase
      .from("clients")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
    if (error) throw error
    return (data ?? []).map(rowToClient)
  }
  return db.clients.orderBy("createdAt").reverse().toArray()
}

function clientToRow(userId: string, record: Client): Record<string, unknown> {
  return {
    id: record.id,
    user_id: userId,
    name: record.name,
    contact_person: record.contactPerson,
    email: record.email,
    phone: record.phone,
    website: record.website,
    address: record.address,
    city: record.city,
    country: record.country,
    currency: record.currency,
    gst_number: record.gstNumber,
    vat_number: record.vatNumber,
    pan_number: record.panNumber,
    bank_name: record.bankName,
    bank_account_name: record.bankAccountName,
    bank_account_number: record.bankAccountNumber,
    bank_ifsc_swift: record.bankIfscSwift,
    created_at: record.createdAt,
  }
}

export async function saveClient(
  userId: string | null,
  client: Omit<Client, "id" | "createdAt"> & { id?: string }
): Promise<Client> {
  const record: Client = {
    id: client.id ?? newId(),
    name: client.name,
    contactPerson: client.contactPerson,
    email: client.email,
    phone: client.phone,
    website: client.website,
    address: client.address,
    city: client.city,
    country: client.country,
    currency: client.currency,
    gstNumber: client.gstNumber,
    vatNumber: client.vatNumber,
    panNumber: client.panNumber,
    bankName: client.bankName,
    bankAccountName: client.bankAccountName,
    bankAccountNumber: client.bankAccountNumber,
    bankIfscSwift: client.bankIfscSwift,
    createdAt: new Date().toISOString(),
  }
  if (userId && supabase) {
    const { error } = await supabase.from("clients").upsert(clientToRow(userId, record))
    if (error) throw error
    return record
  }
  await db.clients.put(record)
  return record
}

export async function deleteClient(userId: string | null, id: string): Promise<void> {
  if (userId && supabase) {
    const { error } = await supabase.from("clients").delete().eq("id", id)
    if (error) throw error
    return
  }
  await db.clients.delete(id)
}

// ---------- Invoices ----------

export async function listInvoices(userId: string | null): Promise<Invoice[]> {
  if (userId && supabase) {
    const { data, error } = await supabase
      .from("invoices")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
    if (error) throw error
    return (data ?? []).map(rowToInvoice)
  }
  return db.invoices.orderBy("createdAt").reverse().toArray()
}

function invoiceToRow(userId: string, record: Invoice): Record<string, unknown> {
  return {
    id: record.id,
    user_id: userId,
    number: record.number,
    client_id: record.clientId,
    status: record.status,
    issue_date: record.issueDate,
    due_date: record.dueDate,
    items: record.items,
    tax_rate: record.taxRate,
    currency: record.currency,
    notes: record.notes,
    bill_to: record.billTo,
    bill_from: record.billFrom,
    created_at: record.createdAt,
    updated_at: record.updatedAt,
  }
}

export async function saveInvoice(
  userId: string | null,
  invoice: Omit<Invoice, "id" | "createdAt" | "updatedAt"> & { id?: string }
): Promise<Invoice> {
  const now = new Date().toISOString()
  const record: Invoice = {
    id: invoice.id ?? newId(),
    number: invoice.number,
    clientId: invoice.clientId,
    status: invoice.status,
    issueDate: invoice.issueDate,
    dueDate: invoice.dueDate,
    items: invoice.items,
    taxRate: invoice.taxRate,
    currency: invoice.currency,
    notes: invoice.notes,
    billTo: invoice.billTo,
    billFrom: invoice.billFrom,
    createdAt: now,
    updatedAt: now,
  }
  if (userId && supabase) {
    const { error } = await supabase.from("invoices").upsert(invoiceToRow(userId, record))
    if (error) throw error
    return record
  }
  await db.invoices.put(record)
  return record
}

export async function deleteInvoice(userId: string | null, id: string): Promise<void> {
  if (userId && supabase) {
    const { error } = await supabase.from("invoices").delete().eq("id", id)
    if (error) throw error
    return
  }
  await db.invoices.delete(id)
}

// ---------- Guest -> cloud migration ----------

// Runs once, the first time a guest signs in on a given device: uploads
// whatever's in the local IndexedDB copy to the new Supabase account (same
// ids, so client<->invoice references stay intact) and clears the local
// copy so a later guest session on this device doesn't resurrect it.
export async function migrateGuestDataToCloud(userId: string): Promise<void> {
  if (!supabase) return

  const [localClients, localInvoices] = await Promise.all([
    db.clients.toArray(),
    db.invoices.toArray(),
  ])
  if (localClients.length === 0 && localInvoices.length === 0) return

  if (localClients.length > 0) {
    const { error } = await supabase
      .from("clients")
      .upsert(localClients.map((c) => clientToRow(userId, c)))
    if (error) throw error
  }
  if (localInvoices.length > 0) {
    const { error } = await supabase
      .from("invoices")
      .upsert(localInvoices.map((i) => invoiceToRow(userId, i)))
    if (error) throw error
  }

  await db.clients.clear()
  await db.invoices.clear()
}

// ---------- Row mappers (Postgres snake_case -> app camelCase) ----------

function rowToClient(row: Record<string, unknown>): Client {
  return {
    id: row.id as string,
    name: row.name as string,
    contactPerson: row.contact_person as string | undefined,
    email: row.email as string | undefined,
    phone: row.phone as string | undefined,
    website: row.website as string | undefined,
    address: row.address as string | undefined,
    city: row.city as string | undefined,
    country: row.country as string | undefined,
    currency: row.currency as string | undefined,
    gstNumber: row.gst_number as string | undefined,
    vatNumber: row.vat_number as string | undefined,
    panNumber: row.pan_number as string | undefined,
    bankName: row.bank_name as string | undefined,
    bankAccountName: row.bank_account_name as string | undefined,
    bankAccountNumber: row.bank_account_number as string | undefined,
    bankIfscSwift: row.bank_ifsc_swift as string | undefined,
    createdAt: row.created_at as string,
  }
}

function rowToInvoice(row: Record<string, unknown>): Invoice {
  return {
    id: row.id as string,
    number: row.number as string,
    clientId: row.client_id as string,
    status: row.status as Invoice["status"],
    issueDate: row.issue_date as string,
    dueDate: row.due_date as string,
    items: (row.items as Invoice["items"]) ?? [],
    taxRate: row.tax_rate as number | undefined,
    currency: row.currency as string | undefined,
    notes: row.notes as string | undefined,
    billTo: row.bill_to as Invoice["billTo"],
    billFrom: row.bill_from as Invoice["billFrom"],
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  }
}
