import { ArrowUpRightIcon, PlusIcon } from "lucide-react"
import { animate, motion, useMotionValue } from "motion/react"
import { useEffect, useLayoutEffect, useRef, useState } from "react"

import { UNIT_SHORT, ranking, type Group, type Standing } from "@/components/groups/groups"
import { RestingRat } from "@/components/rats/RestingRat"
import { haptic } from "@/hooks/useHaptic"
import { useStored } from "@/hooks/useStored"
import { EASE_IN_OUT, PRESS, settle } from "@/motion"
import { Avatar } from "./TabViews"

const GAP = 8

/** A friend's face: the rat avatar in a gold ring. */
function Face({ className = "size-9" }: { className?: string }) {
  return (
    <span className={`block shrink-0 overflow-hidden rounded-full ring-2 ring-[#F2B640] ${className}`}>
      <Avatar />
    </span>
  )
}

/** "3 amigos fizeram check-in hoje", with their faces stacked on the right. */
export function FriendsStrip({ names }: { names: string[] }) {
  if (!names.length) return null
  const text = names.length === 1 ? `${names[0]} fez check-in hoje` : `${names.length} amigos fizeram check-in hoje`
  return (
    <motion.div className="flex h-[52px] shrink-0 items-center justify-between rounded-[30px] bg-[#FFF3D6] pr-2.5 pl-5" {...settle(1, 0.1)}>
      <p className="truncate text-[16px]">{text}</p>
      <div className="flex shrink-0 -space-x-3" aria-hidden="true">
        {names.slice(0, 3).map((name, i) => (
          <motion.span key={name} initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 500, damping: 22, delay: 0.25 + i * 0.06 }}>
            <Face className="size-[34px]" />
          </motion.span>
        ))}
      </div>
    </motion.div>
  )
}

/** The few places around you, with your own row pinned on top of the stack. */
function Window({ standings, unit }: { standings: Standing[]; unit: string }) {
  const mine = standings.findIndex((s) => s.me)
  // Your row always shows. With people ahead of you, it sits at the bottom under the
  // closest of them (rows further up are cut first). In first place it sits on top,
  // over the people chasing you (rows further down are cut first).
  const leading = mine === 0
  const rows = leading ? standings.slice(0, 4) : standings.slice(Math.max(0, mine - 3), mine + 1)
  return (
    <ol className={`flex min-h-0 flex-1 flex-col gap-1.5 overflow-hidden ${leading ? "justify-start" : "justify-end"}`}>
      {rows.map((s, i) => (
        <motion.li
          key={s.id}
          className={`relative flex h-[52px] shrink-0 items-center gap-3 rounded-[22px] pr-4 pl-3 ${s.me ? `z-10 bg-paper text-ink ${leading ? "shadow-[0_6px_20px_rgb(0_0_0/0.18)]" : "shadow-[0_-6px_20px_rgb(0_0_0/0.18)]"}` : "bg-black/18"} ${s.me && i > 0 ? "-mt-4" : ""} ${s.me && leading && rows.length > 1 ? "-mb-4" : ""}`}
          {...settle(i, 0.15)}
        >
          <Face className="size-9" />
          <span className="min-w-0 flex-1 leading-tight">
            <span className={`block text-[14px] ${s.me ? "text-ink/55" : "opacity-80"}`}>{s.rank}º lugar</span>
            <span className="block truncate text-[16px] font-medium">{s.me ? "Você" : s.name}</span>
          </span>
          <span className="shrink-0 text-right leading-none">
            <span className="text-[24px] font-medium tabular-nums">{s.points}</span>
            <span className={`ml-1 text-[12px] ${s.me ? "text-ink/50" : "opacity-70"}`}>{unit}</span>
          </span>
        </motion.li>
      ))}
    </ol>
  )
}

function Dots({ count, active }: { count: number; active: number }) {
  if (count < 2) return null
  return (
    <span className="flex gap-1" aria-hidden="true">
      {Array.from({ length: count }, (_, i) => (
        <span key={i} className={`h-1.5 rounded-full bg-white transition-all duration-200 ${i === active ? "w-4" : "w-1.5 opacity-40"}`} />
      ))}
    </span>
  )
}

