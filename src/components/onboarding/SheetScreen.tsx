import { ArrowLeftIcon } from "lucide-react"
import { AnimatePresence, motion } from "motion/react"
import { useEffect, type ReactNode } from "react"

import type { Look } from "@/components/rats/Eyes"
import { GlassesRat } from "@/components/rats/GlassesRat"
import { PRESS, SHARED, close, open, popover } from "@/motion"
import { THEMES, themeStyle } from "@/theme"

export type RatMood = { look?: Look; closed?: boolean }

type Props = {
  mood: RatMood
  hop: number
  /** Changes when the sheet's content changes, so it can cross-fade. */
  contentKey: string
  onBack?: () => void
  children: ReactNode
}

/**
 * The onboarding layout: the glasses rat peeks over a dark card.
 * The rat stays put between steps; only the sheet's content changes.
 */
export function SheetScreen({ mood, hop, contentKey, onBack, children }: Props) {
  // Match the browser chrome to the background on phones.
  useEffect(() => {
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", THEMES.red.bg)
  }, [])

  return (
    <motion.div
      className="theme-fade absolute inset-0 flex flex-col bg-rat-bg"
      style={themeStyle("red")}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: close }}
    >
      <div className="relative h-[clamp(180px,37dvh,312px)] shrink-0 overflow-hidden">
        <motion.div
          className="absolute inset-x-0 -bottom-[6%] flex h-[75%] justify-center"
          initial={{ y: "60%", opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 26, delay: 0.1 }}
        >
          <GlassesRat look={mood.look} closed={mood.closed} hop={hop} className="h-full w-auto" />
        </motion.div>

        {onBack && (
          <motion.button
            type="button"
            aria-label="Voltar"
            onClick={onBack}
            className="absolute top-[max(14px,env(safe-area-inset-top))] left-4 flex size-11 items-center justify-center rounded-full bg-white text-ink shadow-sm shadow-black/5 outline-none focus-visible:ring-3 focus-visible:ring-ink/30"
            {...popover}
            whileTap={PRESS}
          >
            <ArrowLeftIcon className="size-5" />
          </motion.button>
        )}
      </div>

      <motion.section
        className="relative mx-[9px] mb-[max(7px,env(safe-area-inset-bottom))] flex min-h-0 flex-1 flex-col overflow-hidden rounded-[30px] bg-ink text-white"
        initial={{ y: 80 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 32 }}
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={contentKey}
            className="flex min-h-0 flex-1 flex-col"
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24, transition: close }}
            transition={open()}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </motion.section>
    </motion.div>
  )
}

/** Title, body and a bottom-pinned action, with the spacing every sheet shares. */
export function SheetBody({ title, children, action }: { title: ReactNode; children: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto px-8 pt-7 pb-4">
        <h1 className="text-[26px] leading-[1.12] font-normal tracking-[-0.02em] text-balance">{title}</h1>
        {children}
      </div>
      {action && <div className="shrink-0 px-[22px] pt-2 pb-6">{action}</div>}
    </div>
  )
}

type PrimaryButtonProps = {
  children: ReactNode
  disabled?: boolean
  onClick?: () => void
  type?: "button" | "submit"
  /** The one primary button carried from screen to screen: it morphs into the next one instead of fading. */
  shared?: boolean
  className?: string
}

export function PrimaryButton({ children, disabled, onClick, type = "button", shared = false, className = "" }: PrimaryButtonProps) {
  return (
    <motion.button
      layoutId={shared ? SHARED.primaryAction : undefined}
      type={type}
      onClick={onClick}
      aria-disabled={disabled}
      className={`flex h-12 w-full items-center justify-center gap-2 rounded-[20px] bg-rat text-[17px] font-medium text-on-rat transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ink/30 aria-disabled:bg-rat/40 aria-disabled:text-on-rat/80 ${className}`}
      style={{ borderRadius: 20 }}
      transition={open()}
      whileTap={disabled ? undefined : PRESS}
    >
      {children}
    </motion.button>
  )
}
