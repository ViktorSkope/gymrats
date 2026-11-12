import type { RatKind } from "@/theme"

export type GroupType = "challenge" | "club"
export type Scoring = "days" | "checkins" | "minutes"
export type Access = "open" | "approval"
export type Pattern = "drops" | "stripes" | "dots"

/** Either a drawn cover (a rat on a pattern) or a photo, stored as a small data URL. */
export type Cover = { kind: RatKind; pattern: Pattern; photo?: string }

/** Someone else in the group. Friends are sample data for now: there is no backend. */
export type Member = { id: string; name: string; checkins: number[]; /** Profile photo URL. */ photo?: string }

export type Group = {
  id: string
  name: string
  description: string
  type: GroupType
  scoring: Scoring
  /** Challenges run for a set number of days. Clubs have no end. */
  days: number | null
  cover: Cover
  access: Access
  code: string
  createdAt: number
  /** Your check-ins, as timestamps. */
  checkins: number[]
  /** Everyone else in the group, if anyone. */
  members?: Member[]
  /** Check-in instants, newest first. */
  posts?: Post[]
}

/** Prototype stand-in until workouts carry a real length. */
export const MINUTES_PER_CHECKIN = 45

const dayKey = (time: number) => new Date(time).toDateString()
export const activeDays = (group: Group) => new Set(group.checkins.map(dayKey)).size
export const checkedInToday = (group: Group) => group.checkins.some((t) => dayKey(t) === dayKey(Date.now()))

/** Points for a list of check-ins under a scoring mode. */
export function score(scoring: Scoring, checkins: number[]) {
  if (scoring === "days") return new Set(checkins.map(dayKey)).size
  if (scoring === "checkins") return checkins.length
  return checkins.length * MINUTES_PER_CHECKIN
}

/** Check-ins that count: the group can vote one down (see contested), and then it scores nothing. */
export const counted = (group: Group, by: string, checkins: number[]) => checkins.filter((t) => !(group.posts ?? []).some((p) => p.by === by && p.at === t && contested(p)))

export const points = (group: Group) => score(group.scoring, counted(group, "me", group.checkins))

/** Short unit for tight spaces like ranking rows. */
export const UNIT_SHORT: Record<Scoring, string> = { days: "dias", checkins: "check-ins", minutes: "min" }

export type Standing = { id: string; name: string; me: boolean; points: number; rank: number; photo?: string }

/** Everyone in the group, best first. Ties share a place. */
export function ranking(group: Group, myName: string): Standing[] {
  const all = [{ id: "me", name: myName || "Você", me: true, points: points(group) }, ...(group.members ?? []).map((m) => ({ id: m.id, name: m.name, photo: m.photo, me: false, points: score(group.scoring, counted(group, m.id, m.checkins)) }))]
  all.sort((a, b) => b.points - a.points || Number(b.me) - Number(a.me))
  return all.map((entry) => ({ ...entry, rank: all.findIndex((other) => other.points === entry.points) + 1 }))
}

export const myRank = (group: Group) => ranking(group, "").find((s) => s.me)!.rank

/** Friends (across all groups, counted once) with a check-in today. */
export function friendsToday(groups: Group[]) {
  const today = dayKey(Date.now())
  const people = new Map<string, { name: string; photo?: string }>()
  for (const g of groups) for (const m of g.members ?? []) if (m.checkins.some((t) => dayKey(t) === today)) people.set(m.id, { name: m.name, photo: m.photo })
  return [...people.values()]
}

export const pointsLabel = (group: Group) => {
  const value = points(group)
  const unit = SCORING.find((s) => s.id === group.scoring)!.unit
  return `${value} ${value === 1 ? unit.replace(/s(?= |$)/g, "") : unit}`
}

export const GROUP_TYPES: { id: GroupType; label: string; hint: string }[] = [
  { id: "challenge", label: "Desafio", hint: "Desafios têm começo e fim. Ótimos para um gás de 30 dias." },
  { id: "club", label: "Clube", hint: "Clubes não acabam. Para quem treina junto sempre." },
]

export const SCORING: { id: Scoring; label: string; hint: string; unit: string }[] = [
  { id: "days", label: "Dias ativos", hint: "1 ponto por dia com treino", unit: "dias ativos" },
  { id: "checkins", label: "Check-ins", hint: "1 ponto por check-in, vários por dia", unit: "check-ins" },
  { id: "minutes", label: "Minutos", hint: "1 ponto por minuto treinado", unit: "minutos" },
]

export const DURATIONS = [7, 14, 30, 60]

const KINDS: RatKind[] = ["red", "blue", "yellow", "green"]
const PATTERNS: Pattern[] = ["drops", "stripes", "dots"]

