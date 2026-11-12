import { useId } from "react"

import { MUSCLE } from "./paths"

const RED = "#D33A2C"
const DARK = "#A8291E"
const INK = "#1E1E1E"

/** The finish-line rat: half-lidded cool eyes, a big grin and a flexed bicep. Static by design. */
export function MuscleRat({ className }: { className?: string }) {
  const clip = "mouth" + useId().replace(/[^a-zA-Z0-9]/g, "")
  return (
    <svg viewBox={`0 0 ${MUSCLE.w} ${MUSCLE.h}`} className={className} aria-hidden="true">
      <path d={MUSCLE.body} fill={RED} fillRule="evenodd" />
      <path d={MUSCLE.arm} fill={RED} fillRule="evenodd" />
      <path d={MUSCLE.abs} fill={DARK} fillRule="evenodd" />
      <path d="M477 576A96.5 96.5 0 0 0 670 576Z" fill="#fff" />
      <path d="M671 576A96 96 0 0 0 863 576Z" fill="#fff" />
      <path d="M527 576A73 73 0 0 0 673 576Z" fill={INK} />
      <path d="M719 576A73 73 0 0 0 865 576Z" fill={INK} />
      <clipPath id={clip}>
        <path d="M461 707A139 139 0 0 0 739 707Z" />
      </clipPath>
      <path d="M461 707A139 139 0 0 0 739 707Z" fill={INK} />
      <circle cx={600} cy={846} r={78} fill={DARK} clipPath={`url(#${clip})`} />
    </svg>
  )
}
