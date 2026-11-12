import { motion, useAnimate } from "motion/react"
import { useEffect, useRef, useState, type ReactNode } from "react"

import { DROP_PATH } from "@/components/Drop"
import { Wordmark } from "@/components/Logo"
import { Eyes, type EyeSpec, type Look } from "@/components/rats/Eyes"
import { PLAIN } from "@/components/rats/paths"
import { haptic } from "@/hooks/useHaptic"
import { CLOSE, EASE_IN_OUT, PRESS, close, open, settle } from "@/motion"

const RED = "#D33A2C"
const EYES: EyeSpec = { style: "pupil", left: [286.5, 399], right: [449.7, 395], r: 66, pupil: 50, rest: { x: 0, y: 0 } }

// Drops bead on the head, grow, run down and fade. Coordinates are the illustration's own.
const SWEAT = [
  { x: 560, y: 300, size: 40, delay: 0.9, every: 0.8 },
  { x: 168, y: 470, size: 30, delay: 1.8, every: 1.4 },
  { x: 610, y: 452, size: 26, delay: 2.8, every: 2.2 },
]

function SweatDrop({ x, y, size, delay, every }: (typeof SWEAT)[number]) {
  return (
    <g transform={`translate(${x} ${y}) scale(${size / 40})`}>
      <motion.path
        d={DROP_PATH}
        fill="var(--color-sweat)"
        style={{ transformBox: "fill-box", transformOrigin: "50% 0%" }}
        initial={{ scale: 0, y: 0, opacity: 0 }}
        animate={{ scale: [0, 1, 1, 0.9], y: [0, 0, 55, 95], opacity: [0, 1, 1, 0] }}
        transition={{ duration: 2.3, times: [0, 0.3, 0.75, 1], ease: "easeIn", delay, repeat: Infinity, repeatDelay: every }}
      />
    </g>
  )
}

/**
 * The big red rat that grows out of the card. It breathes hard, sweats, follows
 * your finger with its eyes and squishes when poked.
 */
function LoginRat() {
  const ref = useRef<SVGSVGElement>(null)
  const [scope, animate] = useAnimate<SVGGElement>()
  const [look, setLook] = useState<Look>()
  const [squint, setSquint] = useState(false)

  // Eyes follow the pointer, then drift back to glancing around once it stops.
  useEffect(() => {
    let idle = 0
    const onMove = (event: PointerEvent) => {
      const box = ref.current?.getBoundingClientRect()
      if (!box) return
      const clamp = (v: number) => Math.max(-1, Math.min(1, v))
      setLook({
        x: clamp((event.clientX - (box.left + box.width * 0.5)) / 160),
        y: clamp((event.clientY - (box.top + box.height * 0.44)) / 160),
      })
      clearTimeout(idle)
      idle = window.setTimeout(() => setLook(undefined), 1800)
    }
    window.addEventListener("pointermove", onMove)
    window.addEventListener("pointerdown", onMove)
    return () => {
      window.removeEventListener("pointermove", onMove)
      window.removeEventListener("pointerdown", onMove)
      clearTimeout(idle)
    }
  }, [])

  const poke = () => {
    haptic(12)
    setSquint(true)
    setTimeout(() => setSquint(false), 260)
    animate(scope.current, { scaleX: [1, 1.06, 0.97, 1.015, 1], scaleY: [1, 0.93, 1.03, 0.99, 1] }, { duration: 0.55, ease: "easeOut" })
  }

  return (
    <motion.svg
      ref={ref}
      viewBox={`0 0 ${PLAIN.w} ${PLAIN.h}`}
      className="relative block h-auto w-[min(97.5%,calc((100dvh-400px)*0.81))] max-w-none -translate-x-[13.9%] overflow-visible"
      aria-hidden="true"
      onTap={poke}
      // Rises out of the card: its bottom half is the same red, so it seems to grow from it.
      initial={{ y: "22%" }}
      animate={{ y: 0 }}
      transition={{ type: "spring", stiffness: 260, damping: 22, delay: 0.2 }}
    >
      <g ref={scope} style={{ transformBox: "fill-box", transformOrigin: "50% 100%" }}>
        {/* Heavy breathing, like right after a set. */}
        <motion.g
          style={{ transformBox: "fill-box", transformOrigin: "50% 100%" }}
          animate={{ scaleY: [1, 1.022, 1], scaleX: [1, 0.993, 1] }}
          transition={{ duration: 1.3, repeat: Infinity, ease: "easeInOut" }}
        >
          <path d={PLAIN.body} fill={RED} fillRule="evenodd" />
          <Eyes spec={EYES} look={look} closed={squint} />
          {SWEAT.map((drop) => (
            <SweatDrop key={drop.x} {...drop} />
          ))}
        </motion.g>
      </g>
    </motion.svg>
  )
}

