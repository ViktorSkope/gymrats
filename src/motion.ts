import type { Transition } from "motion/react"

/**
 * Motion rules for the whole app. Use these instead of one-off numbers.
 * - Popups ease in and out.
 * - Dropdowns take 200 ms.
 * - List rows stagger by 30 ms.
 * - Buttons scale to 0.97 on press.
 * - Details settle in one after another, like notifications.
 * - Popovers start at 0.95 and grow out of their trigger, then shrink back into it.
 * - Exits are 20% shorter than openings.
 * - Shared objects keep the same layoutId across screens.
 */
export const EASE_IN_OUT = [0.42, 0, 0.58, 1] as const
export const OPEN = 0.24
export const CLOSE = OPEN * 0.8
export const DROPDOWN = 0.2
export const DROPDOWN_CLOSE = DROPDOWN * 0.8
export const STAGGER = 0.03
export const PRESS = { scale: 0.97 }
export const POPOVER_FROM = 0.95

export const open = (delay = 0): Transition => ({ duration: OPEN, ease: EASE_IN_OUT, delay })
export const close: Transition = { duration: CLOSE, ease: EASE_IN_OUT }

/** A detail settling into place, like a notification arriving. Pass its index to stagger. */
export const settle = (index = 0, after = 0) => ({
  initial: { opacity: 0, y: 12, scale: 0.98 },
  animate: { opacity: 1, y: 0, scale: 1 },
  transition: { type: "spring", stiffness: 420, damping: 30, delay: after + index * STAGGER } as Transition,
})

/** Popover props: grows from its trigger (set transformOrigin toward it) and shrinks back. */
export const popover = {
  initial: { opacity: 0, scale: POPOVER_FROM },
  animate: { opacity: 1, scale: 1, transition: { duration: DROPDOWN, ease: EASE_IN_OUT } },
  exit: { opacity: 0, scale: POPOVER_FROM, transition: { duration: DROPDOWN_CLOSE, ease: EASE_IN_OUT } },
}

/** Bottom sheets travel further than popups, so they get a little longer. */
export const SHEET_OPEN = 0.3
export const sheet = {
  initial: { y: "100%" },
  animate: { y: 0, transition: { duration: SHEET_OPEN, ease: EASE_IN_OUT } },
  exit: { y: "100%", transition: { duration: SHEET_OPEN * 0.8, ease: EASE_IN_OUT } },
}

/** layoutIds for objects that persist between screens. */
export const SHARED = {
  primaryAction: "primary-action",
  goalFill: "goal-fill",
  activeTab: "active-tab",
  groupType: "group-type",
  /** A group's cover, carried from its card in the list into its page. */
  cover: (id: string) => `cover-${id}`,
} as const
