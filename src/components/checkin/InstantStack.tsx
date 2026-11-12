import { RotateCcwIcon, ThumbsDownIcon, ThumbsUpIcon } from "lucide-react"
import { AnimatePresence, animate, motion, useMotionValue, useTransform } from "motion/react"
import { useRef, useState, type PointerEvent as ReactPointerEvent } from "react"

import { PersonAvatar } from "@/components/Avatar"
import { author, contested, timeAgo, type Group, type Post } from "@/components/groups/groups"
import { haptic } from "@/hooks/useHaptic"
import { PRESS } from "@/motion"

// Vale is the easy swipe: a short flick right is enough. Não vale asks for a deliberate pull left.
const YAY_AT = 70
const NAY_AT = 130
const HOLD_MS = 380
const MOVE_SLOP = 8
// The stickers fan out in an arc around your finger.
const FAN = ["🔥", "💪", "🏆", "👏", "😤", "🐀", "💯", "😂"]
const FAN_RADIUS = 92

type Picker = { x: number; y: number; up: boolean; hover: number | null }

function fanPoint(i: number, up: boolean) {
  const start = up ? 200 : 20
  const angle = ((start + (i * 140) / (FAN.length - 1)) * Math.PI) / 180
  return { dx: Math.cos(angle) * FAN_RADIUS, dy: Math.sin(angle) * FAN_RADIUS }
}

