import { motion, useAnimate, useTransform, type MotionValue } from "motion/react"
import { useEffect, useId } from "react"

import { useBlink, useGaze, type Look } from "./Eyes"
import { GLASSES } from "./paths"

const RED = "#D23A2C"
const LENS = "#DB6256"
const FRAME = "#A22216"
const PUPIL = "#4D4D4D"

// Measured from the illustration: lens centres, and where the eyeball and pupil rest inside them.
const LENSES: [number, number][] = [
  [518, 660],
  [847, 660],
]
const LENS_R = 138
const BALL_R = 109
const PUPIL_R = 82
const BALL_REST = { x: -26, y: -11 }
const PUPIL_REST = { x: 17, y: 14 }

function Lens({ cx, cy, x, y, shut }: { cx: number; cy: number; x: MotionValue<number>; y: MotionValue<number>; shut: boolean }) {
  const clip = "lens" + useId().replace(/[^a-zA-Z0-9]/g, "")
  // The eyeball drifts a little inside the lens; the pupil rolls further inside the eyeball.
  const bx = useTransform(x, (v) => BALL_REST.x + v * 22)
  const by = useTransform(y, (v) => BALL_REST.y + v * 14)
  const px = useTransform(x, (v) => PUPIL_REST.x + v * 14)
  const py = useTransform(y, (v) => PUPIL_REST.y + v * 12)
  return (
    <g>
      <circle cx={cx} cy={cy} r={LENS_R} fill={LENS} />
      <clipPath id={clip}>
        <circle cx={cx} cy={cy} r={LENS_R} />
      </clipPath>
      <g clipPath={`url(#${clip})`}>
        <motion.g style={{ x: bx, y: by }}>
          <motion.g
            style={{ transformBox: "fill-box", transformOrigin: "center" }}
            animate={{ scaleY: shut ? 0.08 : 1 }}
            transition={{ duration: shut ? 0.16 : 0.09, ease: "easeInOut" }}
          >
            <circle cx={cx} cy={cy} r={BALL_R} fill="#fff" />
            <motion.circle cx={cx} cy={cy} r={PUPIL_R} fill={PUPIL} style={{ x: px, y: py }} />
          </motion.g>
        </motion.g>
      </g>
      <circle cx={cx} cy={cy} r={LENS_R + 10} fill="none" stroke={FRAME} strokeWidth={20} />
    </g>
  )
}

type Props = {
  look?: Look
  closed?: boolean
  /** Change this number to make the rat hop. */
  hop?: number
  className?: string
}

/** The onboarding rat: glasses on, clipboard in hand, taking notes on your answers. */
export function GlassesRat({ look, closed = false, hop = 0, className }: Props) {
  const [scope, animate] = useAnimate<SVGGElement>()
  const blink = useBlink()
  const { x, y } = useGaze(look, { x: 0, y: 0 })
  const shut = closed || blink

  useEffect(() => {
    if (!hop || !scope.current) return
    animate(scope.current, { y: [0, -60, 0, -16, 0], scaleY: [1, 1.04, 0.96, 1.01, 1] }, { duration: 0.6, ease: "easeOut" })
  }, [hop, animate, scope])

  return (
    <svg viewBox={`0 0 ${GLASSES.w} ${GLASSES.h}`} className={className} aria-hidden="true" overflow="visible">
      <g ref={scope} style={{ transformBox: "fill-box", transformOrigin: "50% 100%" }}>
        <motion.g
          style={{ transformBox: "fill-box", transformOrigin: "50% 100%" }}
          animate={{ scaleY: [1, 1.015, 1], scaleX: [1, 0.996, 1] }}
          transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
        >
          <path d={GLASSES.body} fill={RED} fillRule="evenodd" />
          <path d={GLASSES.white} fill="#fff" fillRule="evenodd" />
          <path d="M664 656Q683 648 702 656" fill="none" stroke={FRAME} strokeWidth={12} />
          {LENSES.map(([cx, cy]) => (
            <Lens key={cx} cx={cx} cy={cy} x={x} y={y} shut={shut} />
          ))}
        </motion.g>
      </g>
    </svg>
  )
}
