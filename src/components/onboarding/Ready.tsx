import { motion } from "motion/react"
import { useEffect } from "react"

import rails from "@/assets/splash-rails.mp4"
import { MuscleRat } from "@/components/rats/MuscleRat"
import { CLOSE, EASE_IN_OUT, close, open, settle } from "@/motion"
import { themeStyle } from "@/theme"
import { PrimaryButton } from "./SheetScreen"

/** The finish line: the rat flexes over moving stripes, and one button lets you in. */
export function Ready({ title, onDone }: { title: string; onDone: () => void }) {
  useEffect(() => {
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", "#1D1D1D")
  }, [])

  return (
    <motion.div
      className="absolute inset-0 flex flex-col overflow-hidden bg-ink"
      style={themeStyle("red")}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, transition: open() }}
      exit={{ opacity: 0, transition: close }}
    >
      {/* The same dark light-rails loop as the splash, so the onboarding ends where it began. */}
      <video
        src={rails}
        autoPlay
        muted
        loop
        playsInline
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 size-full object-cover"
      />

      <div className="relative flex min-h-0 flex-1 items-center justify-center pt-[max(24px,env(safe-area-inset-top))]">
        <MuscleRat className="h-[min(44dvh,360px)] w-auto" />
      </div>

      <motion.section
        className="relative mx-[9px] mb-[max(7px,env(safe-area-inset-bottom))] rounded-[30px] bg-paper px-8 pt-8 pb-6"
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%", transition: { duration: CLOSE, ease: EASE_IN_OUT } }}
        transition={{ type: "spring", stiffness: 300, damping: 32, delay: 0.15 }}
      >
        <motion.h1 className="text-[26px] leading-[1.12] font-normal tracking-[-0.02em] text-balance" {...settle(0, 0.35)}>
          {title}
        </motion.h1>
        <motion.div className="mt-[clamp(20px,4dvh,36px)] -mx-[10px]" {...settle(1, 0.35)}>
          <PrimaryButton onClick={onDone}>Começar a usar</PrimaryButton>
        </motion.div>
      </motion.section>
    </motion.div>
  )
}
