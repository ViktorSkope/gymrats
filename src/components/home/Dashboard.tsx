import { ChevronRightIcon } from "lucide-react"
import { AnimatePresence, motion } from "motion/react"
import { useCallback, useEffect, useState } from "react"

import { CreateGroup } from "@/components/groups/CreateGroup"
import { GroupCover } from "@/components/groups/GroupCover"
import { GroupDetail } from "@/components/groups/GroupDetail"
import { GroupInvite } from "@/components/groups/GroupInvite"
import { dayNumber, friendsToday, pointsLabel, streak, typeLabel, type Group } from "@/components/groups/groups"
import { RestingRat } from "@/components/rats/RestingRat"
import { useStored } from "@/hooks/useStored"
import { PRESS, SHARED, close, open, settle, sheet } from "@/motion"
import { themeStyle, type RatKind } from "@/theme"
import { CheckinCalendar } from "./CheckinCalendar"
import { BottomNav, type Tab } from "./BottomNav"
import { FriendsStrip, GroupCarousel } from "./HomeGroups"
import { JoinGroupSheet } from "./JoinGroupSheet"
import { CheckinView, ProfileView } from "./TabViews"

type View = { screen: "create" } | { screen: "invite"; id: string } | { screen: "group"; id: string; fromList?: boolean } | null

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
 * The main app: a tab's cards over the dark background and the bottom nav.
 * Início shows the overview (calendar, streak) and your groups; Grupos, Check-in
 * and Perfil each get their own view. Creating, inviting and a group's page open on top.
 */
export function Dashboard({ kind, name, onRestart }: { kind: RatKind; name: string; onRestart: () => void }) {
  const [tab, setTab] = useState<Tab>("home")
  const [joining, setJoining] = useState(false)
  const [plan] = useStored<string | null>("plan", null)
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

  const groupsCard = (
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
  )

  return (
    <motion.div className="theme-fade absolute inset-0 bg-ink" style={themeStyle(kind)} initial={{ opacity: 0 }} animate={{ opacity: 1, transition: open() }} exit={{ opacity: 0, transition: close }}>
      <div inert={joining || view !== null} className="flex h-full flex-col">
        <div className="min-h-0 flex-1 overflow-y-auto px-[7px] pt-[max(6px,env(safe-area-inset-top))] pb-2">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div key={tab} className={`flex flex-col gap-2 ${tab === "home" ? "h-full min-h-[560px]" : ""}`} initial={{ opacity: 0 }} animate={{ opacity: 1, transition: open() }} exit={{ opacity: 0, transition: close }}>
              {tab === "home" && (
              <>
                {/* Sized to fit one screen: the calendar and headline scale with the height, the groups take the rest. */}
                <motion.section
                  className="shrink-0 rounded-[30px] bg-paper px-5 pt-[clamp(16px,2.6dvh,24px)] pb-[clamp(14px,2.2dvh,20px)]"
                  initial={{ y: -24, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                >
                  <motion.div {...settle(0, 0.1)}>
                    <CheckinCalendar checkins={groups.flatMap((g) => g.checkins)} />
                  </motion.div>
                  <motion.p className="mt-[clamp(14px,3dvh,32px)] text-[15px] font-semibold" {...settle(0, 0.15)}>
                    Visão Geral
                  </motion.p>
                  <motion.h1 className="mt-2 text-[clamp(30px,4.8dvh,46px)] leading-[1.02] tracking-[-0.035em] text-balance" {...settle(1, 0.15)}>
                    {headline(checkins, days.current)}
                  </motion.h1>
                  <motion.p className="mt-[clamp(10px,1.8dvh,16px)] inline-flex h-[34px] items-center rounded-full bg-[#E6E4E7] px-4 text-[16px] tabular-nums" {...settle(2, 0.15)}>
                    Dias seguidos: {days.current}/{days.best}
                  </motion.p>
                </motion.section>
                <FriendsStrip names={friendsToday(groups)} />
                <GroupCarousel groups={groups} me={name} onOpen={(id) => setView({ screen: "group", id })} onNewGroup={() => setJoining(true)} />
              </>
            )}
            {tab === "groups" && groupsCard}
              {tab === "checkin" && <CheckinView groups={groups} onCheckIn={(group) => update({ ...group, checkins: [...group.checkins, Date.now()] })} onNewGroup={() => setJoining(true)} />}
              {tab === "profile" && <ProfileView name={name} plan={plan} groups={groups} onReset={onRestart} />}
            </motion.div>
          </AnimatePresence>
        </div>
        <BottomNav active={tab} onChange={setTab} />
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
