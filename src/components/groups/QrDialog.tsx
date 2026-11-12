import { XIcon } from "lucide-react"
import { motion } from "motion/react"
import QRCode from "qrcode"
import { useEffect, useState } from "react"

import { PRESS, close, open, popover } from "@/motion"
import { inviteLink, type Group } from "./groups"

/** A scannable invite for friends standing next to you. */
export function QrDialog({ group, onClose }: { group: Group; onClose: () => void }) {
  const [src, setSrc] = useState("")

  useEffect(() => {
    let live = true
    QRCode.toDataURL(inviteLink(group), { margin: 1, width: 520, color: { dark: "#1E1E1E", light: "#FFFFFF" } }).then((url) => live && setSrc(url))
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && onClose()
    window.addEventListener("keydown", onKey)
    return () => {
      live = false
      window.removeEventListener("keydown", onKey)
    }
  }, [group, onClose])

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center p-6">
      <motion.div className="absolute inset-0 bg-ink/50" initial={{ opacity: 0 }} animate={{ opacity: 1, transition: open() }} exit={{ opacity: 0, transition: close }} onClick={onClose} />
      <motion.div role="dialog" aria-modal="true" aria-label="QR code do convite" className="relative w-full max-w-[320px] rounded-[28px] bg-white p-6 text-center" {...popover}>
        <motion.button type="button" aria-label="Fechar" onClick={onClose} className="absolute top-3 right-3 flex size-10 items-center justify-center rounded-full text-ink/60" whileTap={PRESS}>
          <XIcon className="size-5" />
        </motion.button>
        <h2 className="text-[20px] font-semibold">{group.name}</h2>
        <p className="mt-1 text-[14px] text-ink/55">Peça para seu amigo apontar a câmera</p>
        <div className="mx-auto mt-5 aspect-square w-full max-w-[240px] rounded-2xl bg-ink/4 p-2">{src && <img src={src} alt={`QR code para entrar no grupo, código ${group.code}`} className="size-full" />}</div>
        <p className="mt-4 font-mono text-[18px] font-semibold tracking-[0.2em]">{group.code}</p>
      </motion.div>
    </div>
  )
}
