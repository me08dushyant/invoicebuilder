import { Routes, Route } from "react-router-dom"
import { RootLayout } from "@/routes/root-layout"
import { Landing } from "@/routes/landing"
import { Invoices } from "@/routes/invoices"
import { InvoiceEditor } from "@/routes/invoice-editor"
import { InvoicePreview } from "@/routes/invoice-preview"
import { Clients } from "@/routes/clients"
import { BusinessProfile } from "@/routes/business-profile"
import { Login } from "@/routes/login"

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/app" element={<RootLayout />}>
        <Route index element={<Invoices />} />
        <Route path="invoices" element={<Invoices />} />
        <Route path="invoices/:id" element={<InvoiceEditor />} />
        <Route path="invoices/:id/preview" element={<InvoicePreview />} />
        <Route path="clients" element={<Clients />} />
        <Route path="business-profile" element={<BusinessProfile />} />
      </Route>
    </Routes>
  )
}
