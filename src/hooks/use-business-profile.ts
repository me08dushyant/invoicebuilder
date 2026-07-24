import * as React from "react"

export interface BusinessProfile {
  name: string
  contactPerson: string
  email: string
  phone: string
  website: string
  address: string
  city: string
  country: string
  gstNumber: string
  vatNumber: string
  panNumber: string
  bankName: string
  bankAccountName: string
  bankAccountNumber: string
  bankIfscSwift: string
}

const STORAGE_KEY = "freeinvoicebuilder:business-profile"

const emptyProfile: BusinessProfile = {
  name: "",
  contactPerson: "",
  email: "",
  phone: "",
  website: "",
  address: "",
  city: "",
  country: "",
  gstNumber: "",
  vatNumber: "",
  panNumber: "",
  bankName: "",
  bankAccountName: "",
  bankAccountNumber: "",
  bankIfscSwift: "",
}

function readProfile(): BusinessProfile {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? { ...emptyProfile, ...JSON.parse(raw) } : emptyProfile
  } catch {
    return emptyProfile
  }
}

// Sender ("from") details are the same across every invoice for a given
// user, so they're kept in localStorage rather than on each Invoice record
// — fill them in once, they're reused as the default from then on.
export function useBusinessProfile() {
  const [profile, setProfileState] = React.useState<BusinessProfile>(readProfile)

  const setProfile = React.useCallback((patch: Partial<BusinessProfile>) => {
    setProfileState((prev) => {
      const next = { ...prev, ...patch }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      return next
    })
  }, [])

  return { profile, setProfile }
}
