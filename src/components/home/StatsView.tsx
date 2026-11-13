import { DumbbellIcon, TrendingDownIcon, TrendingUpIcon } from "lucide-react"
import { motion } from "motion/react"
import { useState } from "react"

import { GroupCover } from "@/components/groups/GroupCover"
import { ranking, streak, type Group } from "@/components/groups/groups"
import { Card, CardLabel } from "@/components/ui/kit"
import { PRESS, settle } from "@/motion"
import { THEMES, type RatKind } from "@/theme"

const DAY = 86_400_000
const WEEKDAYS = ["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"]
const MONTHS = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"]

const startOfDay = (t: number) => {
  const d = new Date(t)
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}
const startOfWeek = (t: number) => {
  const d = new Date(startOfDay(t))
  d.setDate(d.getDate() - d.getDay())
  return d.getTime()
}
const weekLabel = (start: number) => {
  const a = new Date(start)
  const b = new Date(start + 6 * DAY)
  return a.getMonth() === b.getMonth() ? `${a.getDate()}–${b.getDate()} ${MONTHS[b.getMonth()]}` : `${a.getDate()} ${MONTHS[a.getMonth()]} – ${b.getDate()} ${MONTHS[b.getMonth()]}`
}

type Week = { start: number; days: number; rank: number; current: boolean }

/** Your weeks ranked against each other, by how many days you trained. */
function rankWeeks(days: number[], now: number): Week[] {
  const byWeek = new Map<number, number>()
  for (const d of days) byWeek.set(startOfWeek(d), (byWeek.get(startOfWeek(d)) ?? 0) + 1)
  const thisWeek = startOfWeek(now)
  if (!byWeek.has(thisWeek)) byWeek.set(thisWeek, 0)
  const weeks = [...byWeek.entries()].map(([start, n]) => ({ start, days: n })).sort((a, b) => b.days - a.days || b.start - a.start)
  return weeks.map((w) => ({ ...w, rank: weeks.findIndex((o) => o.days === w.days) + 1, current: w.start === thisWeek }))
}

function Tile({ value, label, kind, index }: { value: string | number; label: string; kind: RatKind; index: number }) {
  return (
    <motion.div className="flex min-h-[96px] flex-col justify-between rounded-[24px] p-4" style={{ backgroundColor: THEMES[kind].rat, color: THEMES[kind].onRat }} {...settle(index, 0.15)}>
      <span className="text-[26px] leading-none font-semibold first-letter:uppercase">{value}</span>
      <span className="text-[13px] leading-tight font-medium opacity-85">{label}</span>
    </motion.div>
  )
}

/** One week in your personal ranking; this week is highlighted like your row in a group. */
function WeekRow({ week, best, index }: { week: Week; best: number; index: number }) {
  return (
    <motion.li className={`flex h-[52px] items-center gap-3 rounded-[22px] pr-4 pl-3 ${week.current ? "bg-rat text-on-rat" : "bg-[#EDEBEE]"}`} {...settle(index, 0.2)}>
      <span className="w-8 text-center text-[17px] font-semibold tabular-nums">{week.rank}º</span>
      <span className="min-w-0 flex-1 leading-tight">
        <span className="block truncate text-[15px] font-medium">{week.current ? "Esta semana" : weekLabel(week.start)}</span>
        <span className={`mt-1 block h-1.5 overflow-hidden rounded-full ${week.current ? "bg-black/18" : "bg-ink/10"}`}>
          <motion.span className={`block h-full rounded-full ${week.current ? "bg-paper" : "bg-ink"}`} initial={{ width: 0 }} animate={{ width: `${(week.days / Math.max(1, best)) * 100}%` }} transition={{ duration: 0.5, ease: [0.42, 0, 0.58, 1], delay: 0.2 + index * 0.03 }} />
        </span>
      </span>
      <span className="shrink-0 text-right leading-none">
        <span className="text-[22px] font-medium tabular-nums">{week.days}</span>
        <span className="ml-1 text-[12px] opacity-60">{week.days === 1 ? "dia" : "dias"}</span>
      </span>
    </motion.li>
  )
}

/**
 * Your training, ranked against yourself: this week against your best weeks, your
 * records, and where you stand in each group. Same cards and rows as the rest of the app.
 */
