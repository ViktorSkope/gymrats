import { DumbbellIcon, UserRoundIcon, ZapIcon } from "lucide-react"
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
  { id: "checkin", label: "Check-in", icon: DumbbellIcon },
  { id: "profile", label: "Perfil", icon: UserRoundIcon, filled: true },
]

/**
 * Four icons straight on the dark background, no bar behind them. The current
 * tab sits in a white pill that slides between them.
 */
export function BottomNav({ active, onChange }: { active: Tab; onChange: (tab: Tab) => void }) {
  return (
    <nav aria-label="Navegação" className="flex shrink-0 items-center justify-around px-4 pt-2 pb-[max(10px,env(safe-area-inset-bottom))]">
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
            className="relative flex h-11 w-[76px] items-center justify-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-white/50"
            whileTap={PRESS}
          >
            {selected && <motion.span layoutId={SHARED.activeTab} className="absolute inset-0 rounded-full bg-white" transition={{ type: "spring", stiffness: 500, damping: 40 }} />}
            <Icon className={`relative size-[22px] transition-colors duration-200 ${selected ? "text-ink" : "text-white"} ${filled ? "fill-current" : ""}`} />
          </motion.button>
        )
      })}
    </nav>
  )
}
