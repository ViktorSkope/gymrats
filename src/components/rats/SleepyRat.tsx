import { motion, useAnimate } from "motion/react"

import { haptic } from "@/hooks/useHaptic"
import { SLEEPY } from "./sleepyPath"

const BODY = "#B82C21"
const FACE = "#8B1A10"

/**
 * The rat dozing on its haunches: nothing to compete in yet. It breathes slowly,
 * snores (the mouth swells on each breath) and lets out Zs. A poke makes it
 * startle and settle back down.
 */
export function SleepyRat({ className }: { className?: string }) {
  const [scope, animate] = useAnimate<SVGGElement>()

  const poke = () => {
    haptic(10)
    animate(scope.current, { scaleX: [1, 1.05, 0.97, 1], scaleY: [1, 0.94, 1.03, 1] }, { duration: 0.5, ease: "easeOut" })
  }

  return (
    <motion.svg viewBox={`0 -60 ${SLEEPY.w} ${SLEEPY.h + 60}`} className={className} onTap={poke} role="img" aria-label="Rato dormindo" overflow="visible">
      <g ref={scope} style={{ transformBox: "fill-box", transformOrigin: "50% 100%" }}>
        {/* Slow, deep sleep breathing. */}
        <motion.g
          style={{ transformBox: "fill-box", transformOrigin: "50% 100%" }}
          animate={{ scaleY: [1, 1.025, 1], scaleX: [1, 1.008, 1] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        >
          <path d={SLEEPY.body} fill={BODY} fillRule="evenodd" />
          <path d={SLEEPY.eyes} fill={FACE} fillRule="evenodd" />
          <motion.path
            d={SLEEPY.mouth}
            fill={FACE}
            fillRule="evenodd"
            style={{ transformBox: "fill-box", transformOrigin: "50% 100%" }}
            animate={{ scaleY: [0.8, 1.08, 0.8], scaleX: [0.94, 1, 0.94] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          />
        </motion.g>
      </g>

      {[0, 1, 2].map((i) => (
        <motion.text
          key={i}
          x={470}
          y={150}
          fontSize={44 + i * 12}
          style={{ fontFamily: "inherit", fontWeight: 600, fill: FACE }}
          initial={{ opacity: 0, x: 0, y: 0 }}
          animate={{ opacity: [0, 1, 0], x: [0, 30 + i * 8, 60 + i * 12], y: [0, -70, -150] }}
          transition={{ duration: 3.6, delay: i * 1.2, repeat: Infinity, ease: "easeOut" }}
        >
          z
        </motion.text>
      ))}
    </motion.svg>
  )
}