/** The photo or video with its stickers, the person, and the tally, edge to edge. */
function Face({ post, group, me }: { post: Post; group: Group; me: string }) {
  const [broken, setBroken] = useState(false)
  const who = author(group, post.by, me)
  return (
    <div className="absolute inset-0 overflow-hidden rounded-[30px] bg-[#111]">
      {broken ? (
        <div className="flex size-full items-center justify-center px-6 text-center text-[14px] text-white/60">Este instant expirou.</div>
      ) : post.media.kind === "photo" ? (
        <img src={post.media.src} alt={`Check-in de ${who.me ? "você" : who.name}`} className="size-full object-cover" draggable={false} onError={() => setBroken(true)} />
      ) : (
        <video src={post.media.src} autoPlay loop muted playsInline className="size-full object-cover" onError={() => setBroken(true)} />
      )}

      {post.stickers.map((s) => (
        <motion.span
          key={s.id}
          className="pointer-events-none absolute text-[44px] leading-none drop-shadow-[0_4px_8px_rgb(0_0_0/0.35)] select-none"
          style={{ left: `${s.x * 100}%`, top: `${s.y * 100}%`, x: "-50%", y: "-50%" }}
          initial={{ scale: 0, rotate: s.rotate - 30 }}
          animate={{ scale: 1, rotate: s.rotate }}
          transition={{ type: "spring", stiffness: 500, damping: 16 }}
          aria-hidden="true"
        >
          {s.emoji}
        </motion.span>
      ))}

      {/* Who and when, over a dark fade so it reads on any photo. */}
      <div className="pointer-events-none absolute inset-x-0 top-0 flex items-center gap-2.5 bg-gradient-to-b from-black/70 via-black/30 to-transparent px-4 pt-4 pb-10 text-white">
        <PersonAvatar name={who.name} photo={who.photo} me={who.me} className="size-9" />
        <span className="min-w-0 flex-1 leading-tight">
          <span className="block truncate text-[16px] font-semibold">{who.me ? "Você" : who.name}</span>
          <span className="block text-[13px] opacity-75">{timeAgo(post.at)}</span>
        </span>
        {contested(post) && <span className="rounded-full bg-rat px-2.5 py-1 text-[12px] font-semibold">Contestado</span>}
      </div>

      {/* The tally so far. */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between bg-gradient-to-t from-black/70 via-black/25 to-transparent px-4 pt-12 pb-4 text-white">
        <span className="flex items-center gap-3 text-[15px] font-medium tabular-nums">
          <span className="flex items-center gap-1.5">
            <ThumbsUpIcon className="size-4" />
            {post.yay.length}
          </span>
          <span className="flex items-center gap-1.5 opacity-80">
            <ThumbsDownIcon className="size-4" />
            {post.nay.length}
          </span>
        </span>
        <span className="text-[12px] opacity-75">{contested(post) ? "Não conta pontos" : post.by === "me" ? "Seu check-in" : "Segure para figurinha"}</span>
      </div>
    </div>
  )
}

/** The card on top: drag to vote, hold to sticker. */
function TopCard({ post, group, me, onVote, onSticker }: { post: Post; group: Group; me: string; onVote: (kind: "yay" | "nay" | "skip") => void; onSticker: (emoji: string, x: number, y: number) => void }) {
  const ref = useRef<HTMLDivElement>(null)
  const x = useMotionValue(0)
  const rotate = useTransform(x, [-240, 240], [-14, 14])
  const yay = useTransform(x, [12, YAY_AT], [0, 1])
  const nay = useTransform(x, [-12, -NAY_AT], [0, 1])
  const mine = post.by === "me"
  const [picker, setPicker] = useState<Picker | null>(null)
  // The finger: where it went down, whether it is dragging, and its last moves for a flick speed.
  const press = useRef<{ x: number; y: number; timer: number; dragging: boolean; trail: { x: number; t: number }[] } | null>(null)
  const leaving = useRef(false)

  const fly = (kind: "yay" | "nay" | "skip", direction: number) => {
    if (leaving.current) return
    leaving.current = true
    haptic(kind === "skip" ? 8 : 18)
    animate(x, direction * 520, { duration: 0.28, ease: [0.4, 0, 1, 1] }).then(() => onVote(kind))
  }

  const release = (offset: number, velocity: number) => {
    const dx = offset + velocity * 0.15
    if (dx > YAY_AT) return fly(mine ? "skip" : "yay", 1)
    if (dx < -NAY_AT || (mine && dx < -YAY_AT)) return fly(mine ? "skip" : "nay", -1)
    animate(x, 0, { type: "spring", stiffness: 500, damping: 32 })
  }

  // Hold: if the finger stays put, open the sticker fan around it instead of dragging.
  const local = (event: ReactPointerEvent) => {
    const box = ref.current!.getBoundingClientRect()
    return { x: event.clientX - box.left, y: event.clientY - box.top, w: box.width, h: box.height }
  }

  const onPointerDown = (event: ReactPointerEvent) => {
    const p = local(event)
    const timer = window.setTimeout(() => {
      if (!press.current || press.current.dragging) return
      haptic(15)
      setPicker({ x: p.x, y: p.y, up: p.y > 150, hover: null })
    }, HOLD_MS)
    press.current = { x: event.clientX, y: event.clientY, timer, dragging: false, trail: [{ x: event.clientX, t: event.timeStamp }] }
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  const onPointerMove = (event: ReactPointerEvent) => {
    if (!press.current) return
    if (picker) {
      const p = local(event)
      let hover: number | null = null
      let best = 34
      FAN.forEach((_, i) => {
        const { dx, dy } = fanPoint(i, picker.up)
        const d = Math.hypot(p.x - (picker.x + dx), p.y - (picker.y + dy))
        if (d < best) {
          best = d
          hover = i
        }
      })
      if (hover !== picker.hover) {
        if (hover !== null) haptic(6)
        setPicker({ ...picker, hover })
      }
      return
    }
    // Moving (not holding still) means a swipe: the card follows the finger sideways.
    if (!press.current.dragging && Math.hypot(event.clientX - press.current.x, event.clientY - press.current.y) > MOVE_SLOP) {
      press.current.dragging = true
      clearTimeout(press.current.timer)
    }
    if (press.current.dragging && !leaving.current) {
      x.set(event.clientX - press.current.x)
      press.current.trail = [...press.current.trail.slice(-4), { x: event.clientX, t: event.timeStamp }]
    }
  }

  const onPointerUp = (event: ReactPointerEvent) => {
    const current = press.current
    if (current) clearTimeout(current.timer)
    press.current = null
    if (current?.dragging && !picker) {
      const first = current.trail[0]
      const elapsed = Math.max(1, event.timeStamp - first.t)
      // Speed over the last few moves, in px per second, for flicks.
      release(event.clientX - current.x, event.type === "pointercancel" ? 0 : ((event.clientX - first.x) / elapsed) * 1000)
      return
    }
    if (!picker) return
    const box = ref.current!.getBoundingClientRect()
    if (picker.hover !== null) onSticker(FAN[picker.hover], picker.x / box.width, picker.y / box.height)
    setPicker(null)
  }

  return (
    <motion.div
      ref={ref}
      className="absolute inset-0 z-10 cursor-grab touch-pan-y active:cursor-grabbing"
      style={{ x, rotate }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onContextMenu={(event) => event.preventDefault()}
      initial={{ scale: 0.96, y: 10 }}
      animate={{ scale: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
    >
      <Face post={post} group={group} me={me} />

      {/* What letting go would do. */}
      {!mine && (
        <>
          <motion.span className="pointer-events-none absolute top-20 left-5 -rotate-12 rounded-xl border-[3px] border-check bg-black/20 px-3 py-1 text-[26px] font-bold tracking-wide text-check" style={{ opacity: yay }}>
            VALE
          </motion.span>
          <motion.span className="pointer-events-none absolute top-20 right-5 rotate-12 rounded-xl border-[3px] border-rat bg-black/20 px-3 py-1 text-[26px] font-bold tracking-wide text-rat" style={{ opacity: nay }}>
            NÃO VALE
          </motion.span>
        </>
      )}

      {/* The sticker fan, around where you're holding. */}
      <AnimatePresence>
        {picker && (
          <motion.div className="pointer-events-none absolute inset-0 z-20" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0.12 } }}>
            <div className="absolute inset-0 rounded-[30px] bg-black/35" />
            <span className="absolute size-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white" style={{ left: picker.x, top: picker.y }} />
            {FAN.map((emoji, i) => {
              const { dx, dy } = fanPoint(i, picker.up)
              const on = picker.hover === i
              return (
                <motion.span
                  key={emoji}
                  className="absolute flex size-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-paper text-[28px] shadow-lg shadow-black/30"
                  style={{ left: picker.x, top: picker.y }}
                  initial={{ x: 0, y: 0, scale: 0.3 }}
                  animate={{ x: dx, y: dy, scale: on ? 1.35 : 1 }}
                  transition={{ type: "spring", stiffness: 520, damping: 26, delay: on ? 0 : i * 0.015 }}
                >
                  {emoji}
                </motion.span>
              )
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// The pile underneath: each card sits a little lower, smaller and askew.
const PILE = [
  { y: 22, scale: 0.95, rotate: -5 },
  { y: 40, scale: 0.9, rotate: 5 },
]

/**
 * Today's instants as a pile of photos. Swipe the top one right for Vale (the easy
 * way) or pull it left for Não vale; your own just slide away. Hold on a photo and
 * drag onto a sticker to stick it there. Buttons below do the same, for anyone who
 * prefers tapping.
 */
export function InstantStack({ posts, group, me, onChange }: { posts: Post[]; group: Group; me: string; onChange: (post: Post) => void }) {
  const [gone, setGone] = useState<string[]>([])
  const queue = posts.filter((p) => !gone.includes(p.id))
  const top = queue[0]

  const vote = (post: Post, kind: "yay" | "nay" | "skip") => {
    if (kind !== "skip") {
      const yay = post.yay.filter((id) => id !== "me")
      const nay = post.nay.filter((id) => id !== "me")
      ;(kind === "yay" ? yay : nay).push("me")
      onChange({ ...post, yay, nay })
    }
    setGone((g) => [...g, post.id])
  }

  const sticker = (post: Post, emoji: string, x: number, y: number) => {
    haptic(20)
    onChange({ ...post, stickers: [...post.stickers, { id: crypto.randomUUID(), by: "me", emoji, x, y, rotate: Math.round(Math.random() * 30 - 15) }] })
  }

  return (
    <div>
      <div className="relative mx-4 mb-10 aspect-[3/4]" aria-live="polite">
        {top ? (
          <>
            {queue
              .slice(1, 3)
              .map((post, i) => (
                <motion.div key={post.id} className="absolute inset-0" animate={PILE[i]} transition={{ type: "spring", stiffness: 300, damping: 28 }} style={{ zIndex: 5 - i }}>
                  <Face post={post} group={group} me={me} />
                  <div className="absolute inset-0 rounded-[30px] bg-black/30" />
                </motion.div>
              ))
              .reverse()}
            <TopCard key={top.id} post={top} group={group} me={me} onVote={(kind) => vote(top, kind)} onSticker={(emoji, x, y) => sticker(top, emoji, x, y)} />
          </>
        ) : (
          <div className="flex size-full flex-col items-center justify-center gap-4 rounded-[30px] border-2 border-dashed border-white/15 px-8 text-center text-white">
            <p className="text-[20px] leading-tight">{posts.length ? "Você viu todos os check-ins de hoje" : "Ninguém fez check-in hoje ainda"}</p>
            {posts.length > 0 && (
              <motion.button type="button" onClick={() => setGone([])} className="flex h-11 items-center gap-2 rounded-full bg-paper px-5 text-[15px] text-ink" whileTap={PRESS}>
                <RotateCcwIcon className="size-4" />
                Ver de novo
              </motion.button>
            )}
          </div>
        )}
      </div>

      {top && top.by !== "me" && (
        <div className="mt-4 flex items-center justify-center gap-5">
          <motion.button type="button" aria-label="Não vale" onClick={() => vote(top, "nay")} className="flex size-14 items-center justify-center rounded-full bg-paper text-rat" whileTap={PRESS}>
            <ThumbsDownIcon className="size-6" />
          </motion.button>
          <p className="w-28 text-center text-[12px] leading-tight text-white/55">← não vale · vale →</p>
          <motion.button type="button" aria-label="Vale" onClick={() => vote(top, "yay")} className="flex size-14 items-center justify-center rounded-full bg-check text-white" whileTap={PRESS}>
            <ThumbsUpIcon className="size-6" />
          </motion.button>
        </div>
      )}
    </div>
  )
}
