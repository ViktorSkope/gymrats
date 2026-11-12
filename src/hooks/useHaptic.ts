/** A tiny tap on Android. iOS Safari ignores it, which is fine. */
export const haptic = (ms = 8) => {
  try {
    navigator.vibrate?.(ms)
  } catch {
    // Some browsers throw when vibration is blocked.
  }
}
