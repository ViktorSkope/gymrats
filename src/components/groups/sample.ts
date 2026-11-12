import { makeCode, type Group, type Member, type Post } from "./groups"

const DAY = 86_400_000

// Gym shots for friends' check-in instants (Unsplash), loaded from the web.
const SHOTS: Record<string, string> = {
  bruna: "https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?w=700&q=70&auto=format&fit=crop",
  caio: "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=700&q=70&auto=format&fit=crop",
  felipe: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=700&q=70&auto=format&fit=crop",
  caioRun: "https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=700&q=70&auto=format&fit=crop",
}

// Banner photos for the sample groups (Unsplash), loaded from the web.
const PHOTO = {
  legs: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=900&q=70&auto=format&fit=crop",
  run: "https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=900&q=70&auto=format&fit=crop",
  cross: "https://images.unsplash.com/photo-1599058917212-d750089bc07e?w=900&q=70&auto=format&fit=crop",
}

/** Small seeded random, so the sample looks the same every time it loads. */
function random(seed: number) {
  let s = seed
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296
    return s / 4294967296
  }
}

/** Check-ins on roughly `rate` of the last `days` days, at a plausible hour; `today` forces one today. */
function history(rand: () => number, days: number, rate: number, today = false) {
  const now = new Date()
  const out: number[] = []
  for (let d = days - 1; d >= 0; d--) {
    if (d === 0 ? !today : rand() > rate) continue
    const t = new Date(now.getTime() - d * DAY)
    t.setHours(6 + Math.floor(rand() * 14), Math.floor(rand() * 60), 0, 0)
    if (d === 0 && t.getTime() > now.getTime()) t.setTime(now.getTime() - 60_000)
    out.push(t.getTime())
    // Some days get a second session.
    if (rand() < 0.12) out.push(t.getTime() + 2 * 3_600_000)
  }
  return out.filter((t) => t <= now.getTime())
}

// Stock portraits for the sample friends (randomuser.me), loaded from the web.
const PHOTOS: Record<string, string> = {
  bruna: "women/44",
  caio: "men/32",
  duda: "women/68",
  felipe: "men/75",
  gabi: "women/21",
  leo: "men/46",
  marina: "women/90",
  julia: "women/63",
  rafa: "men/11",
  nina: "women/12",
  tom: "men/85",
}

// The big group's crew: [id, name, portrait].
const CREW: [string, string, string][] = [
  ["bruna", "Bruna", "women/44"],
  ["caio", "Caio", "men/32"],
  ["duda", "Duda", "women/68"],
  ["felipe", "Felipe", "men/75"],
  ["gabi", "Gabi", "women/21"],
  ["leo", "Léo", "men/46"],
  ["marina", "Marina", "women/90"],
  ["pedro", "Pedro", "men/22"],
  ["lara", "Lara", "women/33"],
  ["theo", "Théo", "men/52"],
  ["bia", "Bia", "women/55"],
  ["guto", "Guto", "men/61"],
  ["isa", "Isa", "women/79"],
  ["vini", "Vini", "men/18"],
  ["carol", "Carol", "women/26"],
  ["dani", "Dani", "men/39"],
  ["lu", "Lu", "women/50"],
  ["mateus", "Mateus", "men/67"],
  ["sofia", "Sofia", "women/7"],
  ["henrique", "Henrique", "men/81"],
  ["manu", "Manu", "women/15"],
  ["otavio", "Otávio", "men/90"],
  ["vivi", "Vivi", "women/36"],
]
for (const [id, , photo] of CREW) PHOTOS[id] = photo

const member = (rand: () => number, id: string, name: string, days: number, rate: number, today = false): Member => ({
  id,
  name,
  photo: `https://randomuser.me/api/portraits/${PHOTOS[id]}.jpg`,
  checkins: history(rand, days, rate, today),
})

