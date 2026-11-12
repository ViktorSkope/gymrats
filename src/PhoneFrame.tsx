import QRCode from "qrcode"
import { useEffect, useState, type ReactNode } from "react"

import { loadSample } from "@/components/groups/sample"

const BASE = window.location.origin + window.location.pathname

/** Everything the prototype keeps, so it can be wiped or seeded from outside the app. */
function clearStored() {
  try {
    for (const key of Object.keys(sessionStorage)) if (key.startsWith("gymrats.")) sessionStorage.removeItem(key)
  } catch {
    // Storage blocked: nothing saved to clear.
  }
}

/** Shortcuts for testing: jump past onboarding, or wipe everything and start from the splash. */
function TestControls({ onSkip, onSample, onReset }: { onSkip: () => void; onSample: () => void; onReset: () => void }) {
  const [confirming, setConfirming] = useState(false)

  useEffect(() => {
    if (!confirming) return
    const timer = setTimeout(() => setConfirming(false), 3000)
    return () => clearTimeout(timer)
  }, [confirming])

  const button = "h-11 rounded-[16px] px-4 text-left text-[15px] font-medium transition-[background-color,transform] duration-150 active:scale-[0.97]"
  return (
    <div className="mt-4 flex flex-col gap-2 border-t border-ink/10 pt-5">
      <p className="text-[13px] font-semibold tracking-wide text-ink/45 uppercase">Para testar</p>
      <button type="button" onClick={onSkip} className={`${button} bg-white text-ink shadow-sm shadow-black/5 hover:bg-white/70`}>
        Pular o onboarding
      </button>
      <button type="button" onClick={onSample} className={`${button} bg-white text-ink shadow-sm shadow-black/5 hover:bg-white/70`}>
        Carregar exemplo com amigos
      </button>
      <button
        type="button"
        onClick={() => {
          if (!confirming) return setConfirming(true)
          setConfirming(false)
          onReset()
        }}
        className={`${button} ${confirming ? "bg-[#D23A2C] text-white" : "bg-white text-[#D23A2C] shadow-sm shadow-black/5 hover:bg-white/70"}`}
      >
        {confirming ? "Toque de novo para apagar tudo" : "Apagar tudo e recomeçar"}
      </button>
      <p className="text-[13px] leading-snug text-ink/50">O exemplo troca seus dados por 3 grupos e alguns amigos. Apagar remove nome, objetivo, plano e grupos, e volta para a abertura.</p>
    </div>
  )
}

/** A QR code to this page, so the desktop preview hands off to a real phone in one scan. */
function OpenOnPhone({ children }: { children?: ReactNode }) {
  const [qr, setQr] = useState("")
  const url = BASE

  useEffect(() => {
    QRCode.toDataURL(url, { margin: 1, width: 360, color: { dark: "#1D1D1D", light: "#ffffff" } })
      .then(setQr)
      .catch(() => setQr(""))
  }, [url])

  return (
    <aside className="hidden w-[240px] shrink-0 flex-col gap-4 font-sans text-ink min-[760px]:flex">
      <p className="text-[28px] leading-[1.1] tracking-[-0.02em]">Feito para o celular.</p>
      <p className="text-[15px] leading-snug text-ink/60">Aponte a câmera do celular para o código e abra o gymrats. Depois, use “Adicionar à Tela de Início” para abrir como um app.</p>
      {qr && <img src={qr} alt={`QR code para ${url}`} className="size-[180px] rounded-[20px] bg-white p-3 shadow-lg shadow-black/5" />}
      {children}
    </aside>
  )
}

/**
 * On a wide screen the app runs inside a phone-shaped frame. An iframe gives it a
 * real phone-sized viewport, so absolute screens, sheets and dvh units stay inside.
 */
export function PhoneFrame() {
  // A new key remounts the iframe, so the app reloads from scratch at the given address.
  const [app, setApp] = useState({ key: 0, src: window.location.href })
  const load = (src: string) => setApp((a) => ({ key: a.key + 1, src }))

  const skip = () => {
    try {
      if (!sessionStorage.getItem("gymrats.goal")) sessionStorage.setItem("gymrats.goal", JSON.stringify("compete"))
    } catch {
      // Storage blocked: home still opens, just without a saved goal.
    }
    load(BASE + "#home")
  }

  const sample = () => {
    loadSample()
    load(BASE + "#home")
  }

  const reset = () => {
    clearStored()
    load(BASE)
  }

  return (
    <div className="flex h-dvh items-center justify-center gap-16 bg-[#f3e6dc] p-6">
      <iframe
        key={app.key}
        src={app.src}
        // The check-in camera needs permission to run inside the frame.
        allow="camera"
        title="gymrats"
        // Screen-corner radius scales with the frame: 40px at full size, a little tighter than before.
        className="aspect-[390/844] h-[min(844px,100%)] rounded-[calc(min(844px,100dvh-48px)*0.0474)] border-0 bg-ink shadow-2xl ring-1 shadow-black/15 ring-black/5"
      />
      <OpenOnPhone>
        <TestControls onSkip={skip} onSample={sample} onReset={reset} />
      </OpenOnPhone>
    </div>
  )
}

/** Wide enough to show a phone beside empty space, and not already inside the frame. */
export const FRAME_QUERY = "(min-width: 640px)"
export const shouldFrame = () => window.self === window.top && window.matchMedia(FRAME_QUERY).matches
