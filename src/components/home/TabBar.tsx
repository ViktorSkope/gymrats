import { DumbbellIcon, TrophyIcon, UserRoundIcon, UsersIcon, type LucideIcon } from "lucide-react"
import { motion } from "motion/react"

import { haptic } from "@/hooks/useHaptic"
import { PRESS, SHARED } from "@/motion"

export type Tab = "rankings" | "groups" | "checkin" | "profile"

export const TABS: { id: Tab; label: string; icon: LucideIcon }[] = [
  { id: "rankings", label: "Rankings", icon: TrophyIcon },
  { id: "groups", label: "Grupos", icon: UsersIcon },
  { id: "checkin", label: "Check-in", icon: DumbbellIcon },
  { id: "profile", label: "Perfil", icon: UserRoundIcon },
]

/** A floating bar in the rat's colour. One lighter pill slides to the active tab. */
export function TabBar({ active, onChange }: { active: Tab; onChange: (tab: Tab) => void }) {
  return (
    <nav aria-label="Principal" className="mx-4 flex h-[68px] items-stretch gap-1 rounded-[24px] bg-rat p-1.5 text-on-rat shadow-lg shadow-black/10">
      {TABS.map(({ id, label, icon: Icon }) => {
        const current = id === active
        return (
          <motion.button
            key={id}
            type="button"
            aria-current={current ? "page" : undefined}
            onClick={() => {
              if (current) return
              haptic()
              onChange(id)
            }}
            className="relative flex flex-1 flex-col items-center justify-center gap-1 rounded-[18px] outline-none focus-visible:ring-2 focus-visible:ring-on-rat/60"
            whileTap={PRESS}
          >
            {current && <motion.span layoutId={SHARED.activeTab} className="absolute inset-0 rounded-[18px] bg-white/22" transition={{ type: "spring", stiffness: 500, damping: 40 }} />}
            <Icon className={`relative size-[22px] transition-opacity ${current ? "" : "opacity-60"}`} strokeWidth={current ? 2.4 : 2} />
            <span className={`relative text-[11px] leading-none font-medium transition-opacity ${current ? "" : "opacity-60"}`}>{label}</span>
          </motion.button>
        )
      })}
    </nav>
  )
}