/** A different drawn cover from the current one. */
export function shuffleCover(current?: Cover): Cover {
  for (;;) {
    const next = { kind: KINDS[Math.floor(Math.random() * KINDS.length)], pattern: PATTERNS[Math.floor(Math.random() * PATTERNS.length)] }
    if (!current || current.photo || next.kind !== current.kind || next.pattern !== current.pattern) return next
  }
}

// No 0/O or 1/I, so codes survive being read out loud.
const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
export const makeCode = () => Array.from({ length: 8 }, () => CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)]).join("")

export const inviteLink = (group: Group) => `https://share.gymrats.app/join?code=${group.code}`

const DAY = 86_400_000
export const endsAt = (group: Group) => (group.days ? group.createdAt + group.days * DAY : null)
export const dayNumber = (group: Group) => Math.floor((Date.now() - group.createdAt) / DAY) + 1

export const shortDate = (time: number) => new Date(time).toLocaleDateString("pt-BR", { day: "numeric", month: "short" }).replace(".", "")

export const typeLabel = (group: Group) => GROUP_TYPES.find((t) => t.id === group.type)!.label

export const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join("")

/** Shrinks a picked photo so it fits comfortably in session storage. */
export function photoToDataUrl(file: File, maxWidth = 900): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const image = new Image()
    image.onload = () => {
      const scale = Math.min(1, maxWidth / image.width)
      const canvas = document.createElement("canvas")
      canvas.width = Math.round(image.width * scale)
      canvas.height = Math.round(image.height * scale)
      canvas.getContext("2d")!.drawImage(image, 0, 0, canvas.width, canvas.height)
      URL.revokeObjectURL(url)
      resolve(canvas.toDataURL("image/jpeg", 0.8))
    }
    image.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error("Não deu para abrir essa imagem."))
    }
    image.src = url
  })
}

/** Shares through the phone's share sheet, or copies the link where that is not available. */
export async function shareGroup(group: Group): Promise<"shared" | "copied" | "cancelled"> {
  const data = { title: `gymrats: ${group.name}`, text: `Bora treinar comigo no ${group.name}! Código: ${group.code}`, url: inviteLink(group) }
  if (navigator.share) {
    try {
      await navigator.share(data)
      return "shared"
    } catch {
      return "cancelled"
    }
  }
  await copyText(inviteLink(group))
  return "copied"
}

export async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text)
  } catch {
    // Clipboard blocked: nothing else to do in a prototype.
  }
}

/** Days in a row with a check-in in any group: the current run (alive if it reaches today or yesterday) and the best run. */
export function streak(groups: Group[]) {
  const DAY = 86_400_000
  const days = [...new Set(groups.flatMap((g) => g.checkins.map((t) => Math.floor((t - new Date(t).getTimezoneOffset() * 60_000) / DAY))))].sort((a, b) => a - b)
  let best = 0
  let run = 0
  for (let i = 0; i < days.length; i++) {
    run = i > 0 && days[i] === days[i - 1] + 1 ? run + 1 : 1
    best = Math.max(best, run)
  }
  const now = Date.now()
  const today = Math.floor((now - new Date(now).getTimezoneOffset() * 60_000) / DAY)
  const last = days[days.length - 1]
  const current = last !== undefined && today - last <= 1 ? run : 0
  return { current, best }
}

/** A sticker someone stuck on a check-in, placed as a share of the photo's size. */
export type Sticker = { id: string; by: string; emoji: string; x: number; y: number; rotate: number }

/**
 * A check-in instant: a quick photo or short video taken at the gym. People in the
 * group vote whether it counts (yay or nay) and stick stickers on it.
 * `by` is "me" or a member's id. Videos live only for this visit (blob URLs).
 */
export type Post = {
  id: string
  by: string
  at: number
  media: { kind: "photo" | "video"; src: string }
  yay: string[]
  nay: string[]
  stickers: Sticker[]
}

export const STICKERS = ["🔥", "💪", "🏆", "👏", "😤", "🐀", "💯", "😂", "🥵", "👑"]

/** Instants stay up for a day, like the moment they capture. */
export const INSTANT_LIFE = 24 * 3_600_000
export const liveInstants = (group: Group, now = Date.now()) => (group.posts ?? []).filter((p) => now - p.at < INSTANT_LIFE).sort((a, b) => b.at - a.at)

/** Enough people said it doesn't count: more nays than yays, and at least two. */
export const contested = (post: Post) => post.nay.length >= 2 && post.nay.length > post.yay.length

export function author(group: Group, id: string, myName: string) {
  if (id === "me") return { name: myName || "Você", photo: undefined as string | undefined, me: true }
  const m = group.members?.find((x) => x.id === id)
  return { name: m?.name ?? "Alguém", photo: m?.photo, me: false }
}

export function timeAgo(at: number, now = Date.now()) {
  const min = Math.floor((now - at) / 60_000)
  if (min < 1) return "agora"
  if (min < 60) return `há ${min} min`
  return `há ${Math.floor(min / 60)} h`
}
