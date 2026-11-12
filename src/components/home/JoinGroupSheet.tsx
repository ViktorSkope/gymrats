import { ClipboardIcon, CompassIcon, LoaderCircleIcon, PlusIcon, XIcon } from "lucide-react"
import { AnimatePresence, motion } from "motion/react"
import { useCallback, useEffect, useRef, useState, type FormEvent } from "react"

import { haptic } from "@/hooks/useHaptic"
import { PRESS, close, open, settle, sheet } from "@/motion"

type Props = { open: boolean; onClose: () => void; onCreate: () => void }

/** Pulls the code out of a pasted invite link, or keeps a bare code as is. */
const codeFrom = (value: string) => {
  const trimmed = value.trim()
  const fromLink = trimmed.match(/(?:convite|invite|join)[/=]([A-Za-z0-9-]+)/i)
  return (fromLink ? fromLink[1] : trimmed).toUpperCase()
}

/**
 * Join by invite: one field that takes a link or a code, with paste one tap away.
 * There is no backend yet, so every code comes back as not found.
 */
export function JoinGroupSheet({ open: isOpen, onClose, onCreate }: Props) {
  const [value, setValue] = useState("")
  const [status, setStatus] = useState<"idle" | "checking" | "notFound">("idle")
  const input = useRef<HTMLInputElement>(null)
  const code = codeFrom(value)
  const ready = code.length >= 4

  // Closing clears the last answer, so the sheet opens fresh next time.
  const dismiss = useCallback(() => {
    setStatus("idle")
    onClose()
  }, [onClose])

  useEffect(() => {
    if (!isOpen) return
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && dismiss()
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [isOpen, dismiss])

  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (!ready || status === "checking") return
    setStatus("checking")
    setTimeout(() => {
      haptic(20)
      setStatus("notFound")
    }, 900)
  }

  const paste = async () => {
    try {
      const text = await navigator.clipboard.readText()
      if (text) setValue(text)
    } catch {
      // Clipboard access was refused; the field still works by typing.
    }
    input.current?.focus()
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="absolute inset-0 z-30 flex flex-col justify-end">
          <motion.div className="absolute inset-0 bg-ink/40" initial={{ opacity: 0 }} animate={{ opacity: 1, transition: open() }} exit={{ opacity: 0, transition: close }} onClick={dismiss} />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="join-title"
            className="relative mx-[7px] mb-[max(7px,var(--sab))] rounded-[30px] bg-paper px-5 pt-3 pb-5"
            {...sheet}
            onAnimationComplete={() => input.current?.focus()}
          >
            <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-ink/15" aria-hidden="true" />
            <div className="flex items-start justify-between gap-4">
              <h2 id="join-title" className="text-[24px] leading-tight tracking-[-0.02em]">
                Entrar em um grupo
              </h2>
              <motion.button type="button" aria-label="Fechar" onClick={dismiss} className="-mt-1 -mr-1 flex size-10 shrink-0 items-center justify-center rounded-full bg-[#EDEBEE] text-ink/70" whileTap={PRESS}>
                <XIcon className="size-5" />
              </motion.button>
            </div>
            <p className="mt-1 text-[15px] text-ink/60">Cole o link que seu amigo mandou ou digite o código.</p>

            <form onSubmit={submit} className="mt-5">
              <label htmlFor="invite" className="sr-only">
                Link ou código de convite
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    ref={input}
                    id="invite"
                    value={value}
                    onChange={(event) => {
                      setValue(event.target.value)
                      setStatus("idle")
                    }}
                    placeholder="Link ou código de convite"
                    autoComplete="off"
                    autoCapitalize="characters"
                    spellCheck={false}
                    enterKeyHint="go"
                    aria-invalid={status === "notFound"}
                    aria-describedby="invite-status"
                    className="h-[52px] w-full rounded-[20px] bg-[#EDEBEE] pr-12 pl-4 text-[17px] outline-none transition-shadow placeholder:text-ink/40 focus:ring-2 focus:ring-ink/80 aria-invalid:ring-2 aria-invalid:ring-[#D23A2C]"
                  />
                  {!value && (
                    <button type="button" aria-label="Colar" onClick={paste} className="absolute top-1/2 right-1.5 flex size-10 -translate-y-1/2 items-center justify-center rounded-xl text-ink/55">
                      <ClipboardIcon className="size-5" />
                    </button>
                  )}
                </div>
                <motion.button
                  type="submit"
                  aria-disabled={!ready}
                  className="flex h-[52px] min-w-[96px] items-center justify-center rounded-[20px] bg-rat px-5 text-[17px] font-medium text-on-rat transition-colors aria-disabled:bg-rat/40"
                  whileTap={ready ? PRESS : undefined}
                >
                  {status === "checking" ? <LoaderCircleIcon className="size-5 animate-spin" aria-label="Procurando" /> : "Entrar"}
                </motion.button>
              </div>
              <p id="invite-status" className="mt-2 min-h-5 text-[13px] text-[#C0392B]" aria-live="polite">
                <AnimatePresence>
                  {status === "notFound" && (
                    <motion.span className="block" {...settle()}>
                      Não achamos o grupo {code}. Confira o código com quem te convidou.
                    </motion.span>
                  )}
                </AnimatePresence>
              </p>
            </form>

            <div className="my-4 flex items-center gap-4 text-[15px] text-ink/45">
              <span className="h-px flex-1 bg-ink/10" />
              ou
              <span className="h-px flex-1 bg-ink/10" />
            </div>

            <div className="flex flex-col gap-2">
              <motion.button type="button" onClick={onCreate} className="flex h-12 items-center justify-center gap-2.5 rounded-[20px] bg-ink text-[16px] font-medium text-white" whileTap={PRESS}>
                <PlusIcon className="size-5" />
                Criar um grupo
              </motion.button>
              <motion.button type="button" className="flex h-12 items-center justify-center gap-2.5 rounded-[20px] bg-[#EDEBEE] text-[16px] font-medium" whileTap={PRESS}>
                <CompassIcon className="size-5" />
                Grupos da comunidade
              </motion.button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
