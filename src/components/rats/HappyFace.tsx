import { motion } from "motion/react"

import { Eyes, type EyeSpec } from "./Eyes"

const SPEC: EyeSpec = { style: "pupil", left: [140, 70], right: [260, 70], r: 52, pupil: 40, rest: { x: 0, y: -0.6 } }

// Little bits that burst out once, like confetti made of sweat and stars.
const BITS = Array.from({ length: 12 }, (_, i) => {
  const angle = (i / 12) * Math.PI * 2 + 0.3
  return { x: Math.cos(angle) * (150 + (i % 3) * 30), y: Math.sin(angle) * (90 + (i % 2) * 30), r: 7 + (i % 3) * 3, white: i % 2 === 0 }
})

/** A big cheering face for good news: pops in, throws confetti, then keeps blinking. */
export function HappyFace({ className }: { className?: string }) {
  return (
    <svg viewBox="-20 -60 440 300" className={`overflow-visible ${className ?? ""}`} aria-hidden="true">
      {BITS.map((bit, i) => (
        <motion.circle
          key={i}
          cx={200}
          cy={110}
          r={bit.r}
          fill={bit.white ? "#fff" : "#1D1D1D"}
          fillOpacity={bit.white ? 0.9 : 0.25}
          initial={{ x: 0, y: 0, opacity: 0, scale: 0 }}
          animate={{ x: bit.x, y: bit.y, opacity: [0, 1, 1, 0], scale: [0, 1, 1, 0.6] }}
          transition={{ duration: 1.1, delay: 0.25 + (i % 4) * 0.03, ease: [0.2, 0.8, 0.3, 1] }}
        />
      ))}
      <motion.g
        style={{ transformBox: "fill-box", transformOrigin: "50% 100%" }}
        initial={{ scale: 0.4, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 420, damping: 14, delay: 0.1 }}
      >
        <Eyes spec={SPEC} />
        <motion.path
          d="M120 150Q120 140 130 140H270Q280 140 280 150A80 72 0 0 1 120 150Z"
          fill="#1D1D1D"
          style={{ transformBox: "fill-box", transformOrigin: "50% 0%" }}
          animate={{ scaleY: [1, 0.86, 1] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
        />
      </motion.g>
    </svg>
  )
}
