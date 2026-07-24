import * as React from "react"
import { parsePhoneNumberFromString } from "libphonenumber-js"
import { Pencil, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useClients, useDeleteClient, useSaveClient } from "@/hooks/use-clients"
import { useDocumentTitle } from "@/hooks/use-document-title"
import { CURRENCIES, type Client } from "@/data/types"

const emptyForm = {
  name: "",
  contactPerson: "",
  email: "",
  phone: "",
  website: "",
  address: "",
  city: "",
  country: "",
  currency: "USD",
  gstNumber: "",
  vatNumber: "",
  panNumber: "",
  bankName: "",
  bankAccountName: "",
  bankAccountNumber: "",
  bankIfscSwift: "",
}

export function Clients() {
  useDocumentTitle("Clients")
  const { data: clients = [], isLoading } = useClients()
  const saveClient = useSaveClient()
  const deleteClient = useDeleteClient()

  const [open, setOpen] = React.useState(false)
  const [editingId, setEditingId] = React.useState<string | null>(null)
  const [name, setName] = React.useState("")
  const [contactPerson, setContactPerson] = React.useState("")
  const [email, setEmail] = React.useState("")
  const [phone, setPhone] = React.useState("")
  const [website, setWebsite] = React.useState("")
  const [address, setAddress] = React.useState("")
  const [city, setCity] = React.useState("")
  const [country, setCountry] = React.useState("")
  const [currency, setCurrency] = React.useState("USD")
  const [gstNumber, setGstNumber] = React.useState("")
  const [vatNumber, setVatNumber] = React.useState("")
  const [panNumber, setPanNumber] = React.useState("")
  const [bankName, setBankName] = React.useState("")
  const [bankAccountName, setBankAccountName] = React.useState("")
  const [bankAccountNumber, setBankAccountNumber] = React.useState("")
  const [bankIfscSwift, setBankIfscSwift] = React.useState("")

  const applyForm = (values: typeof emptyForm) => {
    setName(values.name)
    setContactPerson(values.contactPerson)
    setEmail(values.email)
    setPhone(values.phone)
    setWebsite(values.website)
    setAddress(values.address)
    setCity(values.city)
    setCountry(values.country)
    setCurrency(values.currency)
    setGstNumber(values.gstNumber)
    setVatNumber(values.vatNumber)
    setPanNumber(values.panNumber)
    setBankName(values.bankName)
    setBankAccountName(values.bankAccountName)
    setBankAccountNumber(values.bankAccountNumber)
    setBankIfscSwift(values.bankIfscSwift)
  }

  const openForNew = () => {
    setEditingId(null)
    applyForm(emptyForm)
    setOpen(true)
  }

  const openForEdit = (client: Client) => {
    setEditingId(client.id)
    applyForm({
      name: client.name,
      contactPerson: client.contactPerson ?? "",
      email: client.email ?? "",
      phone: client.phone ?? "",
      website: client.website ?? "",
      address: client.address ?? "",
      city: client.city ?? "",
      country: client.country ?? "",
      currency: client.currency ?? "USD",
      gstNumber: client.gstNumber ?? "",
      vatNumber: client.vatNumber ?? "",
      panNumber: client.panNumber ?? "",
      bankName: client.bankName ?? "",
      bankAccountName: client.bankAccountName ?? "",
      bankAccountNumber: client.bankAccountNumber ?? "",
      bankIfscSwift: client.bankIfscSwift ?? "",
    })
    setOpen(true)
  }

  // wa.me (and libphonenumber-js) need the number in international format —
  // without an explicit country code a local-format number silently opens
  // the wrong (or no) WhatsApp chat, so this is required, not cosmetic.
  const trimmedPhone = phone.trim()
  const parsedPhone = trimmedPhone ? parsePhoneNumberFromString(trimmedPhone) : undefined
  const phoneError =
    trimmedPhone && !parsedPhone?.isValid()
      ? "Include the country code, e.g. +1 415 555 0100"
      : undefined

  const handleSave = async () => {
    if (!name.trim() || phoneError) return
    await saveClient.mutateAsync({
      id: editingId ?? undefined,
      name,
      contactPerson,
      email,
      phone: parsedPhone?.isValid() ? parsedPhone.number : "",
      website,
      address,
      city,
      country,
      currency,
      gstNumber,
      vatNumber,
      panNumber,
      bankName,
      bankAccountName,
      bankAccountNumber,
      bankIfscSwift,
    })
    setOpen(false)
  }

  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto w-full">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Clients</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <Button onClick={openForNew}>Add client</Button>
          <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingId ? "Edit client" : "New client"}</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col gap-3">
              <div className="grid grid-cols-[1fr_140px] gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="client-name">Business name</Label>
                  <Input
                    id="client-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
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
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="client-contact-person">Contact person</Label>
                <Input
                  id="client-contact-person"
                  value={contactPerson}
                  onChange={(e) => setContactPerson(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="client-email">Email</Label>
                <Input
                  id="client-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="client-phone">Phone / WhatsApp</Label>
                <Input
                  id="client-phone"
                  type="tel"
                  placeholder="+1 415 555 0100"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  aria-invalid={!!phoneError}
                  className={phoneError ? "border-destructive" : undefined}
                />
                {phoneError ? (
                  <span className="text-xs text-destructive">{phoneError}</span>
                ) : null}
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="client-website">Website</Label>
                <Input
                  id="client-website"
                  type="url"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="https://"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="client-address">Address</Label>
                <Input
                  id="client-address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="client-city">City</Label>
                  <Input
                    id="client-city"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="client-country">Country</Label>
                  <Input
                    id="client-country"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                  />
                </div>
              </div>

              <div className="mt-2 border-t pt-3 text-sm font-medium">Bank details</div>

              <div className="grid grid-cols-3 gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="client-gst">GST number</Label>
                  <Input
                    id="client-gst"
                    value={gstNumber}
                    onChange={(e) => setGstNumber(e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="client-vat">VAT number</Label>
                  <Input
                    id="client-vat"
                    value={vatNumber}
                    onChange={(e) => setVatNumber(e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="client-pan">PAN</Label>
                  <Input
                    id="client-pan"
                    value={panNumber}
                    onChange={(e) => setPanNumber(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="client-bank-name">Bank name</Label>
                <Input
                  id="client-bank-name"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="client-bank-account-name">Account holder name</Label>
                <Input
                  id="client-bank-account-name"
                  value={bankAccountName}
                  onChange={(e) => setBankAccountName(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="client-bank-account-number">Account number</Label>
                  <Input
                    id="client-bank-account-number"
                    value={bankAccountNumber}
                    onChange={(e) => setBankAccountNumber(e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="client-bank-ifsc">IFSC / SWIFT code</Label>
                  <Input
                    id="client-bank-ifsc"
                    value={bankIfscSwift}
                    onChange={(e) => setBankIfscSwift(e.target.value)}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleSave} disabled={saveClient.isPending || !!phoneError}>
                {saveClient.isPending ? "Saving…" : editingId ? "Save changes" : "Save"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Phone</TableHead>
            <TableHead>Website</TableHead>
            <TableHead>Address</TableHead>
            <TableHead className="w-10" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading && (
            <TableRow>
              <TableCell colSpan={6}>Loading…</TableCell>
            </TableRow>
          )}
          {!isLoading && clients.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} className="text-muted-foreground">
                No clients yet.
              </TableCell>
            </TableRow>
          )}
          {clients.map((client) => (
            <TableRow key={client.id}>
              <TableCell>{client.name}</TableCell>
              <TableCell>{client.email}</TableCell>
              <TableCell>{client.phone}</TableCell>
              <TableCell>{client.website}</TableCell>
              <TableCell>{client.address}</TableCell>
              <TableCell>
                <div className="flex justify-end gap-1">
                  <Button variant="ghost" size="icon" onClick={() => openForEdit(client)}>
                    <Pencil className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteClient.mutate(client.id)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
