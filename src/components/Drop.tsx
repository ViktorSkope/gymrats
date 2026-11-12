/** A sweat drop on a 40 x 60 box. Scale it with width and height. */
export const DROP_PATH = "M20 0C24 9 40 27 40 40C40 51 31 60 20 60C9 60 0 51 0 40C0 27 16 9 20 0Z"

export function Drop({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 60" className={className} aria-hidden="true">
      <path d={DROP_PATH} fill="currentColor" />
    </svg>
  )
}
