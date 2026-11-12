import { animate, motion, useMotionValue } from "motion/react"
import { useEffect, useLayoutEffect, useRef, useState } from "react"

import { RankRow } from "@/components/groups/RankRow"
import type { Standing } from "@/components/groups/groups"

const ROW = 48
const GAP = 6
const STEP = ROW + GAP

/**
 * The ranking as a reel. Your row stays pinned at the bottom of the card while
 * everyone else scrolls past behind it, from last place up to your spot. When the
 * scroll stops, the rows there part and your row moves up into the gap.
 */
export function RankingReel({ standings, unit, onDone }: { standings: Standing[]; unit: string; /** Called once your row has settled into place. */ onDone?: () => void }) {
  const ref = useRef<HTMLDivElement>(null)
  const [height, setHeight] = useState(0)
  const [landed, setLanded] = useState(false)
  const list = useMotionValue(0)
  const mineY = useMotionValue(0)
  const mine = standings.findIndex((s) => s.me)
  const me = standings[mine]
  const count = standings.length
  const done = useRef(onDone)
  useEffect(() => {
    done.current = onDone
  })

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new ResizeObserver(() => setHeight(el.clientHeight))
    observer.observe(el)
    setHeight(el.clientHeight)
    return () => observer.disconnect()
  }, [])

  const measured = height > 0
  useEffect(() => {
    if (!measured) return
    const view = ref.current!.clientHeight
    // A list can't scroll past its own ends.
    const fit = (value: number, length: number) => Math.min(0, Math.max(view - length, value))
    const without = (count - 1) * STEP
    const withMe = count * STEP
    const bottom = fit(view - without - ROW, without + ROW)
    const target = fit(-(mine * STEP) + (view - ROW) / 2, withMe)
    list.set(bottom)
    mineY.set(view - ROW)

    let alive = true
    const distance = Math.abs(target - bottom)
    const scroll = animate(list, target, { duration: distance ? Math.min(1.8, 0.5 + distance / 700) : 0.01, ease: [0.3, 0, 0.2, 1], delay: 0.45 })
    let settle: ReturnType<typeof animate> | undefined
    scroll.then(() => {
      if (!alive) return
      setLanded(true)
      settle = animate(mineY, target + mine * STEP, { type: "spring", stiffness: 300, damping: 30 })
      settle.then(() => alive && done.current?.())
    })
    return () => {
      alive = false
      scroll.stop()
      settle?.stop()
    }
  }, [measured]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div ref={ref} className="relative min-h-0 flex-1 overflow-hidden">
      <motion.ol className="absolute inset-x-0 top-0" style={{ y: list }} aria-label="Classificação">
        {standings.map((s) =>
          s.me ? (
            // Your place: closed while the reel runs, then it opens for your row.
            <motion.li key={s.id} aria-hidden="true" initial={false} animate={{ height: landed ? ROW : 0, marginBottom: landed ? GAP : 0 }} transition={{ type: "spring", stiffness: 300, damping: 30 }} />
          ) : (
            <RankRow key={s.id} standing={s} unit={unit} tone="color" index={0} className="mb-[6px] h-12!" />
          ),
        )}
      </motion.ol>
      {/* Your row, pinned over the reel, then carried into your place. */}
      <motion.div className="absolute inset-x-0 top-0 z-10" style={{ y: mineY }}>
        <RankRow standing={me} unit={unit} tone="color" index={0} element="div" className={`h-12! transition-shadow duration-300 ${landed ? "shadow-[0_6px_18px_rgb(0_0_0/0.16)]" : "shadow-[0_-8px_24px_rgb(0_0_0/0.22)]"}`} />
      </motion.div>
    </div>
  )
}
