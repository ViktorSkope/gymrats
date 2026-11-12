import { ChevronRightIcon, RotateCcwIcon } from "lucide-react"
import { AnimatePresence, motion } from "motion/react"
import { useCallback, useEffect, useState } from "react"

import { LogoMark } from "@/components/Logo"
import { CreateGroup } from "@/components/groups/CreateGroup"
import { GroupCover } from "@/components/groups/GroupCover"
import { GroupDetail } from "@/components/groups/GroupDetail"
import { GroupInvite } from "@/components/groups/GroupInvite"
import { dayNumber, pointsLabel, streak, typeLabel, type Group } from "@/components/groups/groups"
import { RestingRat } from "@/components/rats/RestingRat"
import { PLAIN } from "@/components/rats/paths"
import { useStored } from "@/hooks/useStored"
import { PRESS, SHARED, close, open, popover, settle, sheet } from "@/motion"
import { themeStyle, type RatKind } from "@/theme"
import { JoinGroupSheet } from "./JoinGroupSheet"

type View = { screen: "create" } | { screen: "invite"; id: string } | { screen: "group"; id: string; fromList?: boolean } | null

/** Your rat's face in a ring: the profile button. */
function Avatar() {
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

/** Profile popover: grows out of the avatar and shrinks back into it. */
function ProfileMenu({ name, onRestart }: { name: string; onRestart: () => void }) {
  const [isOpen, setOpen] = useState(false)
  return (
    <div className="relative">
      <motion.button
        type="button"
        aria-label={name ? `Perfil de ${name}` : "Perfil"}
        aria-expanded={isOpen}
        onClick={() => setOpen((o) => !o)}
        className="block size-[38px] overflow-hidden rounded-full ring-[2.5px] ring-rat"
        whileTap={PRESS}
      >
        <Avatar />
      </motion.button>
      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} aria-hidden="true" />
            <motion.div role="menu" className="absolute top-[calc(100%+8px)] right-0 z-20 w-[220px] origin-top-right rounded-2xl bg-white p-1.5 shadow-xl shadow-black/15" {...popover}>
              <p className="px-3 pt-2 pb-1.5 text-[15px] font-semibold">{name || "Você"}</p>
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setOpen(false)
                  onRestart()
                }}
                className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-[15px] hover:bg-ink/4"
              >
                <RotateCcwIcon className="size-4 text-ink/60" />
                Refazer o onboarding
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

function headline(total: number, current: number) {
  if (!total) return "Você está só começando!"
  if (current >= 3) return "Ninguém te segura!"
  return "Bom treino, continue assim!"
}

/** Your groups as rows on the red card. Covers grow into the group's page when opened. */
function GroupRows({ groups, onOpen }: { groups: Group[]; onOpen: (id: string) => void }) {
  return (
    <ul className="mt-4 flex flex-col gap-2">
      {groups.map((group, index) => (
        <motion.li key={group.id} {...settle(index, 0.1)}>
          <motion.button type="button" onClick={() => onOpen(group.id)} className="flex w-full items-center gap-3 rounded-[20px] bg-white/12 p-2 pr-3 text-left" whileTap={PRESS}>
            <GroupCover cover={group.cover} layoutId={SHARED.cover(group.id)} className="size-14 shrink-0 rounded-[14px] ring-1 ring-white/20" />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[16px] font-semibold">{group.name}</span>
              <span className="block truncate text-[13px] opacity-80">
                {typeLabel(group)}
                {group.days ? ` · Dia ${Math.min(dayNumber(group), group.days)} de ${group.days}` : ""} · 1º, {pointsLabel(group)}
              </span>
            </span>
            <ChevronRightIcon className="size-5 shrink-0 opacity-60" />
          </motion.button>
        </motion.li>
      ))}
    </ul>
  )
}

/**
 * Home: a light overview card (where you stand, your streak) over the dark app,
 * and a red card with your groups. Creating, inviting and a group's page open on top.
 */
