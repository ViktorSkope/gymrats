import { ArrowUpRightIcon, PlusIcon } from "lucide-react"
import { animate, motion, useMotionValue } from "motion/react"
import { useEffect, useLayoutEffect, useRef, useState } from "react"

import { PersonAvatar } from "@/components/Avatar"
import { UNIT_SHORT, ranking, type Group } from "@/components/groups/groups"
import { MuscleRat } from "@/components/rats/MuscleRat"
import { SleepyRat } from "@/components/rats/SleepyRat"
import { haptic } from "@/hooks/useHaptic"
import { useStored } from "@/hooks/useStored"
import { EASE_IN_OUT, PRESS, settle } from "@/motion"
import { themeStyle } from "@/theme"
import { RankingReel } from "./RankingReel"

const GAP = 8

/** "3 amigos fizeram check-in hoje", with their faces stacked on the right. */
export function FriendsStrip({ people }: { people: { name: string; photo?: string }[] }) {
  if (!people.length) return null
  const text = people.length === 1 ? `${people[0].name} fez check-in hoje` : `${people.length} amigos fizeram check-in hoje`
  return (
    <motion.div className="flex h-[44px] shrink-0 items-center justify-between rounded-[30px] bg-[#FFF3D6] pr-2 pl-5" {...settle(1, 0.1)}>
      <p className="truncate text-[15px]">{text}</p>
      <div className="flex shrink-0 -space-x-3" aria-hidden="true">
        {people.slice(0, 3).map((person, i) => (
          <motion.span key={person.name} initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 500, damping: 22, delay: 0.25 + i * 0.06 }}>
            <PersonAvatar name={person.name} photo={person.photo} className="size-[30px]" />
          </motion.span>
        ))}
      </div>
    </motion.div>
  )
}

function Dots({ count, active }: { count: number; active: number }) {
  if (count < 2) return null
  return (
    <span className="flex gap-1" aria-hidden="true">
      {Array.from({ length: count }, (_, i) => (
        <span key={i} className={`h-1.5 rounded-full bg-current transition-all duration-200 ${i === active ? "w-4" : "w-1.5 opacity-40"}`} />
      ))}
    </span>
  )
}

function GroupSlide({ group, me, index, count, onOpen, onReelDone }: { group: Group; me: string; index: number; count: number; onOpen: () => void; onReelDone?: () => void }) {
  const standings = ranking(group, me)
  const mine = standings.find((s) => s.me)!
  const alone = standings.length === 1
  return (
    <div className="flex h-full flex-col rounded-[30px] bg-rat px-4 pt-4 pb-3 text-on-rat" style={themeStyle(group.cover.kind)}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2.5">
            <p className="truncate text-[14px] font-semibold">{group.name}</p>
            <Dots count={count} active={index} />
          </div>
          <p className="mt-1 truncate text-[clamp(20px,6vw,26px)] leading-tight tracking-[-0.02em]">{alone ? "Só você por enquanto" : `Você está em ${mine.rank}º lugar`}</p>
        </div>
        <motion.button type="button" aria-label={`Abrir ${group.name}`} onClick={onOpen} className="-mt-1 -mr-1 flex size-11 shrink-0 items-center justify-center rounded-full" whileTap={PRESS}>
          <ArrowUpRightIcon className="size-7" strokeWidth={2.2} />
        </motion.button>
      </div>
      <div className="mt-3 flex min-h-0 flex-1 flex-col">
        {alone ? (
          <>
            <RankingReel standings={standings} unit={UNIT_SHORT[group.scoring]} onDone={onReelDone} />
            <motion.button type="button" onClick={onOpen} className="mt-1.5 flex h-[52px] shrink-0 items-center gap-3 rounded-[22px] border-2 border-dashed border-current/35 px-3 text-left text-[15px]" whileTap={PRESS}>
              <span className="flex size-9 items-center justify-center rounded-full bg-current/15">
                <PlusIcon className="size-5" />
              </span>
              Chame alguém para disputar
            </motion.button>
          </>
        ) : (
          <RankingReel standings={standings} unit={UNIT_SHORT[group.scoring]} onDone={onReelDone} />
        )}
      </div>
    </div>
  )
}

/**
 * Last slide, the way to another group. With no groups yet it's red with the rat
 * asleep (nothing to compete in); once you have groups it's black with the rat flexing.
 */
