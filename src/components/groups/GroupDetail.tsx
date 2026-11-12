import { ArrowLeftIcon, CheckIcon, CopyIcon, DumbbellIcon, PlusIcon, SendIcon } from "lucide-react"
import { AnimatePresence, motion } from "motion/react"
import { useState } from "react"

import { PrimaryButton } from "@/components/onboarding/SheetScreen"
import { haptic } from "@/hooks/useHaptic"
import { PRESS, SHARED, settle } from "@/motion"
import { THEMES, themeStyle, type RatKind } from "@/theme"
import { activeDays, checkedInToday, copyText, dayNumber, endsAt, initials, pointsLabel, shortDate, typeLabel, type Group } from "./groups"
import { GroupCover } from "./GroupCover"

function Stat({ value, label, kind, index }: { value: string | number; label: string; kind: RatKind; index: number }) {
  return (
    <motion.div className="flex min-h-[104px] flex-col justify-between rounded-[22px] p-4" style={{ backgroundColor: THEMES[kind].rat, color: THEMES[kind].onRat }} {...settle(index, 0.2)}>
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span key={value} className="text-[32px] leading-none font-semibold tabular-nums" initial={{ y: 12, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -12, opacity: 0, transition: { duration: 0.16 } }} transition={{ duration: 0.2 }}>
          {value}
        </motion.span>
      </AnimatePresence>
      <span className="text-[14px] leading-tight font-medium opacity-85">{label}</span>
    </motion.div>
  )
}

