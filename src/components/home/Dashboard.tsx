import { ChevronRightIcon, KeyRoundIcon, PlusIcon, StarIcon, UserPlusIcon } from "lucide-react"
import { AnimatePresence, motion } from "motion/react"
import { useCallback, useEffect, useState } from "react"

import { CreateGroup } from "@/components/groups/CreateGroup"
import { GroupCover } from "@/components/groups/GroupCover"
import { GroupDetail } from "@/components/groups/GroupDetail"
import { GroupInvite } from "@/components/groups/GroupInvite"
import { dayNumber, initials, points, pointsLabel, typeLabel, type Group } from "@/components/groups/groups"
import { PrimaryButton } from "@/components/onboarding/SheetScreen"
import { RestingRat } from "@/components/rats/RestingRat"
import { useStored } from "@/hooks/useStored"
import { PRESS, SHARED, close, open, settle, sheet } from "@/motion"
import { THEMES, themeStyle, type RatKind } from "@/theme"
import { JoinGroupSheet } from "./JoinGroupSheet"
import { TABS, TabBar, type Tab } from "./TabBar"

type View = { screen: "create" } | { screen: "invite"; id: string } | { screen: "group"; id: string; fromList?: boolean } | null

/** Nothing to rank yet: the rat sleeps until there is a group to compete in. */
function EmptyRankings({ onJoin, onCreate }: { onJoin: () => void; onCreate: () => void }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-8 pb-6 text-center">
      <motion.div {...settle(0, 0.15)}>
        <RestingRat className="w-[clamp(130px,24dvh,190px)]" />
      </motion.div>
      <motion.h2 className="mt-5 text-[22px] leading-tight tracking-[-0.02em]" {...settle(1, 0.15)}>
        Nenhum ranking por aqui
      </motion.h2>
      <motion.p className="mt-2 max-w-[280px] text-[16px] leading-snug text-ink/60" {...settle(2, 0.15)}>
        Seu rato está descansando. Entre em um grupo para começar a pontuar.
      </motion.p>
      <motion.div className="mt-6 flex w-full max-w-[300px] flex-col gap-2" {...settle(3, 0.15)}>
        <PrimaryButton shared onClick={onJoin}>
          Entrar em um grupo
        </PrimaryButton>
        <motion.button type="button" onClick={onCreate} className="h-11 rounded-[20px] text-[16px] font-medium text-ink/70" whileTap={PRESS}>
          ou criar o seu próprio
        </motion.button>
      </motion.div>
    </div>
  )
}

/** Your groups, each with where you stand. Covers grow into the group's page when opened. */
function GroupList({ groups, onOpen, onJoin, onCreate }: { groups: Group[]; onOpen: (id: string) => void; onJoin: () => void; onCreate: () => void }) {
  return (
    <div className="min-h-0 flex-1 overflow-y-auto px-4 pt-4 pb-4">
      <ul className="flex flex-col gap-2.5">
        {groups.map((group, index) => (
          <motion.li key={group.id} {...settle(index, 0.05)}>
            <motion.button type="button" onClick={() => onOpen(group.id)} className="flex w-full items-center gap-3.5 rounded-[24px] border border-ink/10 p-2.5 pr-4 text-left" whileTap={PRESS}>
              <GroupCover cover={group.cover} layoutId={SHARED.cover(group.id)} className="size-[68px] shrink-0 rounded-[18px]" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[17px] font-semibold">{group.name}</span>
                <span className="block text-[14px] text-ink/55">
                  {typeLabel(group)}
                  {group.days ? ` · Dia ${Math.min(dayNumber(group), group.days)} de ${group.days}` : ""}
                </span>
                <span className="mt-1 inline-flex items-center gap-1.5 rounded-full bg-rat-bg px-2 py-0.5 text-[13px] font-medium">
                  <b className="font-semibold text-rat-title">1º</b> {pointsLabel(group)}
                </span>
              </span>
              <ChevronRightIcon className="size-5 shrink-0 text-ink/30" />
            </motion.button>
          </motion.li>
        ))}
      </ul>
      <motion.div className="mt-4 grid grid-cols-2 gap-2" {...settle(groups.length, 0.05)}>
        <motion.button type="button" onClick={onCreate} className="flex h-12 items-center justify-center gap-2 rounded-[18px] border border-ink/12 text-[15px] font-medium" whileTap={PRESS}>
          <PlusIcon className="size-[18px]" />
          Criar grupo
        </motion.button>
        <motion.button type="button" onClick={onJoin} className="flex h-12 items-center justify-center gap-2 rounded-[18px] border border-ink/12 text-[15px] font-medium" whileTap={PRESS}>
          <KeyRoundIcon className="size-[18px]" />
          Usar código
        </motion.button>
      </motion.div>
    </div>
  )
}

