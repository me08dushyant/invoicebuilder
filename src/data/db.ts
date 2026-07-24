// Local, offline-first storage for guest users. Runs entirely in the
// browser via IndexedDB — no account, no server, no cost.
import Dexie, { type EntityTable } from "dexie"
import type { Client, Invoice } from "./types"

class FreeInvoiceBuilderDB extends Dexie {
  clients!: EntityTable<Client, "id">
  invoices!: EntityTable<Invoice, "id">

  constructor() {
    super("freeinvoicebuilder")
    this.version(1).stores({
      clients: "id, name, createdAt",
      invoices: "id, clientId, status, issueDate, createdAt",
    })
  }
}

export const db = new FreeInvoiceBuilderDB()