/** A believable account: three groups, a handful of friends, some of them already trained today. */
export function sampleData(): { name: string; goal: "compete"; groups: Group[] } {
  const data = baseData()
  // Friends who trained today posted an instant; the group already voted and stuck stickers on some.
  const today = new Date().toDateString()
  const reactions: Record<string, Pick<Post, "yay" | "nay" | "stickers">> = {
    bruna: { yay: ["caio", "duda", "felipe", "lara"], nay: [], stickers: [sticker("caio", "🔥", 0.72, 0.22, 12), sticker("duda", "👑", 0.3, 0.6, -10)] },
    caio: { yay: ["bruna", "pedro"], nay: ["leo", "gabi", "theo"], stickers: [sticker("leo", "😂", 0.66, 0.3, 8)] },
    felipe: { yay: ["bruna"], nay: [], stickers: [sticker("bruna", "💪", 0.28, 0.25, -14), sticker("marina", "🐀", 0.7, 0.68, 10)] },
    caioRun: { yay: ["julia"], nay: [], stickers: [] },
  }
  for (const group of data.groups)
    for (const m of group.members ?? []) {
      const at = m.checkins.filter((t) => new Date(t).toDateString() === today).pop()
      const key = group.id === "sample-domingo" && m.id === "caio" ? "caioRun" : m.id
      if (!at || !SHOTS[key]) continue
      group.posts = [...(group.posts ?? []), { id: `${group.id}-${m.id}`, by: m.id, at, media: { kind: "photo", src: SHOTS[key] }, ...reactions[key] }]
    }
  return data
}

const sticker = (by: string, emoji: string, x: number, y: number, rotate: number) => ({ id: `${by}-${emoji}`, by, emoji, x, y, rotate })

function baseData(): { name: string; goal: "compete"; groups: Group[] } {
  const rand = random(42)
  const now = Date.now()
  const group = (g: Omit<Group, "code" | "description" | "access"> & { description?: string }): Group => ({ description: "", access: "open", code: makeCode(), ...g })

  return {
    name: "Vik",
    goal: "compete",
    groups: [
      group({
        id: "sample-pernas",
        name: "Os Malha Pernas",
        description: "Ninguém pula o dia de perna.",
        type: "challenge",
        scoring: "checkins",
        days: 30,
        cover: { kind: "red", pattern: "stripes", photo: PHOTO.legs },
        createdAt: now - 20 * DAY,
        checkins: history(rand, 20, 0.55),
        // 23 friends from very consistent to barely there, so you land mid-table (12th of 24).
        members: CREW.map(([id, name], i) => member(rand, id, name, 20, 0.97 - i * 0.04, ["bruna", "caio", "felipe"].includes(id))),
      }),
      group({
        id: "sample-domingo",
        name: "Corrida de Domingo",
        type: "club",
        scoring: "days",
        days: null,
        cover: { kind: "blue", pattern: "drops", photo: PHOTO.run },
        createdAt: now - 90 * DAY,
        checkins: history(rand, 90, 0.3),
        members: [member(rand, "caio", "Caio", 90, 0.35, true), member(rand, "julia", "Júlia", 90, 0.25), member(rand, "rafa", "Rafa", 90, 0.2)],
      }),
      group({
        id: "sample-cross",
        name: "Crossfit 6h",
        type: "challenge",
        scoring: "minutes",
        days: 14,
        cover: { kind: "green", pattern: "dots", photo: PHOTO.cross },
        createdAt: now - 6 * DAY,
        checkins: history(rand, 6, 0.8),
        members: [member(rand, "nina", "Nina", 6, 0.6), member(rand, "tom", "Tom", 6, 0.5)],
      }),
    ],
  }
}

/** Writes the sample into storage, replacing whatever is there. */
export function loadSample() {
  const data = sampleData()
  try {
    sessionStorage.setItem("gymrats.name", JSON.stringify(data.name))
    sessionStorage.setItem("gymrats.photo", JSON.stringify("https://randomuser.me/api/portraits/men/86.jpg"))
    sessionStorage.setItem("gymrats.goal", JSON.stringify(data.goal))
    sessionStorage.setItem("gymrats.groups", JSON.stringify(data.groups))
  } catch {
    // Storage blocked: nothing to load into.
  }
}
