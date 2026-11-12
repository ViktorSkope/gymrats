import type { RatKind } from "@/theme"

export type GroupType = "challenge" | "club"
export type Scoring = "days" | "checkins" | "minutes"
export type Access = "open" | "approval"
export type Pattern = "drops" | "stripes" | "dots"

/** Either a drawn cover (a rat on a pattern) or a photo, stored as a small data URL. */
export type Cover = { kind: RatKind; pattern: Pattern; photo?: string }

/** Someone else in the group. Friends are sample data for now: there is no backend. */
export type Member = { id: string; name: string; checkins: number[] }

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

export const points = (group: Group) => score(group.scoring, group.checkins)

/** Short unit for tight spaces like ranking rows. */
export const UNIT_SHORT: Record<Scoring, string> = { days: "dias", checkins: "check-ins", minutes: "min" }

export type Standing = { id: string; name: string; me: boolean; points: number; rank: number }

/** Everyone in the group, best first. Ties share a place. */
export function ranking(group: Group, myName: string): Standing[] {
  const all = [{ id: "me", name: myName || "Você", me: true, points: points(group) }, ...(group.members ?? []).map((m) => ({ id: m.id, name: m.name, me: false, points: score(group.scoring, m.checkins) }))]
  all.sort((a, b) => b.points - a.points || Number(b.me) - Number(a.me))
  return all.map((entry) => ({ ...entry, rank: all.findIndex((other) => other.points === entry.points) + 1 }))
}

export const myRank = (group: Group) => ranking(group, "").find((s) => s.me)!.rank

/** Friends (across all groups, counted once) with a check-in today. */
export function friendsToday(groups: Group[]) {
  const today = dayKey(Date.now())
  const names = new Map<string, string>()
  for (const g of groups) for (const m of g.members ?? []) if (m.checkins.some((t) => dayKey(t) === today)) names.set(m.name, m.name)
  return [...names.values()]
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
