import { motion } from "motion/react"
import { useEffect } from "react"

import { Drop } from "@/components/Drop"
import { LogoMark } from "@/components/Logo"
import { CLOSE, EASE_IN_OUT } from "@/motion"

// Positions from the design, as a share of the screen.
const DROPS = [
  { left: "77%", top: "21%", delay: 0.2 },
  { left: "25%", top: "60%", delay: 0.45 },
  { left: "61%", top: "80%", delay: 0.7 },
]

/** The logo writes itself in while a few drops slide down, then hands over. Tap skips it. */
export function Splash({ onDone }: { onDone: () => void }) {
  useEffect(() => {
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", "#1e1e1e")
  }, [])

  useEffect(() => {
    const timer = setTimeout(onDone, 2300)
    return () => clearTimeout(timer)
  }, [onDone])

  return (
    <motion.div
      className="absolute inset-0 flex items-center justify-center overflow-hidden bg-ink"
      exit={{ opacity: 0, transition: { duration: CLOSE * 1.5, ease: EASE_IN_OUT } }}
      onClick={onDone}
      role="img"
      aria-label="gymrats"
    >
      {DROPS.map((drop) => (
        <motion.div
          key={drop.left}
          className="absolute w-[26px] text-splash-drop"
          style={{ left: drop.left, top: drop.top }}
          initial={{ opacity: 0, y: -24, scale: 0.6 }}
          animate={{ opacity: 1, y: 30, scale: 1 }}
          transition={{ delay: drop.delay, duration: 2.2, ease: "easeOut" }}
        >
          <Drop className="w-full" />
        </motion.div>
      ))}
      <motion.div
        className="text-white"
        initial={{ scale: 0.9 }}
        animate={{ scale: [0.9, 0.9, 1.06, 1] }}
        transition={{ duration: 1.6, times: [0, 0.75, 0.88, 1], ease: "easeOut" }}
      >
        <LogoMark draw className="w-[100px]" />
      </motion.div>
    </motion.div>
  )
}