function Placeholder({ tab, onRestart }: { tab: Tab; onRestart: () => void }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 px-8 pb-6 text-center text-[16px] text-ink/55">
      <p>{TABS.find((t) => t.id === tab)?.label} chega em breve.</p>
      {tab === "profile" && (
        <motion.button type="button" onClick={onRestart} className="h-11 rounded-[20px] border border-ink/15 px-5 font-medium text-ink" whileTap={PRESS}>
          Refazer o onboarding
        </motion.button>
      )}
    </div>
  )
}

/**
 * The main screen. A header in the rat's colour holds who you are and your points;
 * a white card holds the tab's content, with a floating tab bar at the bottom.
 * Creating, inviting and a group's page open on top of it.
 */
export function Dashboard({ kind, name, onRestart }: { kind: RatKind; name: string; onRestart: () => void }) {
  const [tab, setTab] = useState<Tab>("rankings")
  const [joining, setJoining] = useState(false)
  const [groups, setGroups] = useStored<Group[]>("groups", [])
  const [view, setView] = useState<View>(null)
  const closeJoin = useCallback(() => setJoining(false), [])
  const title = TABS.find((t) => t.id === tab)!.label
  const total = groups.reduce((sum, group) => sum + points(group), 0)
  const current = view && view.screen !== "create" ? groups.find((g) => g.id === view.id) : undefined

  useEffect(() => {
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", THEMES[kind].rat)
  }, [kind])

  const update = (group: Group) => setGroups((all) => all.map((g) => (g.id === group.id ? group : g)))
  const startCreate = () => {
    setJoining(false)
    setView({ screen: "create" })
  }

  const showsGroups = tab === "rankings" || tab === "groups"

  return (
    <motion.div className="theme-fade absolute inset-0 flex flex-col bg-rat" style={themeStyle(kind)} initial={{ opacity: 0 }} animate={{ opacity: 1, transition: open() }} exit={{ opacity: 0, transition: close }}>
      <div inert={joining || view !== null} className="flex min-h-0 flex-1 flex-col">
        <header className="flex items-start justify-between px-5 pt-[max(16px,env(safe-area-inset-top))] pb-7 text-on-rat">
          <div>
            <p className="text-[14px] font-medium opacity-80">{name ? `Olá, ${name.split(" ")[0]}` : "Olá!"}</p>
            <p className="mt-1.5 inline-flex h-9 items-center gap-1.5 rounded-xl bg-white/20 px-3 text-[20px] font-semibold tabular-nums" aria-label={`${total} pontos`}>
              <StarIcon className="size-[18px] fill-[#FFC93C] text-[#FFC93C]" aria-hidden="true" />
              {total}
              <span className="text-[13px] font-medium opacity-80">pts</span>
            </p>
          </div>
          <div className="flex items-center gap-2.5">
            <motion.button
              type="button"
              onClick={() => (groups[0] ? setView({ screen: "invite", id: groups[0].id }) : startCreate())}
              className="flex h-9 items-center gap-1.5 rounded-xl bg-white px-3 text-[14px] font-semibold text-rat-title"
              whileTap={PRESS}
            >
              <UserPlusIcon className="size-4" />
              Convidar
            </motion.button>
            <span className="flex size-11 items-center justify-center rounded-full bg-white text-[16px] font-semibold text-rat-title ring-2 ring-white/40" aria-label={name || "Perfil"}>
              {initials(name) || "?"}
            </span>
          </div>
        </header>

        <main className="flex min-h-0 flex-1 flex-col rounded-t-[32px] bg-white pb-[max(12px,env(safe-area-inset-bottom))]">
          <h1 className="px-6 pt-6 text-[44px] leading-none tracking-[-0.03em] text-rat-title">{title}</h1>
          <AnimatePresence mode="wait" initial={false}>
            <motion.div key={tab} className="flex min-h-0 flex-1 flex-col" initial={{ opacity: 0 }} animate={{ opacity: 1, transition: open() }} exit={{ opacity: 0, transition: close }}>
              {!showsGroups ? (
                <Placeholder tab={tab} onRestart={onRestart} />
              ) : groups.length ? (
                <GroupList groups={groups} onOpen={(id) => setView({ screen: "group", id, fromList: true })} onJoin={() => setJoining(true)} onCreate={startCreate} />
              ) : (
                <EmptyRankings onJoin={() => setJoining(true)} onCreate={startCreate} />
              )}
            </motion.div>
          </AnimatePresence>
          <TabBar active={tab} onChange={setTab} />
        </main>
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
