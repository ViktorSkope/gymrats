import { motion } from "motion/react"

const TOP = "M96.0158 4.5C90.7633 10.0808 86.1016 15.399 60.8895 20.9142C29.3743 27.8081 16.8998 36.6718 23.4653 49.8031C29.7025 62.2779 54.3238 58.995 67.4552 54.7273C80.5865 50.4597 95.031 37.3821 83.2128 27.8081C71.3946 18.2341 51.5408 27.8081 41.0357 39.9546"
const BOTTOM = "M91.0912 63.2636C75.9901 62.1693 39.9447 66.1524 16.5709 90.8393C-12.6463 121.698 27.0059 148.276 72.7081 123.668C102.583 107.582 105.864 82.3039 80.258 81.3191C59.7731 80.5312 43.5526 96.5295 36.1115 105.94"

const STROKE = { stroke: "currentColor", strokeWidth: 13.1313, fill: "none" }

/** The gymrats "g". With draw, it writes itself in like a pen stroke. */
export function LogoMark({ draw = false, className }: { draw?: boolean; className?: string }) {
  return (
    <svg viewBox="0 0 105 140" className={className} aria-hidden="true">
      {draw ? (
        <>
          <motion.path d={TOP} {...STROKE} initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.55, ease: "easeInOut", delay: 0.15 }} />
          <motion.path d={BOTTOM} {...STROKE} initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.6, ease: "easeInOut", delay: 0.65 }} />
        </>
      ) : (
        <>
          <path d={TOP} {...STROKE} />
          <path d={BOTTOM} {...STROKE} />
        </>
      )}
    </svg>
  )
}

/** "gymrats" set in type, with the logo standing in for the g. */
export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={className} role="img" aria-label="gymrats">
      <LogoMark className="mr-[0.03em] inline-block h-[1.15em] w-auto translate-y-[0.24em] align-baseline" />
      <span aria-hidden="true">ymrats</span>
    </span>
  )
}
