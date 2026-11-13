import { ChevronRightIcon, XIcon } from "lucide-react"
import { AnimatePresence, motion } from "motion/react"
import { useCallback, useEffect, useRef, useState } from "react"

import { CreateGroup } from "@/components/groups/CreateGroup"
import { GroupCover } from "@/components/groups/GroupCover"
import { GroupDetail } from "@/components/groups/GroupDetail"
import { GroupInvite } from "@/components/groups/GroupInvite"
import { InstantCamera } from "@/components/checkin/InstantCamera"
import { InstantStack } from "@/components/checkin/InstantStack"
import { RoundButton } from "@/components/ui/kit"
import { STICKERS, dayNumber, friendsToday, liveInstants, myRank, pointsLabel, streak, typeLabel, type Group, type Post } from "@/components/groups/groups"
import { SleepyRat } from "@/components/rats/SleepyRat"
import { useStored } from "@/hooks/useStored"
import { PRESS, SHARED, close, open, settle, sheet } from "@/motion"
import { themeStyle, type RatKind } from "@/theme"
import { CheckinCalendar } from "./CheckinCalendar"
import { BottomNav, type Tab } from "./BottomNav"
import { FriendsStrip, GroupCarousel } from "./HomeGroups"
import { JoinGroupSheet } from "./JoinGroupSheet"
import { StatsView } from "./StatsView"
import { ProfileView } from "./TabViews"
import { paintChrome } from "@/chrome"

type View = { screen: "create" } | { screen: "invite"; id: string } | { screen: "group"; id: string; fromList?: boolean } | null

function headline(total: number, current: number) {
  if (!total) return "Você está só começando!"
  if (current >= 3) return "Ninguém te segura!"
  return "Bom treino, continue assim!"
}