function GroupSlide({ group, me, index, count, onOpen }: { group: Group; me: string; index: number; count: number; onOpen: () => void }) {
  const standings = ranking(group, me)
  const mine = standings.find((s) => s.me)!
  const alone = standings.length === 1
  return (
    <div className="flex h-full flex-col rounded-[30px] bg-rat p-5 text-white">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2.5">
            <p className="truncate text-[15px] font-semibold">{group.name}</p>
            <Dots count={count} active={index} />
          </div>
          <p className="mt-1 text-[clamp(24px,7.6vw,30px)] leading-tight tracking-[-0.02em]">{alone ? "Só você por enquanto" : `Você está em ${mine.rank}º lugar`}</p>
        </div>
        <motion.button type="button" aria-label={`Abrir ${group.name}`} onClick={onOpen} className="-mt-1 -mr-1 flex size-11 shrink-0 items-center justify-center rounded-full" whileTap={PRESS}>
          <ArrowUpRightIcon className="size-8" strokeWidth={2.2} />
        </motion.button>
      </div>
      <div className="mt-4 flex min-h-0 flex-1 flex-col">
        {alone ? (
          <>
            <Window standings={standings} unit={UNIT_SHORT[group.scoring]} />
            <motion.button type="button" onClick={onOpen} className="mt-1.5 flex h-[52px] shrink-0 items-center gap-3 rounded-[22px] border-2 border-dashed border-white/35 px-3 text-left text-[15px]" whileTap={PRESS}>
              <span className="flex size-9 items-center justify-center rounded-full bg-white/15">
                <PlusIcon className="size-5" />
              </span>
              Chame alguém para disputar
            </motion.button>
          </>
        ) : (
          <Window standings={standings} unit={UNIT_SHORT[group.scoring]} />
        )}
      </div>
    </div>
  )
}

/** Last slide: a sleeping rat and the way to another group. */
function NewGroupSlide({ hasGroups, onNewGroup }: { hasGroups: boolean; onNewGroup: () => void }) {
  return (
    <div className="relative flex h-full flex-col justify-between overflow-hidden rounded-[30px] bg-rat p-5 text-white">
      <RestingRat fur="#B42F23" shade="#7E1D14" className="absolute top-3 right-4 w-[clamp(84px,24vw,104px)]" />
      <div>
        <p className="text-[15px] font-semibold">Grupos</p>
        <p className="mt-3 max-w-[64%] text-[17px] leading-snug">{hasGroups ? "Mais um grupo, mais motivo para treinar." : "Você ainda não tem grupos. Crie um ou entre em um grupo."}</p>
      </div>
      <motion.button type="button" onClick={onNewGroup} className="relative mt-5 h-12 w-full shrink-0 rounded-[20px] bg-paper text-[17px] text-ink" whileTap={PRESS}>
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

  // Peekaboo: nudge toward a neighbour and spring back, once per landing.
  useEffect(() => {
    if (!width || count < 2) return
    const toward = index < count - 1 ? -1 : 1
    const base = -index * step
    const timer = window.setTimeout(() => {
      animate(x, [base, base + toward * 56, base], { duration: 0.9, times: [0, 0.4, 1], ease: [EASE_IN_OUT, [0.34, 1.56, 0.64, 1]] })
    }, 650)
    return () => clearTimeout(timer)
  }, [width > 0]) // eslint-disable-line react-hooks/exhaustive-deps

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
            <GroupSlide group={group} me={me} index={i} count={count} onOpen={() => onOpen(group.id)} />
          </div>
        ))}
        <div className="h-full shrink-0" style={{ width }} aria-hidden={index !== count - 1}>
          <NewGroupSlide hasGroups={groups.length > 0} onNewGroup={onNewGroup} />
        </div>
      </motion.div>
    </div>
  )
}
