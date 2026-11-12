import { useEffect, useState } from "react"

/** Light text on dark screens, dark text on light ones, read from the screen's theme colour. */
function useOnDark() {
  const [dark, setDark] = useState(true)
  useEffect(() => {
    const meta = document.querySelector('meta[name="theme-color"]')
    if (!meta) return
    const read = () => {
      const hex = (meta.getAttribute("content") ?? "#000").replace("#", "")
      const [r, g, b] = [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
      setDark(0.2126 * r + 0.7152 * g + 0.0722 * b < 0.6)
    }
    read()
    const observer = new MutationObserver(read)
    observer.observe(meta, { attributes: true, attributeFilter: ["content"] })
    return () => observer.disconnect()
  }, [])
  return dark
}

/**
 * Only in the desktop phone frame: an iPhone status bar (time, signal, Wi-Fi,
 * battery, Dynamic Island) and home indicator over the app, so the mockup reads
 * like the real thing. The app leaves room for both through --sat and --sab.
 */
export function StatusBar() {
  const onDark = useOnDark()
  const ink = onDark ? "#FFFFFF" : "#000000"
  return (
    <>
      <div className="pointer-events-none fixed inset-x-0 top-0 z-[100] flex h-[50px] items-center justify-between px-[30px] pt-1 transition-colors duration-300" style={{ color: ink }} aria-hidden="true">
        <span className="w-[54px] text-center text-[16px] font-semibold tracking-[-0.01em]">9:41</span>
        <span className="absolute top-[11px] left-1/2 h-[34px] w-[122px] -translate-x-1/2 rounded-full bg-black" />
        <span className="flex items-center gap-[6px]">
          <svg viewBox="0 0 18 12" className="h-[11px] w-[17px]" fill="currentColor">
            <rect x="0" y="8" width="3" height="4" rx="0.8" />
            <rect x="5" y="5.5" width="3" height="6.5" rx="0.8" />
            <rect x="10" y="3" width="3" height="9" rx="0.8" />
            <rect x="15" y="0" width="3" height="12" rx="0.8" />
          </svg>
          <svg viewBox="0 0 16 12" className="h-[11px] w-[15px]" fill="currentColor">
            <path d="M8 2.6c2.3 0 4.4.9 6 2.4l1.2-1.3A10.4 10.4 0 0 0 8 .8 10.4 10.4 0 0 0 .8 3.7L2 5c1.6-1.5 3.7-2.4 6-2.4Zm0 3.6c1.3 0 2.5.5 3.4 1.3l1.2-1.3A6.7 6.7 0 0 0 8 4.4c-1.8 0-3.4.7-4.6 1.8l1.2 1.3c.9-.8 2.1-1.3 3.4-1.3Zm0 3.6c-.5 0-1 .2-1.3.5L8 11.6l1.3-1.3c-.3-.3-.8-.5-1.3-.5Z" />
          </svg>
          <svg viewBox="0 0 27 13" className="h-[12px] w-[25px]">
            <rect x="0.5" y="0.5" width="22" height="12" rx="3.8" fill="none" stroke="currentColor" strokeOpacity="0.4" />
            <rect x="2" y="2" width="19" height="9" rx="2.5" fill="currentColor" />
            <path d="M24 4.5v4c.8-.3 1.4-1.1 1.4-2s-.6-1.7-1.4-2Z" fill="currentColor" fillOpacity="0.45" />
          </svg>
        </span>
      </div>
      <div className="pointer-events-none fixed bottom-[8px] left-1/2 z-[100] h-[5px] w-[134px] -translate-x-1/2 rounded-full transition-colors duration-300" style={{ backgroundColor: ink }} aria-hidden="true" />
    </>
  )
}
