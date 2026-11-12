import { CheckIcon } from "lucide-react"
import { AnimatePresence, motion } from "motion/react"
import { useEffect, useState } from "react"

import { Eyes, type EyeSpec } from "@/components/rats/Eyes"
import { haptic } from "@/hooks/useHaptic"
import { PRESS, close, open, settle } from "@/motion"
import { themeStyle } from "@/theme"
import { PrimaryButton } from "./SheetScreen"

export type Plan = "monthly" | "yearly"

const FEATURES = [
  { title: "Compita com mais grupos", detail: "Entre em grupos ilimitados e descubra a sua posição nos rankings" },
  { title: "Customize o seu Gymrat", detail: "Com acessórios exclusivos e de tempo limitado" },
  { title: "Sem anúncios", detail: "Sem interrupções durante o seu check⁠-⁠in" },
]

const PLANS: { id: Plan; name: string; price: string; lines: string[]; note: string; badge?: string }[] = [
  { id: "monthly", name: "Mensal", price: "R$ 17,99/mês", lines: ["Cancele quando", "quiser"], note: "Cobrado mensalmente" },
  { id: "yearly", name: "Anual", price: "R$ 144,90/ano", lines: [], note: "R$ 12,07/mês", badge: "33% OFF" },
]

const GOLD = "linear-gradient(135deg, #F7D774 0%, #E2A93B 45%, #FCE7A6 60%, #C98A1E 100%)"
const ICON_EYES: EyeSpec = { style: "pupil", left: [40, 46], right: [64, 46], r: 9.5, pupil: 7, rest: { x: 0.2, y: 0.1 } }

/** The app icon, alive: the red block with the rat's eyes, wearing a gold PRO tag that catches the light. */
function ProMark() {
  return (
    <motion.div className="relative size-[58px]" initial={{ scale: 0.6, opacity: 0, rotate: -8 }} animate={{ scale: 1, opacity: 1, rotate: 0 }} transition={{ type: "spring", stiffness: 380, damping: 20, delay: 0.1 }}>
      <svg viewBox="0 0 104 104" className="size-full drop-shadow-[0_10px_18px_rgb(211_58_44/0.35)]" aria-hidden="true">
        <rect width="104" height="104" rx="28" fill="#D23A2C" />
        <Eyes spec={ICON_EYES} />
      </svg>
      <motion.span
        className="absolute -right-3 -bottom-2 overflow-hidden rounded-full px-2 py-[2px] text-[11px] font-bold tracking-[0.08em] text-[#4A2E05] shadow-[0_4px_10px_rgb(201_138_30/0.45)]"
        style={{ background: GOLD }}
        initial={{ scale: 0, rotate: 12 }}
        animate={{ scale: 1, rotate: -6 }}
        transition={{ type: "spring", stiffness: 500, damping: 18, delay: 0.45 }}
      >
        PRO
        {/* A glint sweeps across the gold every few seconds. */}
        <motion.span
          className="absolute inset-y-0 -left-full w-full bg-[linear-gradient(100deg,transparent_20%,rgb(255_255_255/0.85)_50%,transparent_80%)]"
          animate={{ x: ["0%", "300%"] }}
          transition={{ duration: 0.9, ease: "easeInOut", repeat: Infinity, repeatDelay: 2.6, delay: 1 }}
        />
      </motion.span>
    </motion.div>
  )
}

function Tick({ index }: { index: number }) {
  return (
    <svg viewBox="0 0 24 24" className="mt-[3px] size-[22px] shrink-0" aria-hidden="true">
      <motion.path
        d="M3.5 12.5l5.5 5.5L21 6"
        fill="none"
        stroke="var(--color-check)"
        strokeWidth="3.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.35, ease: "easeOut", delay: 0.45 + index * 0.12 }}
      />
    </svg>
  )
}

/**
 * Gymrats Pro, offered once right after sign-up. Premium comes from restraint:
 * lots of white, one gold accent, the yearly plan chosen for you, and a
 * purchase that resolves into a check instead of a jump cut. Skipping is
 * always one clear tap away.
 */