/** One group: how far along it is, who is winning, and a big button to check in. */
export function GroupDetail({ group, morph = false, me, onBack, onInvite, onChange }: { group: Group; /** Grow the cover out of its card in the list. */ morph?: boolean; me: string; onBack: () => void; onInvite: () => void; onChange: (group: Group) => void }) {
  const [copied, setCopied] = useState(false)
  const end = endsAt(group)
  const day = dayNumber(group)
  const progress = group.days ? Math.min(1, day / group.days) : 0
  const avg = group.checkins.length / Math.max(1, day)

  const copyCode = async () => {
    await copyText(group.code)
    haptic(10)
    setCopied(true)
    setTimeout(() => setCopied(false), 1600)
  }

  const checkIn = () => {
    haptic(25)
    onChange({ ...group, checkins: [...group.checkins, Date.now()] })
  }

  return (
    <div className="theme-fade flex h-full flex-col bg-white" style={themeStyle(group.cover.kind)}>
      <div className="min-h-0 flex-1 overflow-y-auto">
        <GroupCover cover={group.cover} layoutId={morph ? SHARED.cover(group.id) : undefined} className="h-[240px] rounded-b-[32px]">
          <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-black/10" />
          <motion.button type="button" aria-label="Voltar" onClick={onBack} className="absolute top-[max(12px,env(safe-area-inset-top))] left-4 flex size-11 items-center justify-center rounded-full bg-white/85 text-ink" whileTap={PRESS}>
            <ArrowLeftIcon className="size-5" />
          </motion.button>
          <div className="absolute inset-x-5 bottom-5 text-white">
            <span className="inline-block rounded-full bg-white/25 px-2.5 py-1 text-[12px] font-semibold tracking-wide uppercase backdrop-blur-sm">{typeLabel(group)}</span>
            <h1 className="mt-2 text-[34px] leading-none font-semibold tracking-[-0.02em] [text-shadow:0_1px_12px_rgb(0_0_0/0.25)]">{group.name}</h1>
          </div>
        </GroupCover>

        <div className="px-4 pt-5 pb-6">
          {group.description && (
            <motion.p className="px-1 text-[15px] text-ink/65" {...settle(0, 0.15)}>
              {group.description}
            </motion.p>
          )}

          <motion.div className="mt-3 rounded-[22px] bg-rat-bg p-4" {...settle(1, 0.15)}>
            {group.days ? (
              <>
                <div className="flex items-baseline justify-between">
                  <span className="text-[17px] font-semibold">
                    Dia {Math.min(day, group.days)} de {group.days}
                  </span>
                  <span className="text-[14px] text-ink/55">{Math.max(0, group.days - day)} dias restantes</span>
                </div>
                <div className="mt-3 h-3 overflow-hidden rounded-full bg-white" role="progressbar" aria-valuemin={0} aria-valuemax={group.days} aria-valuenow={day} aria-label="Andamento do desafio">
                  <motion.div className="h-full min-w-3 rounded-full bg-rat" initial={{ width: 0 }} animate={{ width: `${progress * 100}%` }} transition={{ duration: 0.6, ease: [0.42, 0, 0.58, 1], delay: 0.3 }} />
                </div>
                <div className="mt-2 flex justify-between text-[13px] text-ink/55">
                  <span>
                    <b className="font-semibold text-ink/80">Começou</b> {shortDate(group.createdAt)}
                  </span>
                  <span>
                    <b className="font-semibold text-ink/80">Termina</b> {shortDate(end!)}
                  </span>
                </div>
              </>
            ) : (
              <p className="text-[15px]">
                <b className="font-semibold">Clube desde {shortDate(group.createdAt)}.</b> <span className="text-ink/60">Sem data para acabar.</span>
              </p>
            )}
            <div className="mt-4 flex gap-2">
              <motion.button type="button" onClick={copyCode} className="flex h-10 flex-1 items-center justify-center gap-2 rounded-[14px] bg-white text-[15px] font-semibold tracking-[0.12em]" whileTap={PRESS} aria-label={`Copiar código ${group.code}`}>
                {copied ? <CheckIcon className="size-4 text-check" /> : <CopyIcon className="size-4 text-ink/50" />}
                {copied ? <span className="tracking-normal">Copiado!</span> : group.code}
              </motion.button>
              <motion.button type="button" onClick={onInvite} className="flex h-10 items-center gap-2 rounded-[14px] bg-rat px-4 text-[15px] font-semibold text-on-rat" whileTap={PRESS}>
                <SendIcon className="size-4" />
                Convidar
              </motion.button>
            </div>
          </motion.div>

          <h2 className="mt-6 px-1 text-[20px] font-semibold">Classificação</h2>
          <div className="mt-2 rounded-[22px] border border-ink/10">
            <motion.div className="flex items-center gap-3 px-4 py-3" {...settle(0, 0.2)}>
              <span className="flex size-11 items-center justify-center rounded-full bg-rat text-[15px] font-semibold text-on-rat">{initials(me) || "EU"}</span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[16px] font-semibold">{me || "Você"}</span>
                <span className="block text-[14px] text-ink/55">{pointsLabel(group)}</span>
              </span>
              <span className="text-[24px] font-semibold text-rat-title">1º</span>
            </motion.div>
            <motion.button type="button" onClick={onInvite} className="flex w-full items-center gap-3 border-t border-ink/8 px-4 py-3 text-left" whileTap={PRESS} {...settle(1, 0.2)}>
              <span className="flex size-11 items-center justify-center rounded-full border-2 border-dashed border-ink/20 text-ink/40">
                <PlusIcon className="size-5" />
              </span>
              <span className="flex-1 text-[15px] text-ink/55">Ranking de um é fácil. Chame alguém para disputar.</span>
            </motion.button>
          </div>

          <h2 className="mt-6 px-1 text-[20px] font-semibold">Estatísticas do grupo</h2>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <Stat index={0} kind="yellow" value={group.checkins.length} label="Check-ins totais" />
            <Stat index={1} kind="blue" value={activeDays(group)} label="Dias ativos" />
            <Stat index={2} kind="green" value={avg.toFixed(1).replace(".", ",")} label="Média de check-ins por dia" />
            <Stat index={3} kind="red" value={1} label="Membro" />
          </div>
        </div>
      </div>

      <div className="shrink-0 border-t border-ink/6 bg-white px-4 pt-3 pb-[max(12px,env(safe-area-inset-bottom))]">
        <PrimaryButton onClick={checkIn}>
          <DumbbellIcon className="size-5" />
          {checkedInToday(group) ? "Fazer outro check-in" : "Fazer check-in de hoje"}
        </PrimaryButton>
      </div>
    </div>
  )
}
