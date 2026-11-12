import type { CSSProperties } from "react"

export type RatKind = "red" | "blue" | "yellow" | "green"

// title: the rat colour, darkened where needed so big headings read on white.
export const THEMES: Record<RatKind, { rat: string; bg: string; onRat: string; title: string }> = {
  red: { rat: "#D23A2C", bg: "#F7F5F8", onRat: "#FFFFFF", title: "#D23A2C" },
  blue: { rat: "#4E8BD3", bg: "#D7EAFD", onRat: "#FFFFFF", title: "#3A72BE" },
  // Yellow is too light for white text, so its buttons use ink.
  yellow: { rat: "#F4BA41", bg: "#FFF3D6", onRat: "#1D1D1D", title: "#B07A0C" },
  green: { rat: "#3B7F5C", bg: "#F4FCD8", onRat: "#FFFFFF", title: "#3B7F5C" },
}

export type GoalId = "compete" | "performance" | "groups" | "new"

// Every answer keeps the same red rat; the answer only tailors the copy along the way.
export const GOALS: { id: GoalId; label: string; prepStep: string; ready: string }[] = [
  { id: "compete", label: "Competir com amigos", prepStep: "Montando o ranking com seus amigos", ready: "Tudo pronto para começar a sua jornada na competição!" },
  { id: "performance", label: "Melhorar minha performance", prepStep: "Calibrando suas metas de performance", ready: "Tudo pronto para buscar a sua melhor performance!" },
  { id: "groups", label: "Gerenciar grupos de exercícios", prepStep: "Preparando as ferramentas de grupo", ready: "Tudo pronto para colocar seus grupos para treinar!" },
  { id: "new", label: "Estou tentando algo novo", prepStep: "Separando desafios para começar leve", ready: "Tudo pronto para começar algo novo, no seu ritmo!" },
]

export const goalById = (id: GoalId | null) => GOALS.find((goal) => goal.id === id) ?? null

/** Sets the CSS colour variables for a rat on any element. */
export const themeStyle = (kind: RatKind) =>
  ({ "--rat": THEMES[kind].rat, "--rat-bg": THEMES[kind].bg, "--on-rat": THEMES[kind].onRat, "--rat-title": THEMES[kind].title }) as CSSProperties
