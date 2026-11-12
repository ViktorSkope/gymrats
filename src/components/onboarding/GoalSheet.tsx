import { motion } from "motion/react"
import { useRef, type KeyboardEvent } from "react"

import { haptic } from "@/hooks/useHaptic"
import { PRESS, SHARED, settle } from "@/motion"
import { GOALS, type GoalId } from "@/theme"
import { PrimaryButton, SheetBody } from "./SheetScreen"

/** One question. The rat hops at each pick and the answer tailors the copy that follows. */
export function GoalSheet({ goal, onSelect, onContinue }: { goal: GoalId | null; onSelect: (goal: GoalId) => void; onContinue: () => void }) {
  const refs = useRef<(HTMLButtonElement | null)[]>([])

  const choose = (id: GoalId) => {
    haptic()
    onSelect(id)
  }

  // Arrow keys move through the options, like a native radio group.
  const onKeyDown = (event: KeyboardEvent, index: number) => {
    const step = event.key === "ArrowDown" || event.key === "ArrowRight" ? 1 : event.key === "ArrowUp" || event.key === "ArrowLeft" ? -1 : 0
    if (!step) return
    event.preventDefault()
    const next = (index + step + GOALS.length) % GOALS.length
    refs.current[next]?.focus()
    choose(GOALS[next].id)
  }

  const focusable = goal ?? GOALS[0].id

  return (
    <SheetBody
      title={
        <>
          O que você procura no
          <br />
          gymrats?
        </>
      }
      action={
        <PrimaryButton shared disabled={!goal} onClick={() => goal && onContinue()}>
          Continuar
        </PrimaryButton>
      }
    >
      <div role="radiogroup" aria-label="O que você procura no gymrats?" className="mx-auto mt-[clamp(24px,8dvh,84px)] flex max-w-[262px] flex-col gap-4">
        {GOALS.map((option, index) => {
          const selected = goal === option.id
          return (
            <motion.button
              key={option.id}
              ref={(el) => {
                refs.current[index] = el
              }}
              type="button"
              role="radio"
              aria-checked={selected}
              tabIndex={option.id === focusable ? 0 : -1}
              onClick={() => choose(option.id)}
              onKeyDown={(event) => onKeyDown(event, index)}
              className="relative flex h-[50px] items-center justify-center rounded-[20px] border border-ink px-4 text-[16px] outline-none focus-visible:ring-3 focus-visible:ring-ink/25"
              {...settle(index, 0.08)}
              whileTap={PRESS}
            >
              {/* One dark fill that slides to whichever option is chosen. */}
              {selected && <motion.span layoutId={SHARED.goalFill} className="absolute -inset-px rounded-[20px] bg-ink" transition={{ type: "spring", stiffness: 500, damping: 38 }} />}
              <span className={`relative transition-colors duration-200 ${selected ? "text-white" : "text-ink"}`}>{option.label}</span>
            </motion.button>
          )
        })}
      </div>
    </SheetBody>
  )
}
