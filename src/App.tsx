import { lazy, Suspense } from "react"
import { Routes, Route } from "react-router-dom"
import { RootLayout } from "@/routes/root-layout"

// Route-level code splitting: each route becomes its own chunk, so e.g.
// the landing page and login don't pull in @react-pdf/renderer, dexie, and
// supabase-js just to render a couple of buttons — those only load once
// you actually navigate somewhere that needs them.
const Landing = lazy(() => import("@/routes/landing").then((m) => ({ default: m.Landing })))
const Invoices = lazy(() => import("@/routes/invoices").then((m) => ({ default: m.Invoices })))
const InvoiceEditor = lazy(() =>
  import("@/routes/invoice-editor").then((m) => ({ default: m.InvoiceEditor }))
)
const InvoicePreview = lazy(() =>
  import("@/routes/invoice-preview").then((m) => ({ default: m.InvoicePreview }))
)
const Clients = lazy(() => import("@/routes/clients").then((m) => ({ default: m.Clients })))
const BusinessProfile = lazy(() =>
  import("@/routes/business-profile").then((m) => ({ default: m.BusinessProfile }))
)

function RouteFallback() {
  return <p className="p-6 text-muted-foreground">Loading…</p>
}

export default function App() {
  return (
    <Suspense fallback={<RouteFallback />}>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/app" element={<RootLayout />}>
          <Route index element={<Invoices />} />
          <Route path="invoices" element={<Invoices />} />
          <Route path="invoices/:id" element={<InvoiceEditor />} />
          <Route path="invoices/:id/preview" element={<InvoicePreview />} />
          <Route path="clients" element={<Clients />} />
          <Route path="business-profile" element={<BusinessProfile />} />
        </Route>
      </Routes>
    </Suspense>
  )
}