export function Dashboard({ kind, name, onRestart }: { kind: RatKind; name: string; onRestart: () => void }) {
  const [joining, setJoining] = useState(false)
  const [groups, setGroups] = useStored<Group[]>("groups", [])
  const [view, setView] = useState<View>(null)
  const closeJoin = useCallback(() => setJoining(false), [])
  const current = view && view.screen !== "create" ? groups.find((g) => g.id === view.id) : undefined
  const checkins = groups.reduce((sum, g) => sum + g.checkins.length, 0)
  const days = streak(groups)

  useEffect(() => {
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", "#1D1D1D")
  }, [])

  const update = (group: Group) => setGroups((all) => all.map((g) => (g.id === group.id ? group : g)))
  const startCreate = () => {
    setJoining(false)
    setView({ screen: "create" })
  }

  return (
    <motion.div className="theme-fade absolute inset-0 bg-ink" style={themeStyle(kind)} initial={{ opacity: 0 }} animate={{ opacity: 1, transition: open() }} exit={{ opacity: 0, transition: close }}>
      <div inert={joining || view !== null} className="flex h-full flex-col gap-2 overflow-y-auto px-[7px] pt-[max(6px,env(safe-area-inset-top))] pb-[max(7px,env(safe-area-inset-bottom))]">
        <motion.section
          className="flex min-h-[clamp(300px,52dvh,440px)] shrink-0 flex-col rounded-[30px] bg-paper px-5 pt-5 pb-4"
          initial={{ y: -24, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
          <header className="flex items-start justify-between">
            <LogoMark className="w-[28px] text-rat" />
            <ProfileMenu name={name} onRestart={onRestart} />
          </header>
          <div className="mt-auto">
            <motion.p className="text-[15px] font-semibold" {...settle(0, 0.15)}>
              Visão Geral
            </motion.p>
            <motion.h1 className="mt-3 text-[clamp(36px,11.5vw,46px)] leading-[1.02] tracking-[-0.035em] text-balance" {...settle(1, 0.15)}>
              {headline(checkins, days.current)}
            </motion.h1>
            <motion.p className="mt-4 inline-flex h-[34px] items-center rounded-full bg-[#E6E4E7] px-4 text-[16px] tabular-nums" {...settle(2, 0.15)}>
              Dias seguidos: {days.current}/{days.best}
            </motion.p>
          </div>
        </motion.section>

        <motion.section
          className="relative shrink-0 overflow-hidden rounded-[30px] bg-rat p-5 text-white"
          initial={{ y: 24, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 30, delay: 0.08 }}
        >
          <h2 className="text-[15px] font-semibold">Grupos</h2>
          {groups.length ? (
            <GroupRows groups={groups} onOpen={(id) => setView({ screen: "group", id, fromList: true })} />
          ) : (
            <>
              {/* Nothing to compete in yet, so the rat sleeps. */}
              <RestingRat fur="#B42F23" shade="#7E1D14" className="pointer-events-auto absolute top-3 right-4 w-[clamp(84px,24vw,104px)]" />
              <p className="mt-3 max-w-[64%] text-[17px] leading-snug">Você ainda não tem grupos. Crie um ou entre em um grupo.</p>
            </>
          )}
          <motion.button
            type="button"
            onClick={() => setJoining(true)}
            className="relative mt-5 h-12 w-full rounded-[20px] bg-paper text-[17px] text-ink outline-none focus-visible:ring-3 focus-visible:ring-white/60"
            whileTap={PRESS}
          >
            Novo grupo
          </motion.button>
        </motion.section>
      </div>

      <JoinGroupSheet open={joining} onClose={closeJoin} onCreate={startCreate} />

      <AnimatePresence>
        {view?.screen === "create" && (
          <motion.div key="create" className="absolute inset-0 z-20" {...sheet}>
            <CreateGroup
              onClose={() => setView(null)}
              onCreate={(group) => {
                setGroups((all) => [group, ...all])
                setView({ screen: "invite", id: group.id })
              }}
            />
          </motion.div>
        )}
        {view?.screen === "invite" && current && (
          <motion.div key={`invite-${current.id}`} className="absolute inset-0 z-20" {...sheet}>
            <GroupInvite group={current} me={name} onChange={update} onDone={() => setView({ screen: "group", id: current.id })} />
          </motion.div>
        )}
        {view?.screen === "group" && current && (
          <motion.div key={`group-${current.id}`} className="absolute inset-0 z-10" initial={{ opacity: 0 }} animate={{ opacity: 1, transition: open() }} exit={{ opacity: 0, transition: close }}>
            <GroupDetail group={current} morph={view.fromList} me={name} onBack={() => setView(null)} onInvite={() => setView({ screen: "invite", id: current.id })} onChange={update} />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