function AuthButton({ icon, children, onClick, index }: { icon: ReactNode; children: ReactNode; onClick: () => void; index: number }) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      className="relative flex h-[49px] w-full items-center rounded-[22px] bg-ink pl-[96px] text-[16px] font-medium text-white outline-none focus-visible:ring-3 focus-visible:ring-white/70"
      {...settle(index, 0.45)}
      whileTap={PRESS}
    >
      <span className="absolute left-[52px] flex size-6 items-center justify-center">{icon}</span>
      {children}
    </motion.button>
  )
}

const AppleIcon = () => (
  <svg viewBox="0 0 24 24" className="size-[22px] -translate-y-px" fill="#fff" aria-hidden="true">
    <path d="M16.37 1.43c0 1.14-.49 2.27-1.18 3.08-.74.9-1.99 1.57-2.99 1.57-.12 0-.23-.02-.3-.03-.01-.06-.04-.22-.04-.39 0-1.15.57-2.27 1.21-2.98.8-.94 2.14-1.64 3.25-1.68.03.13.05.28.05.43Zm4.56 15.71c-.03.07-.46 1.58-1.52 3.12-.94 1.34-1.94 2.71-3.43 2.71-1.52 0-1.9-.88-3.63-.88-1.7 0-2.3.91-3.67.91-1.38 0-2.33-1.26-3.43-2.8C4.97 18.38 3.93 15.57 3.93 12.92c0-4.28 2.8-6.55 5.55-6.55 1.45 0 2.68.95 3.6.95.87 0 2.22-1.01 3.9-1.01.61 0 2.89.06 4.37 2.19-.13.09-2.38 1.37-2.38 4.19 0 3.26 2.85 4.42 2.96 4.45Z" />
  </svg>
)

const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" className="size-[21px]" aria-hidden="true">
    <path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47a5.54 5.54 0 0 1-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82Z" />
    <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09A12 12 0 0 0 12 24Z" />
    <path fill="#FBBC05" d="M5.27 14.29A7.2 7.2 0 0 1 4.89 12c0-.8.14-1.57.38-2.29V6.62H1.29A12 12 0 0 0 0 12c0 1.94.47 3.76 1.29 5.38l3.98-3.09Z" />
    <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42A11.5 11.5 0 0 0 12 0 12 12 0 0 0 1.29 6.62l3.98 3.09C6.22 6.86 8.87 4.75 12 4.75Z" />
  </svg>
)

const MailIcon = () => (
  <svg viewBox="0 0 24 18" className="w-[23px]" aria-hidden="true">
    <rect width="24" height="18" rx="1" fill="#fff" />
    <path d="M1 1l11 9 11-9M1 17l8.2-7.2M23 17l-8.2-7.2" fill="none" stroke="#1E1E1E" strokeWidth="1.3" />
  </svg>
)

/**
 * Welcome: the red rat grows out of a red card that holds three ways in.
 * For now every way leads to the goal question.
 */
export function Welcome({ onContinue }: { onContinue: () => void }) {
  useEffect(() => {
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", "#FFE8D9")
  }, [])

  return (
    <motion.div
      className="absolute inset-0 flex flex-col overflow-hidden bg-cream"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: close }}
    >
      <div className="min-h-[max(16px,env(safe-area-inset-top))] flex-1" />
      <motion.section
        className="@container relative mx-[3.2%] flex flex-col"
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%", transition: { duration: CLOSE * 1.5, ease: EASE_IN_OUT } }}
        transition={{ type: "spring", stiffness: 260, damping: 30 }}
      >
        <div className="relative">
          {/* The card's top edge starts where the rat's body is widest, so the two read as one shape. */}
          <div className="absolute inset-x-0 top-[77.7%] bottom-0 rounded-tr-[24px] bg-[#D33A2C]" />
          <LoginRat />
        </div>

        <div className="relative flex flex-col items-center bg-[#D33A2C] px-6 pb-[max(24px,env(safe-area-inset-bottom))]">
          <motion.h1
            className="text-center text-[clamp(22px,9.3cqw,34px)] leading-tight font-normal tracking-[-0.02em] whitespace-nowrap text-white"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={open(0.35)}
          >
            Bem-vindo ao <Wordmark className="ml-[0.08em]" />
          </motion.h1>

          <div className="mt-[clamp(24px,7dvh,86px)] flex w-full max-w-[324px] flex-col gap-2">
            <AuthButton index={0} icon={<AppleIcon />} onClick={onContinue}>
              Continuar com Apple
            </AuthButton>
            <AuthButton index={1} icon={<GoogleIcon />} onClick={onContinue}>
              Continuar com Google
            </AuthButton>
            <AuthButton index={2} icon={<MailIcon />} onClick={onContinue}>
              Entrar com email
            </AuthButton>
          </div>

          <motion.button
            type="button"
            onClick={onContinue}
            className="mt-4 py-2 text-[15px] text-white underline decoration-1 underline-offset-[5px]"
            {...settle(3, 0.45)}
            whileTap={PRESS}
          >
            Não consigo acessar minha conta
          </motion.button>
        </div>
      </motion.section>
    </motion.div>
  )
}
