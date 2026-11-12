import { ArrowLeftIcon, CheckIcon, CopyIcon, DumbbellIcon, PlusIcon, SendIcon } from "lucide-react"
import { AnimatePresence, motion } from "motion/react"
import { useState } from "react"

import { PrimaryButton } from "@/components/onboarding/SheetScreen"
import { haptic } from "@/hooks/useHaptic"
import { PRESS, SHARED, settle } from "@/motion"
import { THEMES, themeStyle, type RatKind } from "@/theme"
import { UNIT_SHORT, activeDays, checkedInToday, copyText, dayNumber, endsAt, liveInstants, ranking, shortDate, typeLabel, type Group } from "./groups"
import { GroupCover } from "./GroupCover"
import { RankRow } from "./RankRow"
import { InstantStack } from "@/components/checkin/InstantStack"
import { Card, CardLabel, FLOAT_SPACE, FloatingAction, RoundButton } from "@/components/ui/kit"

function Stat({ value, label, kind, index }: { value: string | number; label: string; kind: RatKind; index: number }) {
  return (
    <motion.div className="flex min-h-[104px] flex-col justify-between rounded-[24px] p-4" style={{ backgroundColor: THEMES[kind].rat, color: THEMES[kind].onRat }} {...settle(index, 0.2)}>
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span key={value} className="text-[32px] leading-none font-semibold tabular-nums" initial={{ y: 12, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -12, opacity: 0, transition: { duration: 0.16 } }} transition={{ duration: 0.2 }}>
          {value}
        </motion.span>
      </AnimatePresence>
      <span className="text-[14px] leading-tight font-medium opacity-85">{label}</span>
    </motion.div>
  )
}

/**
 * One group, in the home screen's language: rounded cards on the dark app. The
 * cover, then where you stand (in the group's colour), the full ranking, stats,
 * the invite code, and a check-in button that stays in reach.
 */