function NewGroupSlide({ hasGroups, onNewGroup }: { hasGroups: boolean; onNewGroup: () => void }) {
  return (
    <div className={`relative flex h-full flex-col justify-between overflow-hidden rounded-[30px] p-5 text-white ${hasGroups ? "bg-black" : "bg-rat"}`}>
      {hasGroups ? (
        <MuscleRat className="absolute top-4 right-3 h-[calc(100%-96px)] max-h-[215px] w-auto" />
      ) : (
        <SleepyRat className="absolute top-3 right-3 h-[calc(100%-90px)] max-h-[200px] w-auto" />
      )}
      <div className="relative">
        <p className="text-[15px] font-semibold">Grupos</p>
        <p className="mt-3 max-w-[56%] text-[17px] leading-snug">{hasGroups ? "Mais um grupo, mais motivo para treinar." : "Você ainda não tem grupos. Crie um ou entre em um grupo."}</p>
      </div>
      <motion.button type="button" onClick={onNewGroup} className={`relative mt-5 h-12 w-full shrink-0 rounded-[20px] text-[17px] text-ink ${hasGroups ? "bg-white" : "bg-paper"}`} whileTap={PRESS}>
        Novo grupo
      </motion.button>
    </div>
  )
}

/**
 * Your groups side by side: swipe to pick the one that stays on your home screen
 * (remembered). Landing here gives a little peek at the neighbouring card, so you
 * know there are more.
 */
export function GroupCarousel({ groups, me, onOpen, onNewGroup }: { groups: Group[]; me: string; onOpen: (id: string) => void; onNewGroup: () => void }) {
  const ref = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(0)
  const [stored, setStored] = useStored("homeGroup", 0)
  const count = groups.length + 1
  const index = Math.min(stored, count - 1)
  const x = useMotionValue(0)
  const step = width + GAP

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new ResizeObserver(() => setWidth(el.clientWidth))
    observer.observe(el)
    setWidth(el.clientWidth)
    return () => observer.disconnect()
  }, [])

  // Keep the chosen card in place when the width changes.
  useEffect(() => {
    if (width) x.set(-index * step)
  }, [width]) // eslint-disable-line react-hooks/exhaustive-deps

  // Peekaboo: nudge toward a neighbour and spring back, once per landing. It waits
  // until the ranking on the card in view has finished (2s after your row lands),
  // so the two animations never compete. The last card has no ranking to wait for.
  const [reelDone, setReelDone] = useState(false)
  const peeked = useRef(false)
  const waiting = index < count - 1 && !reelDone
  useEffect(() => {
    if (!width || count < 2 || waiting || peeked.current) return
    const toward = index < count - 1 ? -1 : 1
    const base = -index * step
    const timer = window.setTimeout(() => {
      peeked.current = true
      animate(x, [base, base + toward * 56, base], { duration: 0.9, times: [0, 0.4, 1], ease: [EASE_IN_OUT, [0.34, 1.56, 0.64, 1]] })
    }, 2000)
    return () => clearTimeout(timer)
  }, [width > 0, waiting]) // eslint-disable-line react-hooks/exhaustive-deps

  const go = (next: number) => {
    const target = Math.max(0, Math.min(count - 1, next))
    if (target !== index) haptic()
    setStored(target)
    animate(x, -target * step, { type: "spring", stiffness: 380, damping: 38 })
  }

  return (
    <div ref={ref} className="relative min-h-[200px] flex-1 overflow-hidden rounded-[30px]" aria-roledescription="carrossel" aria-label="Seus grupos">
      <motion.div
        className="flex h-full cursor-grab active:cursor-grabbing"
        style={{ x, gap: GAP }}
        drag="x"
        dragDirectionLock
        dragConstraints={{ left: -(count - 1) * step, right: 0 }}
        dragElastic={0.18}
        dragMomentum={false}
        onDragEnd={(_, info) => {
          const swipe = info.offset.x + info.velocity.x * 0.2
          go(swipe < -width / 4 ? index + 1 : swipe > width / 4 ? index - 1 : index)
        }}
      >
        {groups.map((group, i) => (
          <div key={group.id} className="h-full shrink-0" style={{ width }} aria-hidden={i !== index}>
            <GroupSlide group={group} me={me} index={i} count={count} onOpen={() => onOpen(group.id)} onReelDone={i === index ? () => setReelDone(true) : undefined} />
          </div>
        ))}
        <div className="h-full shrink-0" style={{ width }} aria-hidden={index !== count - 1}>
          <NewGroupSlide hasGroups={groups.length > 0} onNewGroup={onNewGroup} />
        </div>
      </motion.div>
    </div>
  )
}
