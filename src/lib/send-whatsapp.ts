import { pdf, type DocumentProps } from "@react-pdf/renderer"
import type { ReactElement } from "react"
import { normalizePhoneForWhatsapp } from "@/data/types"

// Best case: the Web Share API (supported on most mobile browsers, and
// some desktop ones) lets the user pick WhatsApp from the native share
// sheet with the PDF already attached — no manual step.
//
// WhatsApp's share target doesn't put a shared `text` into its editable
// caption box — it silently queues it as a separate, un-editable message
// sent right after the file. So instead of passing `text` to share() (where
// the user never sees or can change it before it sends), we copy the
// message to the clipboard and share the file alone: WhatsApp shows its
// normal empty, editable caption box, and the user can paste the message in,
// edit it, or skip it.
//
// Fallback (older/unsupported browsers, most desktop browsers): a web
// page can't attach a local file to a wa.me chat, so this downloads the
// PDF and opens WhatsApp with the message pre-filled and editable; the user
// drops the just-downloaded file into the chat themselves.
export async function sendInvoiceViaWhatsApp(params: {
  document: ReactElement<DocumentProps>
  fileName: string
  phone: string
  message: string
}): Promise<void> {
  const blob = await pdf(params.document).toBlob()
  const file = new File([blob], params.fileName, { type: "application/pdf" })

  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.clipboard?.writeText(params.message).catch(() => {})
      await navigator.share({ files: [file] })
      return
    } catch (err) {
      if ((err as Error).name === "AbortError") return
      // Share failed for some other reason (not a user cancel) — fall
      // through to the download + wa.me fallback below.
    }
  }

  const url = URL.createObjectURL(blob)
  const link = window.document.createElement("a")
  link.href = url
  link.download = params.fileName
  link.click()
  URL.revokeObjectURL(url)

  const phoneDigits = normalizePhoneForWhatsapp(params.phone)
  window.open(
    `https://wa.me/${phoneDigits}?text=${encodeURIComponent(params.message)}`,
    "_blank",
    "noopener,noreferrer"
  )
}
