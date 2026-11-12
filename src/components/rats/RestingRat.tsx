import { AnimatePresence, motion, useAnimate } from "motion/react"
import { useEffect, useState } from "react"

import { haptic } from "@/hooks/useHaptic"

const FUR = "#C6C6C6"
const SHADE = "#8F8F8F"

const BODY =
  "M95 190C60 165 25 130 25 95C25 55 70 25 110 25C140 25 160 70 175 115H265C280 70 300 25 330 25C370 25 415 55 415 95C415 130 390 165 355 190V310C355 325 362 338 375 350L455 430C468 443 472 460 472 478C472 520 445 555 405 555H160C124 555 95 526 95 490Z"
const MOUTH = "M228 290C228 262 252 245 279 245C306 245 330 262 330 290Q330 298 322 298H236Q228 298 228 290Z"

const Z_STYLE = { fontFamily: "inherit", fontWeight: 600, fill: SHADE } as const

/**
 * A grey rat asleep on its feet: nothing to compete in yet. It breathes slowly, snores Zs,
 * and, when poked, opens its eyes for a moment before nodding off again.
 */
export function RestingRat({ className }: { className?: string }) {
  const [scope, animate] = useAnimate<SVGGElement>()
  const [awake, setAwake] = useState(false)

  useEffect(() => {
    if (!awake) return
    const timer = setTimeout(() => setAwake(false), 1400)
    return () => clearTimeout(timer)
  }, [awake])

  const poke = () => {
    haptic(10)
    setAwake(true)
    animate(scope.current, { scaleX: [1, 1.06, 0.97, 1], scaleY: [1, 0.93, 1.03, 1] }, { duration: 0.5, ease: "easeOut" })
  }

  return (
    <motion.svg viewBox="0 -40 560 640" className={className} onTap={poke} role="img" aria-label="Rato descansando">
      <g ref={scope} style={{ transformBox: "fill-box", transformOrigin: "50% 100%" }}>
        {/* Slow, deep sleep breathing. */}
        <motion.g
          style={{ transformBox: "fill-box", transformOrigin: "50% 100%" }}
          animate={{ scaleY: [1, 1.025, 1], scaleX: [1, 1.008, 1] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        >
          <path d="M345 552L382 584M425 545L462 578" stroke={FUR} strokeWidth="28" strokeLinecap="round" />
          <path d={BODY} fill={FUR} />
          <AnimatePresence initial={false} mode="wait">
            {awake ? (
              <motion.g key="open" initial={{ scaleY: 0.1 }} animate={{ scaleY: 1 }} exit={{ scaleY: 0.1 }} style={{ transformBox: "fill-box", transformOrigin: "center" }} transition={{ duration: 0.12 }}>
                <circle cx="225" cy="206" r="13" fill="#1E1E1E" />
                <circle cx="305" cy="206" r="13" fill="#1E1E1E" />
              </motion.g>
            ) : (
              <motion.path
                key="shut"
                d="M205 205A20 20 0 0 0 245 205M285 205A20 20 0 0 0 325 205"
                fill="none"
                stroke={SHADE}
                strokeWidth="8"
                strokeLinecap="round"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.12 }}
              />
            )}
          </AnimatePresence>
          {/* Snoring: the mouth opens a little on each breath. */}
          <motion.path
            d={MOUTH}
            fill={SHADE}
            style={{ transformBox: "fill-box", transformOrigin: "50% 100%" }}
            animate={awake ? { scaleY: 0.55 } : { scaleY: [0.8, 1, 0.8] }}
            transition={awake ? { duration: 0.15 } : { duration: 4, repeat: Infinity, ease: "easeInOut" }}
          />
        </motion.g>
      </g>

      {!awake &&
        [0, 1, 2].map((i) => (
          <motion.text
            key={i}
            x={400}
            y={150}
            fontSize={34 + i * 10}
            style={Z_STYLE}
            initial={{ opacity: 0, x: 0, y: 0 }}
            animate={{ opacity: [0, 1, 0], x: [0, 30 + i * 8, 60 + i * 12], y: [0, -60, -130] }}
            transition={{ duration: 3.6, delay: i * 1.2, repeat: Infinity, ease: "easeOut" }}
          >
            z
          </motion.text>
        ))}
    </motion.svg>
  )
}