export function StatsView({ groups, me, onCheckIn }: { groups: Group[]; me: string; onCheckIn: () => void }) {
  const [now] = useState(() => Date.now())
  const all = groups.flatMap((g) => g.checkins)
  const days = [...new Set(all.map(startOfDay))]
  const weeks = rankWeeks(days, now)
  const top = weeks.slice(0, 5)
  const current = weeks.find((w) => w.current)!
  const shown = top.includes(current) ? top : [...top.slice(0, 4), current]
  const best = weeks[0]?.days ?? 0
  const lastWeek = weeks.find((w) => w.start === startOfWeek(now) - 7 * DAY)?.days ?? 0
  const delta = current.days - lastWeek

  const weekday = (() => {
    if (!days.length) return "—"
    const counts = Array(7).fill(0)
    for (const d of days) counts[new Date(d).getDay()]++
    return WEEKDAYS[counts.indexOf(Math.max(...counts))]
  })()
  const period = (() => {
    if (!all.length) return "—"
    const buckets = { manhã: 0, tarde: 0, noite: 0 }
    for (const t of all) {
      const h = new Date(t).getHours()
      buckets[h < 12 ? "manhã" : h < 18 ? "tarde" : "noite"]++
    }
    return Object.entries(buckets).sort((a, b) => b[1] - a[1])[0][0]
  })()

  return (
    <>
      <Card index={0}>
        <CardLabel>Seus treinos</CardLabel>
        <div className="mt-3 flex items-end justify-between gap-4">
          <div>
            <p className="text-[clamp(44px,13vw,56px)] leading-none font-semibold tracking-[-0.04em] tabular-nums">{days.length}</p>
            <p className="mt-1 text-[14px] text-ink/55">dias de treino no total</p>
          </div>
          <span className={`mb-1 flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[14px] font-medium ${delta >= 0 ? "bg-check/15 text-check" : "bg-rat/12 text-rat"}`}>
            {delta >= 0 ? <TrendingUpIcon className="size-4" /> : <TrendingDownIcon className="size-4" />}
            {delta >= 0 ? `+${delta}` : delta} vs semana passada
          </span>
        </div>
        <motion.button type="button" onClick={onCheckIn} className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-[20px] bg-rat text-[17px] text-on-rat" whileTap={PRESS}>
          <DumbbellIcon className="size-5" />
          Fazer check-in
        </motion.button>
      </Card>

      <Card index={1}>
        <div className="flex items-baseline justify-between">
          <CardLabel>Ranking das suas semanas</CardLabel>
          <span className="text-[13px] text-ink/50">{weeks.length} semanas</span>
        </div>
        <p className="mt-1 text-[14px] text-ink/55">{current.rank === 1 && current.days > 0 ? "Esta é a sua melhor semana até agora!" : `Esta semana está em ${current.rank}º lugar. Treine mais ${Math.max(1, best - current.days)} ${best - current.days === 1 ? "dia" : "dias"} para empatar com a melhor.`}</p>
        <ol className="mt-3 flex flex-col gap-1.5">
          {shown.map((week, i) => (
            <WeekRow key={week.start} week={week} best={best} index={i} />
          ))}
        </ol>
      </Card>

      <div className="grid shrink-0 grid-cols-2 gap-2">
        <Tile index={0} kind="yellow" value={streak(groups).best} label="Maior sequência de dias" />
        <Tile index={1} kind="blue" value={best} label="Dias na melhor semana" />
        <Tile index={2} kind="green" value={weekday} label="Seu dia favorito" />
        <Tile index={3} kind="red" value={period} label="Seu horário favorito" />
      </div>

      {groups.length > 0 && (
        <Card index={2}>
          <CardLabel>Você nos grupos</CardLabel>
          <ul className="mt-3 flex flex-col gap-1.5">
            {groups.map((group, i) => {
              const standings = ranking(group, me)
              const mine = standings.find((s) => s.me)!
              return (
                <motion.li key={group.id} className="flex items-center gap-3 rounded-[22px] bg-[#EDEBEE] p-2 pr-4" {...settle(i, 0.25)}>
                  <GroupCover cover={group.cover} rat={false} className="size-11 shrink-0 rounded-[14px]" />
                  <span className="min-w-0 flex-1 truncate text-[15px] font-medium">{group.name}</span>
                  <span className="shrink-0 text-right leading-tight">
                    <span className="block text-[18px] font-semibold tabular-nums">{mine.rank}º</span>
                    <span className="block text-[12px] text-ink/50">de {standings.length}</span>
                  </span>
                </motion.li>
              )
            })}
          </ul>
        </Card>
      )}
    </>
  )
}
