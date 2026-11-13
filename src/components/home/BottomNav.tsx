import { ChartColumnIcon, UserRoundIcon, ZapIcon } from "lucide-react"
import { motion } from "motion/react"
import type { ComponentType } from "react"

import { haptic } from "@/hooks/useHaptic"
import { PRESS, SHARED } from "@/motion"

export type Tab = "groups" | "home" | "checkin" | "profile"

/** Four dots: the groups tab. */
function DotsIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <circle cx="7.5" cy="7.5" r="3" />
      <circle cx="16.5" cy="7.5" r="3" />
      <circle cx="7.5" cy="16.5" r="3" />
      <circle cx="16.5" cy="16.5" r="3" />
    </svg>
  )
}

const ITEMS: { id: Tab; label: string; icon: ComponentType<{ className?: string }>; filled?: boolean }[] = [
  { id: "groups", label: "Grupos", icon: DotsIcon },
  { id: "home", label: "Início", icon: ZapIcon, filled: true },
  { id: "checkin", label: "Treinos", icon: ChartColumnIcon },
  { id: "profile", label: "Perfil", icon: UserRoundIcon, filled: true },
]

/**
 * A floating dock over the content: four icons in a dark frosted pill, the current
 * tab in a white pill that slides between them. Content scrolls underneath.
 */
export function BottomNav({ active, onChange }: { active: Tab; onChange: (tab: Tab) => void }) {
  return (
    <nav aria-label="Navegação" className="pointer-events-none absolute inset-x-0 bottom-0 z-10 flex justify-center pb-[max(12px,var(--sab))]">
      <div className="pointer-events-auto flex items-center gap-1 rounded-full bg-[#2B2B2B]/85 p-1.5 shadow-[0_10px_30px_rgb(0_0_0/0.45)] ring-1 ring-white/10 backdrop-blur-xl">
      {ITEMS.map(({ id, label, icon: Icon, filled }) => {
        const selected = id === active
        return (
          <motion.button
            key={id}
            type="button"
            aria-label={label}
            aria-current={selected ? "page" : undefined}
            onClick={() => {
              if (selected) return
              haptic()
              onChange(id)
            }}
            className="relative flex h-12 w-[68px] items-center justify-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-white/50"
            whileTap={PRESS}
          >
            {selected && <motion.span layoutId={SHARED.activeTab} className="absolute inset-0 rounded-full bg-white" transition={{ type: "spring", stiffness: 500, damping: 40 }} />}
            <Icon className={`relative size-[22px] transition-colors duration-200 ${selected ? "text-ink" : "text-white"} ${filled ? "fill-current" : ""}`} />
          </motion.button>
        )
      })}
      </div>
    </nav>
  )
}
