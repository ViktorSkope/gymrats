/**
 * Inside the desktop phone frame, dragging with the mouse scrolls the page the way
 * a thumb would, including a flick that keeps going. Carousels and the swipe deck
 * already handle mouse drags themselves; this covers ordinary scrolling areas.
 */

const THRESHOLD = 6
const FRICTION = 0.95 // Per 16 ms frame.
const MAX_SPEED = 3 // px per ms. A hard flick glides about a screen further.
const SKIP = "input, textarea, select, [contenteditable], [role='slider']"

type Axis = "x" | "y"

function canScroll(element: Element, axis: Axis) {
  const style = getComputedStyle(element)
  const overflow = axis === "y" ? style.overflowY : style.overflowX
  const isRoot = element === document.scrollingElement
  if (!isRoot && overflow !== "auto" && overflow !== "scroll") return false
  if (isRoot && (overflow === "hidden" || getComputedStyle(document.body).overflowY === "hidden")) return false
  return axis === "y" ? element.scrollHeight > element.clientHeight : element.scrollWidth > element.clientWidth
}

function scrollerFor(target: Element, axis: Axis): Element | null {
  for (let element: Element | null = target; element; element = element.parentElement) {
    if (canScroll(element, axis)) return element
  }
  const root = document.scrollingElement
  return root && canScroll(root, axis) ? root : null
}

export function installDragScroll() {
  let momentum = 0
  let endGlide = () => {}

  window.addEventListener("dragstart", (event) => event.preventDefault())

  window.addEventListener("pointerdown", (down) => {
    if (down.pointerType !== "mouse" || down.button !== 0) return
    cancelAnimationFrame(momentum)
    endGlide()
    const target = down.target as Element
    if (target.closest(SKIP)) return

    let axis: Axis | null = null
    let scroller: Element | null = null
    let snapType = ""
    let behavior = ""
    let last = { x: down.clientX, y: down.clientY, t: down.timeStamp }
    let velocity = 0 // px per ms along the axis, in scroll direction.

    const move = (event: PointerEvent) => {
      // A swipe card (or sticker picker) has the gesture: don't scroll under it.
      if ("scrollLock" in document.documentElement.dataset) return stop()
      if (!axis) {
        const dx = event.clientX - down.clientX
        const dy = event.clientY - down.clientY
        if (Math.hypot(dx, dy) < THRESHOLD) return
        axis = Math.abs(dy) >= Math.abs(dx) ? "y" : "x"
        scroller = scrollerFor(target, axis)
        if (!scroller) return stop()
        // Snapping would fight every step of the drag, so it waits until release.
        // Smooth scrolling would ease every step behind the pointer.
        const element = scroller as HTMLElement
        snapType = element.style.scrollSnapType
        behavior = element.style.scrollBehavior
        element.style.scrollSnapType = "none"
        element.style.scrollBehavior = "auto"
        document.documentElement.style.userSelect = "none"
        window.getSelection()?.removeAllRanges()
      }
      const delta = axis === "y" ? last.y - event.clientY : last.x - event.clientX
      if (axis === "y") scroller!.scrollTop += delta
      else scroller!.scrollLeft += delta
      const elapsed = Math.max(event.timeStamp - last.t, 1)
      velocity = 0.8 * (delta / elapsed) + 0.2 * velocity
      last = { x: event.clientX, y: event.clientY, t: event.timeStamp }
    }

    const up = (event: PointerEvent) => {
      stop()
      if (!axis || !scroller) return
      // A drag is not a click on whatever the pointer was released over.
      const swallow = (click: MouseEvent) => {
        click.stopPropagation()
        click.preventDefault()
      }
      window.addEventListener("click", swallow, { capture: true, once: true })
      // The click fires right after pointerup, if at all. Never eat a later one.
      setTimeout(() => window.removeEventListener("click", swallow, { capture: true }), 0)

      const element = scroller as HTMLElement
      if (event.timeStamp - last.t > 80) velocity = 0 // Held still before letting go.
      velocity = Math.max(-MAX_SPEED, Math.min(MAX_SPEED, velocity))
      element.style.scrollSnapType = snapType
      element.style.scrollBehavior = behavior
      if (getComputedStyle(element).scrollSnapType !== "none") {
        // Let the browser pick the snap point nearest to where the flick would land.
        const key = axis === "y" ? "top" : "left"
        const current = axis === "y" ? element.scrollTop : element.scrollLeft
        element.scrollTo({ [key]: current + velocity * 250, behavior: "smooth" })
        return
      }
      glide(element, axis, velocity)
    }

    const glide = (element: HTMLElement, along: Axis, speed: number) => {
      let previous = performance.now()
      const resting = element.style.scrollBehavior
      element.style.scrollBehavior = "auto"
      endGlide = () => {
        element.style.scrollBehavior = resting
        endGlide = () => {}
      }
      const step = (now: number) => {
        const frames = (now - previous) / 16
        previous = now
        speed *= FRICTION ** frames
        if (Math.abs(speed) < 0.02) {
          endGlide()
          return
        }
        if (along === "y") element.scrollTop += speed * 16 * frames
        else element.scrollLeft += speed * 16 * frames
        momentum = requestAnimationFrame(step)
      }
      momentum = requestAnimationFrame(step)
    }

    const stop = () => {
      window.removeEventListener("pointermove", move)
      window.removeEventListener("pointerup", up)
      window.removeEventListener("pointercancel", stop)
      document.documentElement.style.userSelect = ""
    }

    window.addEventListener("pointermove", move)
    window.addEventListener("pointerup", up)
    window.addEventListener("pointercancel", stop)
  })
}
