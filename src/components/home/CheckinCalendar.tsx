import { motion } from "motion/react"
import { useState } from "react"

import { EASE_IN_OUT, STAGGER } from "@/motion"

const WEEKS = 17
const DAY_LABELS = ["D", "S", "T", "Q", "Q", "S", "S"]
const MONTHS = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"]

const startOfDay = (time: number) => {
  const d = new Date(time)
  d.setHours(0, 0, 0, 0)
  return d
}
const key = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`

/**
 * Check-in days as a GitHub-style grid: one column per week (Sunday on top), the
 * current week on the right. A day with a check-in fills red, two or more go darker,
 * today is outlined, and days still to come fade out.
 */
export function CheckinCalendar({ checkins }: { checkins: number[] }) {
  const counts = new Map<string, number>()
  for (const t of checkins) {
    const k = key(startOfDay(t))
    counts.set(k, (counts.get(k) ?? 0) + 1)
  }

  // Read once per mount, so the grid stays stable across re-renders.
  const [today] = useState(() => startOfDay(Date.now()))
  const first = new Date(today)
  first.setDate(today.getDate() - today.getDay() - (WEEKS - 1) * 7)

  const weeks = Array.from({ length: WEEKS }, (_, w) =>
    Array.from({ length: 7 }, (_, d) => {
      const day = new Date(first)
      day.setDate(first.getDate() + w * 7 + d)
      return day
    }),
  )

  // A month's name sits under the first week that starts in it.
  const monthAt = weeks.map((week, w) => (w === 0 || week[0].getMonth() !== weeks[w - 1][0].getMonth() ? MONTHS[week[0].getMonth()] : ""))
  const total = [...counts.keys()].length

  return (
    <div>
      <div className="flex items-end justify-between">
        <div>
          <p className="text-[14px] font-semibold">Dias de treino</p>
          <p className="text-[12px] text-ink/50">Últimas {WEEKS} semanas</p>
        </div>
        <motion.p key={total} className="text-[28px] leading-none font-semibold tracking-[-0.03em] tabular-nums" initial={{ y: 8, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.2, ease: EASE_IN_OUT }}>
          {total}
        </motion.p>
      </div>

      <div className="mt-2 grid gap-x-[3px]" style={{ gridTemplateColumns: `14px repeat(${WEEKS}, minmax(0, 1fr))` }} role="img" aria-label={`${total} dias de treino nas últimas ${WEEKS} semanas`}>
        <div className="grid grid-rows-7 gap-y-[3px]" aria-hidden="true">
          {DAY_LABELS.map((label, i) => (
            <span key={i} className="flex items-center text-[10px] leading-none text-ink/40">
              {label}
            </span>
          ))}
        </div>
        {weeks.map((week, w) => (
          <div key={w} className="grid grid-rows-7 gap-y-[3px]">
            {week.map((day) => {
              const count = counts.get(key(day)) ?? 0
              const future = day > today
              const isToday = day.getTime() === today.getTime()
              return (
                <motion.span
                  key={day.getTime()}
                  className={`h-[clamp(10px,1.6dvh,15px)] rounded-[3.5px] ${count >= 2 ? "bg-[#A8291E]" : count ? "bg-rat" : future ? "bg-[#E6E4E7]/45" : "bg-[#E6E4E7]"} ${isToday ? "ring-[1.5px] ring-ink/70 ring-offset-1 ring-offset-paper" : ""}`}
                  initial={{ opacity: 0, scale: 0.6 }}
                  animate={{ opacity: 1, scale: 1 }}
                  // Columns fill in left to right, 30ms apart.
                  transition={{ duration: 0.2, ease: EASE_IN_OUT, delay: 0.15 + w * STAGGER }}
                />
              )
            })}
          </div>
        ))}
        <span />
        {monthAt.map((label, w) => (
          <span key={w} className="mt-1 overflow-visible text-[10px] leading-none whitespace-nowrap text-ink/45">
            {label}
          </span>
        ))}
      </div>
    </div>
  )
}
