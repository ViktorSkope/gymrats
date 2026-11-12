import { ArrowUpIcon } from "lucide-react"
import { AnimatePresence, motion } from "motion/react"
import { useEffect, useState } from "react"

import { PersonAvatar } from "@/components/Avatar"
import { EASE_IN_OUT, close, open, settle } from "@/motion"
import type { Standing } from "./groups"

const CLIMB_DELAY = 0.55

/**
 * One place in a ranking. On a coloured card ("color") others are tinted rows and
 * yours is light; on a light card ("paper") others are grey and yours takes the
 * group's colour. With `climb`, your row rises from one place down into its spot
 * and the number ticks up, so the ranking feels earned.
 */
export function RankRow({ standing: s, unit, tone, index, climb = false, element = "li", className = "" }: { standing: Standing; unit: string; tone: "color" | "paper"; index: number; climb?: boolean; /** "div" when the row sits inside its own list item. */ element?: "li" | "div"; className?: string }) {
  const rising = climb && s.me
  const [rank, setRank] = useState(rising ? s.rank + 1 : s.rank)
  const [arrow, setArrow] = useState(false)

  useEffect(() => {
    if (!rising) return
    const up = window.setTimeout(() => {
      setRank(s.rank)
      setArrow(true)
    }, (CLIMB_DELAY + 0.25) * 1000)
    const hide = window.setTimeout(() => setArrow(false), (CLIMB_DELAY + 2.2) * 1000)
    return () => {
      clearTimeout(up)
      clearTimeout(hide)
    }
  }, [rising, s.rank])

  const shown = rising ? rank : s.rank
  const mine = tone === "color" ? "bg-paper text-ink" : "bg-rat text-on-rat"
  const theirs = tone === "color" ? "bg-black/18" : "bg-[#EDEBEE] text-ink"
  const muted = s.me ? (tone === "color" ? "text-ink/55" : "opacity-80") : tone === "color" ? "opacity-80" : "text-ink/55"

  const Row = element === "div" ? motion.div : motion.li
  return (
    <Row
      className={`relative flex h-[52px] shrink-0 items-center gap-3 rounded-[22px] pr-4 pl-3 ${s.me ? `z-10 ${mine}` : theirs} ${className}`}
      {...(rising
        ? { initial: { y: 58, opacity: 0.6 }, animate: { y: 0, opacity: 1 }, transition: { type: "spring", stiffness: 260, damping: 22, delay: CLIMB_DELAY } }
        : settle(index, 0.15))}
    >
      <PersonAvatar name={s.name} photo={s.photo} me={s.me} className="size-9" />
      <span className="min-w-0 flex-1 leading-tight">
        <span className={`flex items-center gap-1.5 text-[14px] ${muted}`}>
          <span className="relative inline-flex overflow-hidden tabular-nums">
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.span key={shown} initial={{ y: 14, opacity: 0 }} animate={{ y: 0, opacity: 1, transition: open() }} exit={{ y: -14, opacity: 0, transition: close }}>
                {shown}º
              </motion.span>
            </AnimatePresence>
          </span>
          lugar
          <AnimatePresence>
            {arrow && (
              <motion.span
                className="inline-flex size-[18px] items-center justify-center rounded-full bg-check text-white"
                initial={{ scale: 0, y: 6 }}
                animate={{ scale: 1, y: 0, transition: { type: "spring", stiffness: 500, damping: 18 } }}
                exit={{ scale: 0, opacity: 0, transition: { duration: 0.16, ease: EASE_IN_OUT } }}
                aria-label="Subiu uma posição"
              >
                <ArrowUpIcon className="size-3" strokeWidth={3} />
              </motion.span>
            )}
          </AnimatePresence>
        </span>
        <span className="block truncate text-[16px] font-medium">{s.me ? "Você" : s.name}</span>
      </span>
      <span className="shrink-0 text-right leading-none">
        <span className="text-[24px] font-medium tabular-nums">{s.points}</span>
        <span className={`ml-1 text-[12px] ${muted}`}>{s.points === 1 ? unit.replace(/s$/, "") : unit}</span>
      </span>
    </Row>
  )
}