/** Your groups as rows on the light Grupos panel. Covers grow into the group's page when opened. */
function GroupRows({ groups, onOpen }: { groups: Group[]; onOpen: (id: string) => void }) {
  return (
    <ul className="mt-5 mb-5 flex flex-col gap-2">
      {groups.map((group, index) => (
        <motion.li key={group.id} {...settle(index, 0.1)}>
          <motion.button type="button" onClick={() => onOpen(group.id)} className="flex w-full items-center gap-3 rounded-[22px] bg-[#EDEBEE] p-2 pr-3 text-left" whileTap={PRESS}>
            <GroupCover cover={group.cover} layoutId={SHARED.cover(group.id)} className="size-14 shrink-0 rounded-[16px]" />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[16px] font-semibold">{group.name}</span>
              <span className="block truncate text-[13px] text-ink/55">
                {typeLabel(group)}
                {group.days ? ` · Dia ${Math.min(dayNumber(group), group.days)} de ${group.days}` : ""} · {myRank(group)}º, {pointsLabel(group)}
              </span>
            </span>
            <ChevronRightIcon className="size-5 shrink-0 text-ink/35" />
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
    paintChrome("#1D1D1D")
  }, [])

  const update = (group: Group) => setGroups((all) => all.map((g) => (g.id === group.id ? group : g)))

  // Stories: every friend's instant from today, across all your groups, full screen.
  const [stories, setStories] = useState(false)
  const todays = groups.flatMap((group) => liveInstants(group).filter((p) => p.by !== "me").map((post) => ({ post, group }))).sort((a, b) => b.post.at - a.post.at)

  // Check-in = an instant. The camera opens with the given groups ticked.
  const [camera, setCamera] = useState<string[] | null>(null)
  const closeCamera = () => setCamera(null)
  const timers = useRef<number[]>([])
  useEffect(() => () => timers.current.forEach(clearTimeout), [])

  const editPost = (groupId: string, postId: string, change: (post: Post) => Post) =>
    setGroups((all) => all.map((g) => (g.id === groupId ? { ...g, posts: (g.posts ?? []).map((p) => (p.id === postId ? change(p) : p)) } : g)))

  const post = (media: Post["media"], groupIds: string[]) => {
    const at = Date.now()
    const made = groupIds.map((groupId) => ({ groupId, post: { id: crypto.randomUUID(), by: "me", at, media, yay: [], nay: [], stickers: [] } as Post }))
    setGroups((all) =>
      all.map((g) => {
        const mine = made.find((m) => m.groupId === g.id)
        return mine ? { ...g, checkins: [...g.checkins, at], posts: [mine.post, ...(g.posts ?? [])] } : g
      }),
    )
    setCamera(null)

    // No backend: a few friends react over the next seconds, so the vote and stickers come alive.
    for (const { groupId, post: p } of made) {
      const friends = [...(groups.find((g) => g.id === groupId)?.members ?? [])].sort(() => Math.random() - 0.5).slice(0, 4)
      friends.forEach((friend, i) => {
        timers.current.push(
          window.setTimeout(() => {
            editPost(groupId, p.id, (cur) => {
              const sticker = i % 2 === 1 ? [{ id: crypto.randomUUID(), by: friend.id, emoji: STICKERS[Math.floor(Math.random() * STICKERS.length)], x: 0.2 + Math.random() * 0.6, y: 0.15 + Math.random() * 0.55, rotate: Math.round(Math.random() * 30 - 15) }] : []
              // Mostly yays; now and then someone isn't convinced.
              const nay = i === 3 && Math.random() < 0.5
              return { ...cur, yay: nay ? cur.yay : [...cur.yay, friend.id], nay: nay ? [...cur.nay, friend.id] : cur.nay, stickers: [...cur.stickers, ...sticker] }
            })
          }, 2500 + i * 2200),
        )
      })
    }
  }

  const startCreate = () => {
    setJoining(false)
    setView({ screen: "create" })
  }

  const groupsCard = (
    <motion.section
      className="relative flex flex-1 flex-col overflow-hidden rounded-[30px] bg-paper p-5 text-ink"
      initial={{ y: 24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 30, delay: 0.08 }}
    >
      <h1 className="text-[clamp(34px,10vw,44px)] leading-none tracking-[-0.03em]">Grupos</h1>
      {groups.length ? (
        <GroupRows groups={groups} onOpen={(id) => setView({ screen: "group", id, fromList: true })} />
      ) : (
        <>
          {/* Nothing to compete in yet, so the rat sleeps. */}
          <SleepyRat className="mx-auto mt-10 w-[clamp(140px,42vw,190px)]" />
          <p className="mx-auto mt-5 max-w-[260px] text-center text-[17px] leading-snug text-ink/60">Você ainda não tem grupos. Crie um ou entre em um grupo.</p>
        </>
      )}
      <motion.button
        type="button"
        onClick={() => setJoining(true)}
        className="relative mt-auto h-12 w-full shrink-0 rounded-[20px] bg-rat text-[17px] text-on-rat outline-none focus-visible:ring-3 focus-visible:ring-ink/30"
        whileTap={PRESS}
      >
        Novo grupo
      </motion.button>
    </motion.section>
  )

  return (
    <motion.div className="theme-fade absolute inset-0 bg-ink" style={themeStyle(kind)} initial={{ opacity: 0 }} animate={{ opacity: 1, transition: open() }} exit={{ opacity: 0, transition: close }}>
      <div inert={joining || view !== null} className="flex h-full flex-col">
        <div className="min-h-0 flex-1 overflow-y-auto px-[7px] pt-[max(6px,var(--sat))] pb-[calc(60px+max(12px,var(--sab))+16px)]">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div key={tab} className={`flex flex-col gap-2 ${tab === "profile" || tab === "groups" ? "min-h-full" : ""}`} initial={{ opacity: 0 }} animate={{ opacity: 1, transition: open() }} exit={{ opacity: 0, transition: close }}>
              {tab === "home" && (
              <>
                {/* Sized to fit one screen: the calendar and headline scale with the height, the groups take the rest. */}
                <motion.section
                  className="shrink-0 rounded-[30px] bg-paper px-5 pt-[clamp(14px,2dvh,22px)] pb-[clamp(12px,1.8dvh,18px)]"
                  initial={{ y: -24, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                >
                  <motion.div {...settle(0, 0.1)}>
                    <CheckinCalendar checkins={groups.flatMap((g) => g.checkins)} />
                  </motion.div>
                  <motion.p className="mt-[clamp(10px,2dvh,24px)] text-[14px] font-semibold" {...settle(0, 0.15)}>
                    Visão Geral
                  </motion.p>
                  <motion.h1 className="mt-1.5 text-[clamp(26px,3.9dvh,40px)] leading-[1.02] tracking-[-0.035em] text-balance" {...settle(1, 0.15)}>
                    {headline(checkins, days.current)}
                  </motion.h1>
                  <motion.p className="mt-[clamp(8px,1.4dvh,14px)] inline-flex h-[30px] items-center rounded-full bg-[#E6E4E7] px-3.5 text-[14px] tabular-nums" {...settle(2, 0.15)}>
                    Dias seguidos: {days.current}/{days.best}
                  </motion.p>
                </motion.section>
                <FriendsStrip people={friendsToday(groups)} onOpen={() => setStories(true)} />
                <GroupCarousel groups={groups} me={name} onOpen={(id) => setView({ screen: "group", id })} onNewGroup={() => setJoining(true)} />
              </>
            )}
            {tab === "groups" && groupsCard}
              {tab === "checkin" && <StatsView groups={groups} me={name} onCheckIn={() => (groups.length ? setCamera(groups.map((g) => g.id)) : setJoining(true))} />}
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
            <GroupDetail group={current} morph={view.fromList} me={name} onBack={() => setView(null)} onInvite={() => setView({ screen: "invite", id: current.id })} onChange={update} onCheckIn={() => setCamera([current.id])} />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {stories && (
          <motion.div key="stories" className="absolute inset-0 z-30 flex flex-col bg-black px-[7px] pt-[max(6px,var(--sat))]" {...sheet}>
            <InstantStack variant="full" items={todays} me={name} onChange={(groupId, next) => editPost(groupId, next.id, () => next)} onFinish={() => setStories(false)} />
            <RoundButton label="Fechar" onClick={() => setStories(false)} className="absolute top-[max(22px,calc(var(--sat)+16px))] right-5 z-40 bg-black/45! text-white! backdrop-blur-md">
              <XIcon className="size-5" />
            </RoundButton>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {camera && (
          <motion.div key="camera" className="absolute inset-0 z-30" {...sheet}>
            <InstantCamera groups={groups} preselect={camera} onClose={closeCamera} onPost={post} />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
