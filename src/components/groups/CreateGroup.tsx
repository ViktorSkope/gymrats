import { CheckIcon, ChevronDownIcon, ImageIcon, MedalIcon, ShuffleIcon, TimerIcon, UsersIcon, XIcon } from "lucide-react"
import { AnimatePresence, motion } from "motion/react"
import { useRef, useState, type ReactNode } from "react"

import { PrimaryButton } from "@/components/onboarding/SheetScreen"
import { haptic } from "@/hooks/useHaptic"
import { PRESS, SHARED, popover, settle } from "@/motion"
import { DURATIONS, GROUP_TYPES, SCORING, makeCode, photoToDataUrl, shuffleCover, type Cover, type Group, type GroupType, type Scoring } from "./groups"
import { GroupCover } from "./GroupCover"

function CoverButton({ icon, children, onClick }: { icon: ReactNode; children: ReactNode; onClick: () => void }) {
  return (
    <motion.button type="button" onClick={onClick} className="flex h-9 items-center gap-1.5 rounded-full bg-ink/55 px-3.5 text-[14px] font-medium text-white backdrop-blur-md" whileTap={PRESS}>
      {icon}
      {children}
    </motion.button>
  )
}

/** The scoring dropdown: grows out of its row and shrinks back into it. */
function ScoringPicker({ value, onChange }: { value: Scoring; onChange: (value: Scoring) => void }) {
  const [open, setOpen] = useState(false)
  const current = SCORING.find((s) => s.id === value)!
  return (
    <div className="relative">
      <motion.button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="flex h-14 w-full items-center gap-3 px-4 text-left"
        whileTap={PRESS}
      >
        <MedalIcon className="size-5 shrink-0 text-ink/70" />
        <span className="flex-1 text-[16px]">Modo de pontuação</span>
        <span className="text-[16px] text-ink/50">{current.label}</span>
        <ChevronDownIcon className={`size-4 text-ink/40 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </motion.button>
      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} aria-hidden="true" />
            <motion.ul
              role="listbox"
              aria-label="Modo de pontuação"
              className="absolute right-3 bottom-[calc(100%-6px)] z-20 w-[260px] origin-bottom-right rounded-2xl border border-ink/8 bg-white p-1.5 shadow-xl shadow-black/10"
              {...popover}
            >
              {SCORING.map((option) => (
                <li key={option.id}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={option.id === value}
                    onClick={() => {
                      haptic()
                      onChange(option.id)
                      setOpen(false)
                    }}
                    className="flex w-full items-start gap-3 rounded-xl px-3 py-2.5 text-left hover:bg-ink/4"
                  >
                    <span className="flex-1">
                      <span className="block text-[15px] font-medium">{option.label}</span>
                      <span className="block text-[13px] text-ink/55">{option.hint}</span>
                    </span>
                    {option.id === value && <CheckIcon className="mt-0.5 size-4 text-rat-title" />}
                  </button>
                </li>
              ))}
            </motion.ul>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

/**
 * New group, in one scroll: cover, type, name, and the few options that matter.
 * Everything has a sensible default, so a name is the only thing you must give.
 */
export function CreateGroup({ onClose, onCreate }: { onClose: () => void; onCreate: (group: Group) => void }) {
  const [cover, setCover] = useState<Cover>(() => shuffleCover())
  const [type, setType] = useState<GroupType>("challenge")
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [scoring, setScoring] = useState<Scoring>("days")
  const [days, setDays] = useState(30)
  const [triedEmpty, setTriedEmpty] = useState(false)
  const file = useRef<HTMLInputElement>(null)
  const nameInput = useRef<HTMLInputElement>(null)

  const ready = name.trim().length >= 2
  const hint = GROUP_TYPES.find((t) => t.id === type)!.hint

  const create = () => {
    if (!ready) {
      setTriedEmpty(true)
      nameInput.current?.focus()
      return
    }
    haptic(20)
    onCreate({
      id: crypto.randomUUID(),
      name: name.trim(),
      description: description.trim(),
      type,
      scoring,
      days: type === "challenge" ? days : null,
      cover,
      access: "open",
      code: makeCode(),
      createdAt: Date.now(),
      checkins: [],
    })
  }

  const pickPhoto = async (picked: File | undefined) => {
    if (!picked) return
    try {
      const photo = await photoToDataUrl(picked)
      setCover((c) => ({ ...c, photo }))
    } catch {
      // Unreadable file: keep the drawn cover.
    }
  }

  return (
    <div className="flex h-full flex-col bg-white">
      <header className="flex h-14 shrink-0 items-center px-2 pt-[env(safe-area-inset-top)]">
        <motion.button type="button" aria-label="Fechar" onClick={onClose} className="flex size-11 items-center justify-center rounded-full" whileTap={PRESS}>
          <XIcon className="size-6" />
        </motion.button>
        <h1 className="flex-1 pr-11 text-center text-[17px] font-semibold">Novo grupo</h1>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4">
        <motion.div {...settle(0)}>
          <GroupCover cover={cover} className="h-[168px] rounded-[28px]">
            <div className="absolute top-3 left-3 flex gap-2">
              <CoverButton
                icon={<ShuffleIcon className="size-4" />}
                onClick={() => {
                  haptic()
                  setCover((c) => shuffleCover(c))
                }}
              >
                Embaralhar
              </CoverButton>
              <CoverButton icon={<ImageIcon className="size-4" />} onClick={() => file.current?.click()}>
                {cover.photo ? "Trocar foto" : "Foto"}
              </CoverButton>
            </div>
          </GroupCover>
          <input ref={file} type="file" accept="image/*" className="sr-only" tabIndex={-1} onChange={(event) => pickPhoto(event.target.files?.[0])} />
        </motion.div>

        <motion.div {...settle(1)} className="mt-5">
          <div role="radiogroup" aria-label="Tipo de grupo" className="flex rounded-[20px] bg-ink/5 p-1">
            {GROUP_TYPES.map((option) => {
              const selected = option.id === type
              const Icon = option.id === "challenge" ? MedalIcon : UsersIcon
              return (
                <motion.button
                  key={option.id}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => {
                    haptic()
                    setType(option.id)
                  }}
                  className="relative flex h-11 flex-1 items-center justify-center gap-2 rounded-[16px] text-[16px] font-medium"
                  whileTap={PRESS}
                >
                  {selected && <motion.span layoutId={SHARED.groupType} className="absolute inset-0 rounded-[16px] bg-ink" transition={{ type: "spring", stiffness: 500, damping: 38 }} />}
                  <Icon className={`relative size-[18px] transition-colors ${selected ? "text-white" : "text-ink/70"}`} />
                  <span className={`relative transition-colors ${selected ? "text-white" : "text-ink/70"}`}>{option.label}</span>
                </motion.button>
              )
            })}
          </div>
          <AnimatePresence mode="wait" initial={false}>
            <motion.p key={type} className="mt-2 px-1 text-[14px] text-ink/55" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0.12 } }} transition={{ duration: 0.15 }}>
              {hint}
            </motion.p>
          </AnimatePresence>
        </motion.div>

        <motion.div {...settle(2)} className="mt-5 overflow-hidden rounded-[20px] border border-ink/12 focus-within:border-ink">
          <label htmlFor="group-name" className="sr-only">
            Nome do grupo
          </label>
          <input
            ref={nameInput}
            id="group-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder={type === "challenge" ? "Nome do desafio" : "Nome do clube"}
            maxLength={40}
            autoComplete="off"
            enterKeyHint="next"
            aria-invalid={triedEmpty && !ready}
            className="h-14 w-full px-4 text-[17px] outline-none placeholder:text-ink/35"
          />
          <div className="mx-4 h-px bg-ink/10" />
          <label htmlFor="group-description" className="sr-only">
            Descrição (opcional)
          </label>
          <textarea
            id="group-description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Descrição (opcional)"
            maxLength={160}
            rows={3}
            className="block w-full resize-none px-4 py-3.5 text-[16px] outline-none placeholder:text-ink/35"
          />
        </motion.div>
        <p className="mt-1.5 min-h-5 px-1 text-[13px] text-[#C0392B]" aria-live="polite">
          {triedEmpty && !ready ? "Dê um nome ao grupo, com pelo menos 2 letras." : ""}
        </p>

        <motion.div {...settle(3)}>
          <h2 className="mt-2 px-1 text-[14px] font-medium text-ink/55">Opções</h2>
          <div className="mt-2 rounded-[20px] border border-ink/12">
            <ScoringPicker value={scoring} onChange={setScoring} />
            <AnimatePresence initial={false}>
              {type === "challenge" && (
                <motion.div className="overflow-hidden" initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0, transition: { duration: 0.16 } }} transition={{ duration: 0.2 }}>
                  <div className="mx-4 h-px bg-ink/10" />
                  <div className="flex items-center gap-3 px-4 pt-4 pb-1">
                    <TimerIcon className="size-5 text-ink/70" />
                    <span className="text-[16px]">Duração</span>
                  </div>
                  <div role="radiogroup" aria-label="Duração" className="flex gap-2 px-4 pt-2 pb-4">
                    {DURATIONS.map((option) => (
                      <motion.button
                        key={option}
                        type="button"
                        role="radio"
                        aria-checked={option === days}
                        onClick={() => {
                          haptic()
                          setDays(option)
                        }}
                        className={`h-10 flex-1 rounded-[14px] border text-[15px] font-medium transition-colors ${option === days ? "border-ink bg-ink text-white" : "border-ink/15 text-ink/70"}`}
                        whileTap={PRESS}
                      >
                        {option} dias
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>

      <div className="shrink-0 border-t border-ink/6 px-4 pt-3 pb-[max(16px,env(safe-area-inset-bottom))]">
        <PrimaryButton onClick={create} disabled={!ready}>
          {type === "challenge" ? "Criar desafio" : "Criar clube"}
        </PrimaryButton>
      </div>
    </div>
  )
}
