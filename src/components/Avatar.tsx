import { useState } from "react"

import { initials } from "@/components/groups/groups"
import { useStored } from "@/hooks/useStored"
import { PLAIN } from "@/components/rats/paths"

/** Your rat's face on a light disc: your picture until you add a photo. */
export function RatFace() {
  return (
    <svg viewBox="70 230 600 600" className="size-full" aria-hidden="true">
      <rect x="70" y="230" width="600" height="600" fill="#F7F5F8" />
      <path d={PLAIN.body} fill="#D23A2C" fillRule="evenodd" />
      {[286.5, 449.7].map((cx) => (
        <g key={cx}>
          <circle cx={cx} cy={397} r={62} fill="#fff" />
          <circle cx={cx} cy={397} r={44} fill="#1D1D1D" />
        </g>
      ))}
    </svg>
  )
}

/** Your photo if you added one, otherwise your rat. Fills its container. */
export function MyFace() {
  const [photo] = useStored<string | null>("photo", null)
  const [broken, setBroken] = useState(false)
  return photo && !broken ? <img src={photo} alt="" className="size-full object-cover" draggable={false} onError={() => setBroken(true)} /> : <RatFace />
}

/**
 * A person's round picture: their photo, their initials if the photo fails, or your own
 * face when it's you. `className` sets the size.
 */
export function PersonAvatar({ name, photo, me = false, className = "size-9" }: { name: string; photo?: string; me?: boolean; className?: string }) {
  const [broken, setBroken] = useState(false)
  return (
    <span className={`flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#E6E4E7] text-[13px] font-semibold text-ink ${className}`}>
      {me ? (
        <MyFace />
      ) : photo && !broken ? (
        <img src={photo} alt="" className="size-full object-cover" loading="lazy" draggable={false} onError={() => setBroken(true)} />
      ) : (
        initials(name)
      )}
    </span>
  )
}
