import { motion, useAnimate } from "motion/react"
import { useEffect } from "react"

import { THEMES, type RatKind } from "@/theme"
import { Eyes, type EyeSpec, type Look } from "./Eyes"

/**
 * The four rats, drawn on an 804 x 642 canvas whose bottom edge sits on the sheet.
 * Each body runs past the bottom, so the sheet hides where it ends.
 */
const BODY: Record<RatKind, string> = {
  red: "M152 680V500C90 455 20 400 20 340C20 260 110 200 180 202C200 203 210 210 220 220C245 248 265 300 283 354H522C540 305 565 240 600 210C610 202 620 198 635 198C710 200 788 260 788 340C788 400 720 455 670 490V680Z",
  blue: "M176 680C186 575 205 505 228 465C170 420 138 380 138 330C138 280 200 238 260 236C285 236 300 250 312 270C325 295 335 325 345 356L367 350C352 310 345 270 352 245C365 200 420 186 470 188C500 189 525 200 535 215C548 240 545 300 538 356C640 385 705 440 705 508C705 570 650 620 580 680Z",
  yellow: "M106 680L70 530C45 470 30 400 40 360C55 310 110 288 165 288C210 288 255 300 270 320C280 335 284 360 284 382H522C522 350 528 325 540 310C560 290 600 280 640 280C700 280 760 315 768 375C775 430 755 490 730 538L682 680Z",
  green: "M182 680V448C120 400 65 350 65 298C65 220 160 160 230 162C250 163 262 172 272 185C295 215 312 275 326 328H500C515 275 540 215 570 185C582 170 595 160 615 160C690 160 766 225 766 296C766 350 700 410 635 450V680Z",
}

const RAT_EYES: Record<RatKind, EyeSpec> = {
  red: { style: "pupil", left: [345, 502], right: [475, 502], r: 53, pupil: 40, rest: { x: -1, y: 0 } },
  blue: { style: "ring", left: [335, 473], right: [474, 473], r: 57, pupil: 44, rest: { x: 0, y: 0 } },
  yellow: { style: "dot", left: [337, 522], right: [455, 522], r: 25, pupil: 25, rest: { x: 0, y: 0 } },
  green: { style: "pupil", left: [318, 517], right: [494, 517], r: 72, pupil: 54, rest: { x: 1, y: 0 } },
}

type Props = {
  kind: RatKind
  look?: Look
  closed?: boolean
  /** Change this number to make the rat hop. */
  hop?: number
  /** Body colour override, any CSS colour (e.g. a darker shade on a same-coloured cover). */
  color?: string
  className?: string
}

export function Rat({ kind, look, closed, hop = 0, color, className }: Props) {
  const [scope, animate] = useAnimate<SVGGElement>()

  useEffect(() => {
    if (!hop || !scope.current) return
    animate(scope.current, { y: [0, -34, 0, -10, 0], scaleY: [1, 1.05, 0.96, 1.02, 1] }, { duration: 0.7, ease: "easeOut" })
  }, [hop, animate, scope])

  return (
    <svg viewBox="0 0 804 642" className={className} aria-hidden="true" overflow="visible">
      <g ref={scope} style={{ transformBox: "fill-box", transformOrigin: "50% 100%" }}>
        {/* Breathing: a slow rise and fall from the bottom edge. */}
        <motion.g
          style={{ transformBox: "fill-box", transformOrigin: "50% 100%" }}
          animate={{ scaleY: [1, 1.018, 1], scaleX: [1, 0.995, 1] }}
          transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
        >
          <path d={BODY[kind]} style={{ fill: color ?? THEMES[kind].rat }} />
          <Eyes spec={RAT_EYES[kind]} look={look} closed={closed} />
        </motion.g>
      </g>
    </svg>
  )
}
