import { CameraIcon } from "lucide-react"
import { motion } from "motion/react"
import { useEffect, useRef, useState, type ReactNode } from "react"

import { RatFace } from "@/components/Avatar"
import { useStored } from "@/hooks/useStored"
import { activeDays, photoToDataUrl, streak, type Group } from "@/components/groups/groups"
import { loadSample } from "@/components/groups/sample"
import { haptic } from "@/hooks/useHaptic"
import { PRESS } from "@/motion"

/** The light card every tab is built on. */
export function Panel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <motion.section
      className={`shrink-0 rounded-[30px] bg-paper px-5 pt-5 pb-5 ${className}`}
      initial={{ y: -24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    >
      {children}
    </motion.section>
  )
}

function Stat({ value, label }: { value: number | string; label: string }) {
  return (
    <div className="rounded-[20px] bg-[#EDEBEE] p-4">
      <p className="text-[28px] leading-none font-semibold tabular-nums">{value}</p>
      <p className="mt-1.5 text-[13px] leading-tight text-ink/55">{label}</p>
    </div>
  )
}

/** You, your plan, a few totals, and the way to start over. */
export function ProfileView({ name, plan, groups, onReset }: { name: string; plan: string | null; groups: Group[]; onReset: () => void }) {
  const [confirming, setConfirming] = useState(false)
  const days = new Set(groups.flatMap((g) => g.checkins.map((t) => new Date(t).toDateString()))).size
  const best = streak(groups).best

  useEffect(() => {
    if (!confirming) return
    const timer = setTimeout(() => setConfirming(false), 3000)
    return () => clearTimeout(timer)
  }, [confirming])

  const [photo, setPhoto] = useStored<string | null>("photo", null)
  const file = useRef<HTMLInputElement>(null)
  const pick = async (picked: File | undefined) => {
    if (!picked) return
    try {
      setPhoto(await photoToDataUrl(picked, 400))
    } catch {
      // Unreadable file: keep the current picture.
    }
  }

  return (
    <Panel className="flex-1">
      <div className="flex items-center gap-4">
        {/* Tap your picture to change it. */}
        <motion.button type="button" aria-label={photo ? "Trocar foto" : "Adicionar foto"} onClick={() => file.current?.click()} className="relative block size-[72px] shrink-0 rounded-full" whileTap={PRESS}>
          <span className="block size-full overflow-hidden rounded-full">{photo ? <img src={photo} alt="" className="size-full object-cover" draggable={false} /> : <RatFace />}</span>
          <span className="absolute -right-1 -bottom-1 flex size-7 items-center justify-center rounded-full bg-ink text-white ring-2 ring-paper">
            <CameraIcon className="size-3.5" />
          </span>
        </motion.button>
        <input ref={file} type="file" accept="image/*" className="sr-only" tabIndex={-1} onChange={(event) => pick(event.target.files?.[0])} />
        <div className="min-w-0">
          <h1 className="truncate text-[28px] leading-tight tracking-[-0.02em]">{name || "Você"}</h1>
          <p className="mt-1 inline-flex h-7 items-center rounded-full bg-[#E6E4E7] px-3 text-[14px]">
            {plan === "yearly" ? "Gymrats Pro · Anual" : plan === "monthly" ? "Gymrats Pro · Mensal" : "Plano gratuito"}
          </p>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-3 gap-2">
        <Stat value={days} label="Dias de treino" />
        <Stat value={best} label="Maior sequência" />
        <Stat value={groups.length} label={groups.length === 1 ? "Grupo" : "Grupos"} />
      </div>
      {groups.length > 0 && <p className="mt-3 px-1 text-[13px] text-ink/50">{groups.reduce((sum, g) => sum + activeDays(g), 0)} dias ativos somando todos os grupos.</p>}

      <motion.button
        type="button"
        onClick={() => {
          loadSample()
          window.location.hash = "home"
          window.location.reload()
        }}
        className="mt-8 h-12 w-full rounded-[20px] bg-[#EDEBEE] text-[17px] text-ink"
        whileTap={PRESS}
      >
        Carregar exemplo com amigos
      </motion.button>
      <motion.button
        type="button"
        onClick={() => {
          if (!confirming) return setConfirming(true)
          haptic(30)
          onReset()
        }}
        className={`mt-2 h-12 w-full rounded-[20px] text-[17px] transition-colors ${confirming ? "bg-rat text-white" : "bg-[#EDEBEE] text-rat"}`}
        whileTap={PRESS}
      >
        {confirming ? "Toque de novo para apagar tudo" : "Apagar tudo e recomeçar"}
      </motion.button>
      <p className="mt-2 text-center text-[13px] text-ink/45">Apaga nome, objetivo, plano e grupos, e volta para a abertura.</p>
    </Panel>
  )
}
