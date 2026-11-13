import { motion } from "motion/react"
import { useEffect, useState } from "react"

import splashRails from "@/assets/splash-rails.mp4"
import { LogoMark } from "@/components/Logo"
import { CLOSE, EASE_IN_OUT } from "@/motion"
import { paintChrome } from "@/chrome"

/** The logo writes itself in over the light-rails video, then hands over. Tap skips it. */
export function Splash({ onDone }: { onDone: () => void }) {
  const [playing, setPlaying] = useState(false)

  useEffect(() => {
    paintChrome("#1D1D1D")
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
      {/* Fades in once it actually plays, so a slow load shows plain dark instead of a frozen frame. */}
      <motion.video
        src={splashRails}
        autoPlay
        muted
        loop
        playsInline
        aria-hidden="true"
        onPlaying={() => setPlaying(true)}
        className="pointer-events-none absolute inset-0 size-full object-cover"
        initial={{ opacity: 0 }}
        animate={{ opacity: playing ? 1 : 0 }}
        transition={{ duration: 0.4, ease: EASE_IN_OUT }}
      />
      <motion.div
        className="relative text-white drop-shadow-[0_4px_24px_rgb(0_0_0/0.35)]"
        initial={{ scale: 0.9 }}
        animate={{ scale: [0.9, 0.9, 1.06, 1] }}
        transition={{ duration: 1.6, times: [0, 0.75, 0.88, 1], ease: "easeOut" }}
      >
        <LogoMark draw className="w-[100px]" />
      </motion.div>
    </motion.div>
  )
}