export function GroupDetail({ group, morph = false, me, onBack, onInvite, onChange, onCheckIn }: { group: Group; /** Grow the cover out of its card in the list. */ morph?: boolean; me: string; onBack: () => void; onInvite: () => void; onChange: (group: Group) => void; /** Opens the camera for a check-in instant. */ onCheckIn: () => void }) {
  const [copied, setCopied] = useState(false)
  const end = endsAt(group)
  const day = dayNumber(group)
  const progress = group.days ? Math.min(1, day / group.days) : 0
  const avg = group.checkins.length / Math.max(1, day)
  const standings = ranking(group, me)
  const mine = standings.find((s) => s.me)!
  const unit = UNIT_SHORT[group.scoring]

  const copyCode = async () => {
    await copyText(group.code)
    haptic(10)
    setCopied(true)
    setTimeout(() => setCopied(false), 1600)
  }

  const instants = liveInstants(group)

  const checkIn = () => {
    haptic(15)
    onCheckIn()
  }

  return (
    <div className="theme-fade relative flex h-full flex-col bg-ink" style={themeStyle(group.cover.kind)}>
      {/* The end of the page leaves room for the floating check-in, so it never covers anything. */}
      <div className={`flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto px-[7px] pt-[max(6px,var(--sat))] ${FLOAT_SPACE}`}>
        <GroupCover cover={group.cover} layoutId={morph ? SHARED.cover(group.id) : undefined} className="h-[200px] shrink-0 rounded-[30px]">
          <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-black/10" />
          <RoundButton label="Voltar" onClick={onBack} className="absolute top-3 left-3">
            <ArrowLeftIcon className="size-5" />
          </RoundButton>
          <div className="absolute inset-x-5 bottom-5 text-white">
            <span className="inline-block rounded-full bg-white/25 px-2.5 py-1 text-[12px] font-semibold tracking-wide uppercase backdrop-blur-sm">{typeLabel(group)}</span>
            <h1 className="mt-2 text-[34px] leading-none tracking-[-0.02em] [text-shadow:0_1px_12px_rgb(0_0_0/0.25)]">{group.name}</h1>
          </div>
        </GroupCover>

        {/* Where you stand, in the group's colour like its card on the home screen. */}
        <motion.section className="shrink-0 rounded-[30px] bg-rat p-5 text-on-rat" {...settle(0, 0.1)}>
          <p className="text-[15px] font-semibold">{group.description || (standings.length > 1 ? `${standings.length} pessoas na disputa` : "Só você por enquanto")}</p>
          <p className="mt-1 text-[clamp(26px,8vw,32px)] leading-tight tracking-[-0.02em]">{standings.length > 1 ? `Você está em ${mine.rank}º lugar` : "Ranking de um é fácil"}</p>
          {group.days ? (
            <div className="mt-5">
              <div className="flex items-baseline justify-between text-[15px]">
                <span className="font-semibold">
                  Dia {Math.min(day, group.days)} de {group.days}
                </span>
                <span className="opacity-75">{Math.max(0, group.days - day)} dias restantes</span>
              </div>
              <div className="mt-2.5 h-2.5 overflow-hidden rounded-full bg-black/18" role="progressbar" aria-valuemin={0} aria-valuemax={group.days} aria-valuenow={day} aria-label="Andamento do desafio">
                <motion.div className="h-full min-w-2.5 rounded-full bg-paper" initial={{ width: 0 }} animate={{ width: `${progress * 100}%` }} transition={{ duration: 0.6, ease: [0.42, 0, 0.58, 1], delay: 0.3 }} />
              </div>
              <div className="mt-2 flex justify-between text-[13px] opacity-75">
                <span>Começou {shortDate(group.createdAt)}</span>
                <span>Termina {shortDate(end!)}</span>
              </div>
            </div>
          ) : (
            <p className="mt-3 text-[15px] opacity-80">Clube desde {shortDate(group.createdAt)}, sem data para acabar.</p>
          )}
        </motion.section>

        {/* Today's instants as a pile: swipe to vote, hold to sticker. */}
        <section className="shrink-0" aria-label="Check-ins de hoje">
          <p className="px-3 pt-2 pb-2 text-[15px] font-semibold text-white">Check-ins de hoje</p>
          <InstantStack posts={instants} group={group} me={me} onChange={(next) => onChange({ ...group, posts: (group.posts ?? []).map((p) => (p.id === next.id ? next : p)) })} />
        </section>

        <Card index={1}>
          <CardLabel>Classificação</CardLabel>
          <ol className="mt-3 flex flex-col gap-1.5">
            {standings.map((s, i) => (
              <RankRow key={s.id} standing={s} unit={unit} tone="paper" index={i} />
            ))}
          </ol>
          <motion.button type="button" onClick={onInvite} className="mt-1.5 flex h-[52px] w-full items-center gap-3 rounded-[22px] border-2 border-dashed border-ink/15 px-3 text-left text-[15px] text-ink/60" whileTap={PRESS}>
            <span className="flex size-9 items-center justify-center rounded-full bg-[#EDEBEE]">
              <PlusIcon className="size-5" />
            </span>
            {group.members?.length ? "Convide mais gente para a disputa" : "Chame alguém para disputar"}
          </motion.button>
        </Card>

        <div className="grid shrink-0 grid-cols-2 gap-2">
          <Stat index={0} kind="yellow" value={group.checkins.length} label="Seus check-ins" />
          <Stat index={1} kind="blue" value={activeDays(group)} label="Seus dias ativos" />
          <Stat index={2} kind="green" value={avg.toFixed(1).replace(".", ",")} label="Sua média por dia" />
          <Stat index={3} kind="red" value={standings.length} label={standings.length === 1 ? "Membro" : "Membros"} />
        </div>

        <Card index={2}>
          <CardLabel>Código do grupo</CardLabel>
          <div className="mt-3 flex gap-2">
            <motion.button type="button" onClick={copyCode} className="flex h-12 flex-1 items-center justify-center gap-2 rounded-[20px] bg-[#EDEBEE] text-[16px] font-semibold tracking-[0.12em]" whileTap={PRESS} aria-label={`Copiar código ${group.code}`}>
              {copied ? <CheckIcon className="size-4 text-check" /> : <CopyIcon className="size-4 text-ink/50" />}
              {copied ? <span className="tracking-normal">Copiado!</span> : group.code}
            </motion.button>
            <motion.button type="button" onClick={onInvite} className="flex h-12 items-center gap-2 rounded-[20px] bg-rat px-5 text-[16px] font-medium text-on-rat" whileTap={PRESS}>
              <SendIcon className="size-4" />
              Convidar
            </motion.button>
          </div>
        </Card>
      </div>

      <FloatingAction>
        <PrimaryButton onClick={checkIn} className="h-14 shadow-[0_12px_32px_rgb(0_0_0/0.45)]">
          <DumbbellIcon className="size-5" />
          {checkedInToday(group) ? "Fazer outro check-in" : "Fazer check-in de hoje"}
        </PrimaryButton>
      </FloatingAction>
    </div>
  )
}