export function Paywall({ onDone }: { onDone: (plan: Plan | null) => void }) {
  const [plan, setPlan] = useState<Plan>("yearly")
  const [state, setState] = useState<"idle" | "buying" | "done">("idle")

  useEffect(() => {
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", "#1D1D1D")
  }, [])

  const choose = (id: Plan) => {
    if (state !== "idle") return
    haptic()
    setPlan(id)
  }

  // No store yet: a short wait stands in for the purchase sheet, then a check.
  const buy = () => {
    if (state !== "idle") return
    haptic(15)
    setState("buying")
    window.setTimeout(() => {
      haptic(30)
      setState("done")
      window.setTimeout(() => onDone(plan), 900)
    }, 1100)
  }


  return (
    <motion.div
      className="absolute inset-0 overflow-hidden bg-ink"
      style={themeStyle("red")}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, transition: open() }}
      exit={{ opacity: 0, transition: close }}
    >
      {/* A warm glow behind the header, the only colour outside the cards. */}
      {/* The offer sits on a light card over the dark app, like a sheet pulled up for a moment. */}
      <motion.div
        className="absolute inset-x-[9px] top-[max(14px,calc(env(safe-area-inset-top)+6px))] bottom-[max(7px,env(safe-area-inset-bottom))] flex flex-col overflow-hidden rounded-[30px] bg-paper"
        initial={{ y: 60 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 32 }}
      >

      <div className="relative min-h-0 flex-1 overflow-y-auto px-[32px] pt-[clamp(16px,3dvh,40px)] pb-4">
        <ProMark />

        <motion.h1 className="mt-[clamp(14px,2.5dvh,24px)] text-[clamp(22px,6.7vw,27px)] leading-[1.1] whitespace-nowrap font-normal tracking-[-0.025em]" {...settle(0, 0.15)}>
          Experimente Gymrats Pro
        </motion.h1>
        <motion.p className="mt-1 text-[17px] text-ink/80" {...settle(1, 0.15)}>
          Mais controle, mais personalização
        </motion.p>

        <ul className="mt-[clamp(14px,3dvh,32px)] space-y-2.5">
          {FEATURES.map((feature, index) => (
            <motion.li key={feature.title} className="flex gap-3" {...settle(index + 2, 0.15)}>
              <Tick index={index} />
              <span>
                <span className="block text-[17px] font-semibold tracking-[-0.01em]">{feature.title}</span>
                <span className="block text-[15px] leading-[1.3] text-ink/55">{feature.detail}</span>
              </span>
            </motion.li>
          ))}
        </ul>

        <div role="radiogroup" aria-label="Plano" className="mt-[clamp(16px,3dvh,36px)] -mx-[4px] grid grid-cols-2 gap-2.5">
          {PLANS.map((option, index) => {
            const selected = option.id === plan
            return (
              <motion.button
                key={option.id}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => choose(option.id)}
                className="relative flex min-h-[124px] flex-col items-start rounded-[20px] bg-[#EDEBEE] p-4 text-left outline-none focus-visible:ring-3 focus-visible:ring-ink/25"
                {...settle(index + 5, 0.15)}
                whileTap={PRESS}
              >
                {/* One outline that moves to the chosen plan. */}
                {selected && <motion.span layoutId="plan-ring" className="pointer-events-none absolute -inset-px rounded-[20px] border-2 border-rat" transition={{ type: "spring", stiffness: 500, damping: 38 }} />}
                <span className="text-[26px] leading-none font-semibold tracking-[-0.02em]">{option.name}</span>
                <span className="mt-2.5 text-[15px] leading-snug">{option.price}.</span>
                {option.lines.length > 0 && <span className="text-[15px] leading-snug">{option.lines.join(" ")}</span>}
                <span className="mt-auto pt-3 text-[14px] leading-snug text-ink/55">{option.note}</span>
                {option.badge && <span className="mt-2.5 w-full rounded-full bg-ink py-1.5 text-center text-[15px] font-medium text-white">{option.badge}</span>}
              </motion.button>
            )
          })}
        </div>
      </div>

      <motion.div className="relative shrink-0 px-[32px] pt-2 pb-3" {...settle(7, 0.15)}>
        <PrimaryButton onClick={buy} className="relative overflow-hidden">
          <AnimatePresence mode="popLayout" initial={false}>
            {state === "idle" && (
              <motion.span key="idle" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8, transition: close }} transition={open()}>
                Continuar com o Pro
              </motion.span>
            )}
            {state === "buying" && (
              <motion.svg key="buying" viewBox="0 0 24 24" className="size-6 animate-spin [animation-duration:800ms]" initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.6, transition: close }} aria-label="Processando">
                <circle cx="12" cy="12" r="9" fill="none" stroke="rgb(255 255 255/0.35)" strokeWidth="2.5" />
                <circle cx="12" cy="12" r="9" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeDasharray="20 100" />
              </motion.svg>
            )}
            {state === "done" && (
              <motion.span key="done" className="flex items-center gap-2" initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: "spring", stiffness: 500, damping: 22 }}>
                <CheckIcon className="size-5" strokeWidth={3} />
                Você é Pro!
              </motion.span>
            )}
          </AnimatePresence>
          {/* A slow sheen, so the button feels lit rather than flat. */}
          {state === "idle" && (
            <motion.span
              aria-hidden="true"
              className="pointer-events-none absolute inset-y-0 -left-1/2 w-1/2 bg-[linear-gradient(100deg,transparent,rgb(255_255_255/0.28),transparent)]"
              animate={{ x: ["0%", "400%"] }}
              transition={{ duration: 1.2, ease: "easeInOut", repeat: Infinity, repeatDelay: 3.2, delay: 1.4 }}
            />
          )}
        </PrimaryButton>
        <p className="mt-1.5 text-center text-[12px] text-ink/45">
          Renova automaticamente. Cancele quando quiser.
        </p>
        <motion.button
          type="button"
          onClick={() => state === "idle" && onDone(null)}
          className="mt-2 h-12 w-full rounded-[20px] bg-[#EAE8EB] text-[17px] font-medium"
          whileTap={PRESS}
        >
          Pular por enquanto
        </motion.button>
        <button type="button" className="mx-auto mt-1 block py-1.5 text-[15px] text-rat underline decoration-1 underline-offset-4">
          Ajuda com a compra
        </button>
      </motion.div>
      </motion.div>
    </motion.div>
  )
}
