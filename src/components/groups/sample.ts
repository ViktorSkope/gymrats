import { makeCode, type Group, type Member } from "./groups"

const DAY = 86_400_000

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

const member = (rand: () => number, id: string, name: string, days: number, rate: number, today = false): Member => ({ id, name, checkins: history(rand, days, rate, today) })

/** A believable account: three groups, a handful of friends, some of them already trained today. */
export function sampleData(): { name: string; goal: "compete"; groups: Group[] } {
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
        cover: { kind: "red", pattern: "stripes" },
        createdAt: now - 20 * DAY,
        checkins: history(rand, 20, 0.55),
        members: [
          member(rand, "bruna", "Bruna", 20, 0.85, true),
          member(rand, "caio", "Caio", 20, 0.8, true),
          member(rand, "duda", "Duda", 20, 0.75),
          member(rand, "felipe", "Felipe", 20, 0.7, true),
          member(rand, "gabi", "Gabi", 20, 0.4),
          member(rand, "leo", "Léo", 20, 0.3),
          member(rand, "marina", "Marina", 20, 0.2),
        ],
      }),
      group({
        id: "sample-domingo",
        name: "Corrida de Domingo",
        type: "club",
        scoring: "days",
        days: null,
        cover: { kind: "blue", pattern: "drops" },
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
        cover: { kind: "green", pattern: "dots" },
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
    sessionStorage.setItem("gymrats.goal", JSON.stringify(data.goal))
    sessionStorage.setItem("gymrats.groups", JSON.stringify(data.groups))
  } catch {
    // Storage blocked: nothing to load into.
  }
}
