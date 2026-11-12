import type { RatKind } from "@/theme"

export type GroupType = "challenge" | "club"
export type Scoring = "days" | "checkins" | "minutes"
export type Access = "open" | "approval"
export type Pattern = "drops" | "stripes" | "dots"

/** Either a drawn cover (a rat on a pattern) or a photo, stored as a small data URL. */
export type Cover = { kind: RatKind; pattern: Pattern; photo?: string }

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
  /** Your check-ins, as timestamps. Only you so far: there is no backend. */
  checkins: number[]
}

/** Prototype stand-in until workouts carry a real length. */
export const MINUTES_PER_CHECKIN = 45

const dayKey = (time: number) => new Date(time).toDateString()
export const activeDays = (group: Group) => new Set(group.checkins.map(dayKey)).size
export const checkedInToday = (group: Group) => group.checkins.some((t) => dayKey(t) === dayKey(Date.now()))

export function points(group: Group) {
  if (group.scoring === "days") return activeDays(group)
  if (group.scoring === "checkins") return group.checkins.length
  return group.checkins.length * MINUTES_PER_CHECKIN
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
