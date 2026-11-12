import { motion, useSpring, useTransform, type MotionValue } from "motion/react"
import { useEffect, useId, useState } from "react"

const INK = "#1D1D1D"

export type Look = { x: number; y: number }

/**
 * pupil: white eye with a dark pupil that rolls to the edge.
 * ring: white ring with a centred pupil that shifts a little.
 * dot: a plain dark dot.
 */
export type EyeSpec = {
  style: "pupil" | "ring" | "dot"
  left: [number, number]
  right: [number, number]
  r: number
  pupil: number
  /** Where the eyes rest when nothing is driving them, from -1 to 1. */
  rest: Look
}

const random = (min: number, max: number) => min + Math.random() * (max - min)

/** Blinks every few seconds, sometimes twice. */
export function useBlink() {
  const [shut, setShut] = useState(false)
  useEffect(() => {
    let timer = 0
    const later = (ms: number, run: () => void) => {
      timer = window.setTimeout(run, ms)
    }
    const schedule = () =>
      later(random(2200, 4800), () => {
        setShut(true)
        later(120, () => {
          setShut(false)
          if (Math.random() > 0.25) return schedule()
          later(140, () => {
            setShut(true)
            later(110, () => {
              setShut(false)
              schedule()
            })
          })
        })
      })
    schedule()
    return () => clearTimeout(timer)
  }, [])
  return shut
}

/** Springs toward the given look, or glances around on its own when there is none. */
export function useGaze(look: Look | undefined, rest: Look) {
  const x = useSpring(rest.x, { stiffness: 260, damping: 24 })
  const y = useSpring(rest.y, { stiffness: 260, damping: 24 })
  const lx = look?.x
  const ly = look?.y
  useEffect(() => {
    if (lx !== undefined && ly !== undefined) {
      x.set(lx)
      y.set(ly)
      return
    }
    let timer = 0
    const glance = (first: boolean) => {
      // Mostly at rest, sometimes looking around: alive without being twitchy.
      const atRest = first || Math.random() < 0.45
      x.set(atRest ? rest.x : random(-1, 1))
      y.set(atRest ? rest.y : random(-0.7, 0.8))
      timer = window.setTimeout(() => glance(false), random(900, 2600))
    }
    glance(true)
    return () => clearTimeout(timer)
  }, [lx, ly, rest.x, rest.y, x, y])
  return { x, y }
}

function Eye({ cx, cy, spec, x, y }: { cx: number; cy: number; spec: EyeSpec; x: MotionValue<number>; y: MotionValue<number> }) {
  const clip = "eye" + useId().replace(/[^a-zA-Z0-9]/g, "")
  const reach = spec.style === "ring" ? 7 : spec.style === "dot" ? 6 : spec.r - spec.pupil + 3
  const px = useTransform(x, (v) => v * reach)
  const py = useTransform(y, (v) => v * reach)

  if (spec.style === "dot") return <motion.circle cx={cx} cy={cy} r={spec.r} fill={INK} style={{ x: px, y: py }} />

  return (
    <g>
      <circle cx={cx} cy={cy} r={spec.r} fill="#fff" />
      <clipPath id={clip}>
        <circle cx={cx} cy={cy} r={spec.r} />
      </clipPath>
      <g clipPath={`url(#${clip})`}>
        <motion.circle cx={cx} cy={cy} r={spec.pupil} fill={INK} style={{ x: px, y: py }} />
      </g>
    </g>
  )
}

/** A pair of eyes that blink, glance around, and can be told where to look or to shut. */
export function Eyes({ spec, look, closed = false }: { spec: EyeSpec; look?: Look; closed?: boolean }) {
  const blink = useBlink()
  const { x, y } = useGaze(look, spec.rest)
  return (
    <motion.g
      style={{ transformBox: "fill-box", transformOrigin: "center" }}
      animate={{ scaleY: closed || blink ? 0.08 : 1 }}
      transition={{ duration: closed ? 0.18 : 0.08, ease: "easeInOut" }}
    >
      <Eye cx={spec.left[0]} cy={spec.left[1]} spec={spec} x={x} y={y} />
      <Eye cx={spec.right[0]} cy={spec.right[1]} spec={spec} x={x} y={y} />
    </motion.g>
  )
}
