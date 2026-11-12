import { motion } from "motion/react"
import type { ReactNode } from "react"

import { PRESS, settle } from "@/motion"

/**
 * The app's building blocks, shared so every screen reads the same:
 * rounded cards on the dark background, 7px from the edges and 8px apart,
 * round light icon buttons, and one main action floating at the bottom.
 */

/** A light card, the default surface. */
export function Card({ children, index = 0, className = "" }: { children: ReactNode; index?: number; className?: string }) {
  return (
    <motion.section className={`shrink-0 rounded-[30px] bg-paper p-5 text-ink ${className}`} {...settle(index, 0.1)}>
      {children}
    </motion.section>
  )
}

/** A small bold label at the top of a card. */
export function CardLabel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <h2 className={`text-[15px] font-semibold ${className}`}>{children}</h2>
}

/** Round icon button: light disc, dark icon. */
export function RoundButton({ label, onClick, children, className = "" }: { label: string; onClick: () => void; children: ReactNode; className?: string }) {
  return (
    <motion.button type="button" aria-label={label} onClick={onClick} className={`flex size-11 shrink-0 items-center justify-center rounded-full bg-paper text-ink ${className}`} whileTap={PRESS}>
      {children}
    </motion.button>
  )
}

/** Height a screen's content leaves free at the end, so the floating action never covers it. */
export const FLOAT_SPACE = "pb-[calc(56px+max(14px,var(--sab))+20px)]"

/** The screen's main action, floating over the content with no bar behind it. */
export function FloatingAction({ children }: { children: ReactNode }) {
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 px-[7px] pb-[max(14px,var(--sab))]">
      <div className="pointer-events-auto">{children}</div>
    </div>
  )
}

/** Light inset field style for inputs inside a card. */
export const FIELD = "w-full rounded-[20px] bg-[#EDEBEE] px-4 text-[17px] text-ink outline-none transition-shadow placeholder:text-ink/40 focus:ring-2 focus:ring-ink/80"
