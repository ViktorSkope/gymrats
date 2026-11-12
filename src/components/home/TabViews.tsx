import { CheckIcon, DumbbellIcon } from "lucide-react"
import { AnimatePresence, motion } from "motion/react"
import { useEffect, useState, type ReactNode } from "react"

import { GroupCover } from "@/components/groups/GroupCover"
import { activeDays, checkedInToday, pointsLabel, streak, type Group } from "@/components/groups/groups"
import { PLAIN } from "@/components/rats/paths"
import { haptic } from "@/hooks/useHaptic"
import { PRESS, close, open, settle } from "@/motion"

/** Your rat's face on a light disc: the profile picture. */
export function Avatar() {
  return (
    <svg viewBox="70 230 600 600" className="size-full" aria-hidden="true">
      <rect x="70" y="230" width="600" height="600" fill="#F7F5F8" />
      <path d={PLAIN.body} fill="#D23A2C" fillRule="evenodd" />
      {[286.5, 449.7].map((cx) => (
        <g key={cx}>
          <circle cx={cx} cy={397} r={62} fill="#fff" />
          <circle cx={cx} cy={397} r={44} fill="#1D1D1D" />
        </g>
      ))}
    </svg>
  )
}

/** The light card every tab is built on. */
export function Panel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <motion.section
      className={`shrink-0 rounded-[30px] bg-paper px-5 pt-5 pb-5 ${className}`}
      initial={{ y: -24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    >
      {children}
    </motion.section>
  )
}

const today = () => new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })

/** Check in once per group, right from the tab: one tap, no detours. */
export function CheckinView({ groups, onCheckIn, onNewGroup }: { groups: Group[]; onCheckIn: (group: Group) => void; onNewGroup: () => void }) {
  const [date] = useState(today)
  const done = groups.filter(checkedInToday).length
  return (
    <Panel>
      <p className="text-[15px] font-semibold first-letter:uppercase">{date}</p>
      <h1 className="mt-3 text-[clamp(36px,11.5vw,46px)] leading-[1.02] tracking-[-0.035em] text-balance">{groups.length && done === groups.length ? "Check-in feito. Bom treino!" : "Bora treinar hoje?"}</h1>
      {groups.length ? (
        <ul className="mt-6 flex flex-col gap-2">
          {groups.map((group, index) => {
            const checked = checkedInToday(group)
            return (
              <motion.li key={group.id} className="flex items-center gap-3 rounded-[20px] bg-[#EDEBEE] p-2 pr-2" {...settle(index, 0.1)}>
                <GroupCover cover={group.cover} className="size-12 shrink-0 rounded-[14px]" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[16px] font-semibold">{group.name}</span>
                  <span className="block truncate text-[13px] text-ink/55">{pointsLabel(group)}</span>
                </span>
                <motion.button
                  type="button"
                  onClick={() => {
                    haptic(25)
                    onCheckIn(group)
                  }}
                  className={`flex h-10 shrink-0 items-center gap-1.5 rounded-full px-4 text-[15px] font-medium transition-colors ${checked ? "bg-white text-ink" : "bg-rat text-white"}`}
                  whileTap={PRESS}
                  aria-label={checked ? `Outro check-in em ${group.name}` : `Fazer check-in em ${group.name}`}
                >
                  <AnimatePresence mode="popLayout" initial={false}>
                    <motion.span key={String(checked)} className="flex items-center gap-1.5" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1, transition: open() }} exit={{ opacity: 0, scale: 0.8, transition: close }}>
                      {checked ? <CheckIcon className="size-4 text-check" strokeWidth={3} /> : <DumbbellIcon className="size-4" />}
                      {checked ? "Feito" : "Check-in"}
                    </motion.span>
                  </AnimatePresence>
                </motion.button>
              </motion.li>
            )
          })}
        </ul>
      ) : (
        <>
          <p className="mt-4 text-[17px] leading-snug text-ink/60">Check-ins contam pontos nos seus grupos. Entre ou crie um grupo para começar.</p>
          <motion.button type="button" onClick={onNewGroup} className="mt-5 h-12 w-full rounded-[20px] bg-rat text-[17px] text-white" whileTap={PRESS}>
            Novo grupo
          </motion.button>
        </>
      )}
    </Panel>
  )
}

function Stat({ value, label }: { value: number | string; label: string }) {
  return (
    <div className="rounded-[20px] bg-[#EDEBEE] p-4">
      <p className="text-[28px] leading-none font-semibold tabular-nums">{value}</p>
      <p className="mt-1.5 text-[13px] leading-tight text-ink/55">{label}</p>
    </div>
  )
}

/** You, your plan, a few totals, and the way to start over. */
export function ProfileView({ name, plan, groups, onReset }: { name: string; plan: string | null; groups: Group[]; onReset: () => void }) {
  const [confirming, setConfirming] = useState(false)
  const days = new Set(groups.flatMap((g) => g.checkins.map((t) => new Date(t).toDateString()))).size
  const best = streak(groups).best

  useEffect(() => {
    if (!confirming) return
    const timer = setTimeout(() => setConfirming(false), 3000)
    return () => clearTimeout(timer)
  }, [confirming])

  return (
    <Panel>
      <div className="flex items-center gap-4">
        <span className="block size-[72px] overflow-hidden rounded-full ring-[3px] ring-rat">
          <Avatar />
        </span>
        <div className="min-w-0">
          <h1 className="truncate text-[28px] leading-tight tracking-[-0.02em]">{name || "Você"}</h1>
          <p className="mt-1 inline-flex h-7 items-center rounded-full bg-[#E6E4E7] px-3 text-[14px]">
            {plan === "yearly" ? "Gymrats Pro · Anual" : plan === "monthly" ? "Gymrats Pro · Mensal" : "Plano gratuito"}
          </p>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-3 gap-2">
        <Stat value={days} label="Dias de treino" />
        <Stat value={best} label="Maior sequência" />
        <Stat value={groups.length} label={groups.length === 1 ? "Grupo" : "Grupos"} />
      </div>
      {groups.length > 0 && <p className="mt-3 px-1 text-[13px] text-ink/50">{groups.reduce((sum, g) => sum + activeDays(g), 0)} dias ativos somando todos os grupos.</p>}

      <motion.button
        type="button"
        onClick={() => {
          if (!confirming) return setConfirming(true)
          haptic(30)
          onReset()
        }}
        className={`mt-8 h-12 w-full rounded-[20px] text-[17px] transition-colors ${confirming ? "bg-rat text-white" : "bg-[#EDEBEE] text-rat"}`}
        whileTap={PRESS}
      >
        {confirming ? "Toque de novo para apagar tudo" : "Apagar tudo e recomeçar"}
      </motion.button>
      <p className="mt-2 text-center text-[13px] text-ink/45">Apaga nome, objetivo, plano e grupos, e volta para a abertura.</p>
    </Panel>
  )
}
