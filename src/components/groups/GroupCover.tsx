import { motion } from "motion/react"
import { useId, type ReactNode } from "react"

import { DROP_PATH } from "@/components/Drop"
import { Rat } from "@/components/rats/Rat"
import { THEMES } from "@/theme"
import type { Cover } from "./groups"

function PatternFill({ pattern }: { pattern: Cover["pattern"] }) {
  const id = "p" + useId().replace(/[^a-zA-Z0-9]/g, "")
  return (
    <svg className="absolute inset-0 size-full" aria-hidden="true">
      <defs>
        {pattern === "drops" && (
          <pattern id={id} width="56" height="64" patternUnits="userSpaceOnUse">
            <path d={DROP_PATH} transform="translate(8 6) scale(0.42)" fill="#fff" fillOpacity="0.18" />
            <path d={DROP_PATH} transform="translate(36 38) scale(0.3)" fill="#fff" fillOpacity="0.12" />
          </pattern>
        )}
        {pattern === "stripes" && (
          <pattern id={id} width="40" height="40" patternUnits="userSpaceOnUse" patternTransform="rotate(-24)">
            <rect width="40" height="14" fill="#fff" fillOpacity="0.16" />
          </pattern>
        )}
        {pattern === "dots" && (
          <pattern id={id} width="26" height="26" patternUnits="userSpaceOnUse">
            <circle cx="6" cy="6" r="4" fill="#fff" fillOpacity="0.2" />
            <circle cx="19" cy="19" r="2.5" fill="#fff" fillOpacity="0.14" />
          </pattern>
        )}
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id})`} />
    </svg>
  )
}

type Props = {
  cover: Cover
  className?: string
  /** Same id on two covers makes one grow into the other between screens. */
  layoutId?: string
  /** Hide the rat on tiny thumbnails. */
  rat?: boolean
  children?: ReactNode
}

/** A group's banner: a rat peeking over a pattern in its colour, or the group's own photo. */
export function GroupCover({ cover, className = "", layoutId, rat = true, children }: Props) {
  return (
    <motion.div layoutId={layoutId} className={`relative overflow-hidden ${className}`} style={{ backgroundColor: THEMES[cover.kind].rat }}>
      {cover.photo ? (
        <img src={cover.photo} alt="" className="absolute inset-0 size-full object-cover" draggable={false} />
      ) : (
        <>
          <PatternFill pattern={cover.pattern} />
          {rat && (
            <div className="absolute right-[6%] bottom-0 h-[78%]">
              <Rat kind={cover.kind} color={`color-mix(in oklab, ${THEMES[cover.kind].rat}, black 16%)`} className="h-full w-auto" />
            </div>
          )}
        </>
      )}
      {children}
    </motion.div>
  )
}
