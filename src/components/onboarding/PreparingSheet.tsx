import { AnimatePresence, animate, motion, useMotionValue, useTransform } from "motion/react"
import { useEffect, useState } from "react"

import { haptic } from "@/hooks/useHaptic"
import { settle } from "@/motion"
import { SheetBody, type RatMood } from "./SheetScreen"

// Each step finishes at this percentage. The bar moves unevenly on purpose:
// quick starts, a pause on the "hard" step, then a rush to the end reads as real work.
const DONE_AT = [24, 51, 82, 100]
const KEYFRAMES = [0, 14, 24, 39, 51, 64, 82, 97, 100]
const TIMES = [0, 0.08, 0.17, 0.33, 0.45, 0.6, 0.78, 0.93, 1]
const DURATION = 6.6

function Spinner() {
  return (
    <svg viewBox="0 0 24 24" className="size-6 animate-spin [animation-duration:900ms]" aria-hidden="true">
      <circle cx="12" cy="12" r="9" fill="none" stroke="rgb(255 255 255 / 0.18)" strokeWidth="2.5" />
      <circle cx="12" cy="12" r="9" fill="none" stroke="var(--rat)" strokeWidth="2.5" strokeLinecap="round" strokeDasharray="20 100" />
    </svg>
  )
}

function Check() {
  return (
    <svg viewBox="0 0 24 24" className="size-[26px]" aria-hidden="true">
      <motion.path
        d="M3.5 12.5l5.5 5.5L21 6"
        fill="none"
        stroke="var(--color-check)"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
      />
    </svg>
  )
}

const caption = (pct: number) => (pct >= 100 ? "Tudo pronto!" : pct < 24 ? "Só um instante..." : "Quase lá...")

/**
 * Labor perception: shows the work being done for you while it "loads", so the
 * setup feels tailored. The rat watches each line as it is worked on.
 */
export function PreparingSheet({ goalStep, onMood, onHop, onDone }: { goalStep: string; onMood: (mood: RatMood) => void; onHop: () => void; onDone: () => void }) {
  const steps = ["Personalizando seu gymrat", "Definindo o sistema de pontuação flexível", "Integrando com aplicativos de saúde", goalStep]
  const progress = useMotionValue(0)
  const width = useTransform(progress, (v) => `${v}%`)
  const [pct, setPct] = useState(0)

  useEffect(() => {
    const controls = animate(progress, KEYFRAMES, {
      duration: DURATION,
      times: TIMES,
      ease: "easeInOut",
      onUpdate: (v) => setPct(Math.round(v)),
    })
    return () => controls.stop()
  }, [progress])

  const done = pct >= 100
  const active = DONE_AT.findIndex((at) => pct < at)

  // The rat looks down at the line being worked on, then up at you when it is all done.
  useEffect(() => {
    onMood(done ? { look: { x: 0, y: 0.2 } } : { look: { x: -0.7, y: 0.5 + active * 0.17 } })
  }, [active, done, onMood])

  // Done: a happy hop, a beat to read "Tudo pronto!", then on to the finish line.
  useEffect(() => {
    if (!done) return
    haptic(20)
    onHop()
    const timer = window.setTimeout(onDone, 900)
    return () => clearTimeout(timer)
  }, [done, onHop, onDone])

  return (
    <SheetBody
      title="Preparando o seu espaço de treinamento..."
      action={
        <div className="px-2.5 pt-2 pb-2">
          <p className="text-center text-[17px] text-white/55 tabular-nums" aria-live="polite">
            {caption(pct)} {pct}%
          </p>
          <div className="mt-3 h-3 overflow-hidden rounded-full bg-white/10" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct} aria-label="Preparando">
            <motion.div className="h-full rounded-full bg-rat" style={{ width }} />
          </div>
        </div>
      }
    >
      <ul className="mt-[clamp(20px,6dvh,56px)] space-y-7">
        <AnimatePresence initial={false}>
          {steps.map((text, index) => {
            const visible = index === 0 || pct >= DONE_AT[index - 1]
            if (!visible) return null
            const finished = pct >= DONE_AT[index]
            return (
              // Each line settles in like a notification as its step starts.
              <motion.li key={text} className="flex items-start gap-3.5 text-[17px] leading-snug" {...settle()}>
                <span className="mt-[-2px] flex size-[26px] shrink-0 items-center justify-center">{finished ? <Check /> : <Spinner />}</span>
                <span className={finished ? "text-white" : "text-white/75"}>{text}</span>
              </motion.li>
            )
          })}
        </AnimatePresence>
      </ul>
    </SheetBody>
  )
}
