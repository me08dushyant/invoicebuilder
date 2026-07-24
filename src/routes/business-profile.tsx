import * as React from "react"
import { parsePhoneNumberFromString } from "libphonenumber-js"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { useBusinessProfile, type BusinessProfile as BusinessProfileData } from "@/hooks/use-business-profile"
import { useDocumentTitle } from "@/hooks/use-document-title"

export function BusinessProfile() {
  useDocumentTitle("Business profile")
  const { profile, setProfile } = useBusinessProfile()
  const [form, setForm] = React.useState<BusinessProfileData>(profile)
  const [justSaved, setJustSaved] = React.useState(false)

  React.useEffect(() => {
    setForm(profile)
  }, [profile])

  const update = (patch: Partial<BusinessProfileData>) => {
    setForm((prev) => ({ ...prev, ...patch }))
    setJustSaved(false)
  }

  // wa.me (and libphonenumber-js) need the number in international format —
  // without an explicit country code a local-format number silently opens
  // the wrong (or no) WhatsApp chat, so this is required, not cosmetic.
  const trimmedPhone = form.phone.trim()
  const parsedPhone = trimmedPhone ? parsePhoneNumberFromString(trimmedPhone) : undefined
  const phoneError =
    trimmedPhone && !parsedPhone?.isValid()
      ? "Include the country code, e.g. +1 415 555 0100"
      : undefined

  const handleSave = () => {
    if (phoneError) return
    setProfile({ ...form, phone: parsedPhone?.isValid() ? parsedPhone.number : "" })
    setJustSaved(true)
  }

  return (
    <div className="flex flex-col gap-6 max-w-3xl mx-auto w-full">
      <h1 className="text-2xl font-semibold">Your business</h1>

      <div className="flex flex-col gap-8 rounded-xl border bg-card p-8 shadow-lg shadow-black/5">
        <div className="flex flex-col gap-4">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Sender details
          </h2>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="business-name">Business name</Label>
            <Input
              id="business-name"
              value={form.name}
              onChange={(e) => update({ name: e.target.value })}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="business-contact-person">Contact person</Label>
            <Input
              id="business-contact-person"
              value={form.contactPerson}
              onChange={(e) => update({ contactPerson: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="business-email">Email</Label>
              <Input
                id="business-email"
                type="email"
                value={form.email}
                onChange={(e) => update({ email: e.target.value })}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="business-phone">Phone / WhatsApp</Label>
              <Input
                id="business-phone"
                type="tel"
                placeholder="+1 415 555 0100"
                value={form.phone}
                onChange={(e) => update({ phone: e.target.value })}
                aria-invalid={!!phoneError}
                className={phoneError ? "border-destructive" : undefined}
              />
              {phoneError ? (
                <span className="text-xs text-destructive">{phoneError}</span>
              ) : null}
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="business-website">Website</Label>
            <Input
              id="business-website"
              type="url"
              value={form.website}
              onChange={(e) => update({ website: e.target.value })}
              placeholder="https://"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="business-address">Address</Label>
            <Input
              id="business-address"
              value={form.address}
              onChange={(e) => update({ address: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="business-city">City</Label>
              <Input
                id="business-city"
                value={form.city}
                onChange={(e) => update({ city: e.target.value })}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="business-country">Country</Label>
              <Input
                id="business-country"
                value={form.country}
                onChange={(e) => update({ country: e.target.value })}
              />
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4 border-t pt-6">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Tax &amp; bank details
          </h2>

          <div className="grid grid-cols-3 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="business-gst">GST number</Label>
              <Input
                id="business-gst"
                value={form.gstNumber}
                onChange={(e) => update({ gstNumber: e.target.value })}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="business-vat">VAT number</Label>
              <Input
                id="business-vat"
                value={form.vatNumber}
                onChange={(e) => update({ vatNumber: e.target.value })}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="business-pan">PAN</Label>
              <Input
                id="business-pan"
                value={form.panNumber}
                onChange={(e) => update({ panNumber: e.target.value })}
              />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="business-bank-name">Bank name</Label>
            <Input
              id="business-bank-name"
              value={form.bankName}
              onChange={(e) => update({ bankName: e.target.value })}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="business-bank-account-name">Account holder name</Label>
            <Input
              id="business-bank-account-name"
              value={form.bankAccountName}
              onChange={(e) => update({ bankAccountName: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="business-bank-account-number">Account number</Label>
              <Input
                id="business-bank-account-number"
                value={form.bankAccountNumber}
                onChange={(e) => update({ bankAccountNumber: e.target.value })}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="business-bank-ifsc">IFSC / SWIFT code</Label>
              <Input
                id="business-bank-ifsc"
                value={form.bankIfscSwift}
                onChange={(e) => update({ bankIfscSwift: e.target.value })}
              />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 border-t pt-6">
          <Button onClick={handleSave} disabled={!!phoneError}>
            Save changes
          </Button>
          {justSaved ? <span className="text-sm text-muted-foreground">Saved</span> : null}
        </div>
      </div>

      <p className="text-sm text-muted-foreground">
        These details appear as the "from" section, and the bank details as payment
        instructions, on every invoice you create.
      </p>
    </div>
  )
}
