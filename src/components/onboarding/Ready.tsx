import { motion } from "motion/react"
import { useEffect } from "react"

import lightRails from "@/assets/light-rails.mp4"
import { MuscleRat } from "@/components/rats/MuscleRat"
import { CLOSE, EASE_IN_OUT, close, open, settle } from "@/motion"
import { themeStyle } from "@/theme"
import { PrimaryButton } from "./SheetScreen"

/** The finish line: the rat flexes over moving stripes, and one button lets you in. */
export function Ready({ title, onDone }: { title: string; onDone: () => void }) {
  useEffect(() => {
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", "#F26A2B")
  }, [])

  return (
    <motion.div
      className="absolute inset-0 flex flex-col overflow-hidden bg-[#F26A2B]"
      style={themeStyle("red")}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, transition: open() }}
      exit={{ opacity: 0, transition: close }}
    >
      {/* The light-rails loop, cropped and turned so only the orange part shows. */}
      <video
        src={lightRails}
        autoPlay
        muted
        loop
        playsInline
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 left-1/2 h-[135%] w-auto max-w-none -translate-x-1/2 -translate-y-1/2 -rotate-[14deg]"
      />

      <div className="relative flex min-h-0 flex-1 items-center justify-center pt-[max(24px,env(safe-area-inset-top))]">
        <MuscleRat className="h-[min(44dvh,360px)] w-auto" />
      </div>

      <motion.section
        className="relative mx-[15px] rounded-t-[32px] bg-white px-8 pt-8 pb-[max(20px,env(safe-area-inset-bottom))]"
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
