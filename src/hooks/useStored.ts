import { useEffect, useState } from "react"

/** State that survives a reload (per tab), so any step or screen can be opened directly. */
export function useStored<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const saved = sessionStorage.getItem(`gymrats.${key}`)
      return saved ? (JSON.parse(saved) as T) : initial
    } catch {
      return initial
    }
  })
  useEffect(() => {
    try {
      sessionStorage.setItem(`gymrats.${key}`, JSON.stringify(value))
    } catch {
      // Private mode or a full quota can block storage. The app still works without it.
    }
  }, [key, value])
  return [value, setValue] as const
}
