import QRCode from "qrcode"
import { useEffect, useState } from "react"

/** A QR code to this page, so the desktop preview hands off to a real phone in one scan. */
function OpenOnPhone() {
  const [qr, setQr] = useState("")
  const url = window.location.origin + window.location.pathname

  useEffect(() => {
    QRCode.toDataURL(url, { margin: 1, width: 360, color: { dark: "#1e1e1e", light: "#ffffff" } })
      .then(setQr)
      .catch(() => setQr(""))
  }, [url])

  return (
    <aside className="hidden w-[240px] shrink-0 flex-col gap-4 font-sans text-ink min-[900px]:flex">
      <p className="text-[28px] leading-[1.1] tracking-[-0.02em]">Feito para o celular.</p>
      <p className="text-[15px] leading-snug text-ink/60">Aponte a câmera do celular para o código e abra o gymrats. Depois, use “Adicionar à Tela de Início” para abrir como um app.</p>
      {qr && <img src={qr} alt={`QR code para ${url}`} className="size-[180px] rounded-[20px] bg-white p-3 shadow-lg shadow-black/5" />}
    </aside>
  )
}

/**
 * On a wide screen the app runs inside a phone-shaped frame. An iframe gives it a
 * real phone-sized viewport, so absolute screens, sheets and dvh units stay inside.
 */
export function PhoneFrame() {
  return (
    <div className="flex h-dvh items-center justify-center gap-16 bg-[#f3e6dc] p-6">
      <iframe
        src={window.location.href}
        title="gymrats"
        // Screen-corner radius scales with the frame: 40px at full size, a little tighter than before.
        className="aspect-[390/844] h-[min(844px,100%)] rounded-[calc(min(844px,100dvh-48px)*0.0474)] border-0 bg-ink shadow-2xl ring-1 shadow-black/15 ring-black/5"
      />
      <OpenOnPhone />
    </div>
  )
}

/** Wide enough to show a phone beside empty space, and not already inside the frame. */
export const FRAME_QUERY = "(min-width: 640px)"
export const shouldFrame = () => window.self === window.top && window.matchMedia(FRAME_QUERY).matches
