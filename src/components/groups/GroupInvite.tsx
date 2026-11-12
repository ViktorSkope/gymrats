import { CheckIcon, ChevronRightIcon, LinkIcon, PlusIcon, QrCodeIcon, SendIcon, UserCheckIcon, XIcon } from "lucide-react"
import { AnimatePresence, motion } from "motion/react"
import { useState, type ReactNode } from "react"

import { PrimaryButton } from "@/components/onboarding/SheetScreen"
import { HappyFace } from "@/components/rats/HappyFace"
import { haptic } from "@/hooks/useHaptic"
import { PRESS, settle } from "@/motion"
import { themeStyle } from "@/theme"
import { copyText, inviteLink, shareGroup, typeLabel, type Access, type Group } from "./groups"
import { QrDialog } from "./QrDialog"
import { PersonAvatar } from "@/components/Avatar"
import { Card, CardLabel, FLOAT_SPACE, FloatingAction, RoundButton } from "@/components/ui/kit"

const SLOTS = 4

function Row({ icon, title, detail, onClick, index }: { icon: ReactNode; title: ReactNode; detail: string; onClick: () => void; index: number }) {
  return (
    <motion.button type="button" onClick={onClick} className="flex w-full items-center gap-3.5 rounded-[20px] bg-[#EDEBEE] px-3 py-3 text-left" whileTap={PRESS} {...settle(index, 0.35)}>
      <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-rat text-on-rat">{icon}</span>
      <span className="min-w-0 flex-1">
        <span className="block text-[16px] font-semibold">{title}</span>
        <span className="block truncate text-[14px] text-ink/55">{detail}</span>
      </span>
      <ChevronRightIcon className="size-4 shrink-0 text-ink/30" />
    </motion.button>
  )
}

const ACCESS: { id: Access; label: string; detail: string; help: string; icon: typeof LinkIcon }[] = [
  { id: "open", label: "Aberto", detail: "Qualquer um com o link", help: "Quem tiver o link entra na hora.", icon: LinkIcon },
  { id: "approval", label: "Aprovado", detail: "Você aprova cada um", help: "Você recebe um pedido e decide quem entra.", icon: UserCheckIcon },
]

/**
 * Right after creating: celebrate, then make inviting the obvious next step.
 * A group of one has no ranking, so this screen is all about getting a second person in.
 */
export function GroupInvite({ group, me, onChange, onDone }: { group: Group; me: string; onChange: (group: Group) => void; onDone: () => void }) {
  const [copied, setCopied] = useState(false)
  const [qr, setQr] = useState(false)
  const kindWord = group.type === "challenge" ? "deste desafio" : "deste clube"

  const copy = async () => {
    await copyText(inviteLink(group))
    haptic(12)
    setCopied(true)
    setTimeout(() => setCopied(false), 1800)
  }

  const share = async () => {
    const result = await shareGroup(group)
    if (result === "copied") {
      haptic(12)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    }
  }

  return (
    <div className="theme-fade relative flex h-full flex-col bg-ink" style={themeStyle(group.cover.kind)}>
      <div className={`flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto px-[7px] pt-[max(6px,var(--sat))] ${FLOAT_SPACE}`}>
        {/* The celebration, in the group's colour like its card on the home screen. */}
        <motion.section className="relative shrink-0 rounded-[30px] bg-rat px-5 pt-4 pb-7 text-center text-on-rat" {...settle(0)}>
          <RoundButton label="Fechar" onClick={onDone} className="absolute top-3 left-3">
            <XIcon className="size-5" />
          </RoundButton>
          <HappyFace className="mx-auto mt-4 w-[150px]" />
          <motion.h1 className="mt-3 text-[32px] leading-none tracking-[-0.02em]" {...settle(0, 0.3)}>
            {typeLabel(group)} criado!
          </motion.h1>
          <motion.p className="mt-2 text-[16px] opacity-85" {...settle(1, 0.3)}>
            {group.name} está pronto para a primeira disputa.
          </motion.p>
        </motion.section>

        <Card index={1}>
          <div className="flex items-center justify-center gap-1.5">
            <PersonAvatar name={me} me className="size-11" />
            {Array.from({ length: SLOTS }, (_, i) => (
              <motion.span key={i} className="size-11 rounded-full border-2 border-dashed border-ink/20" {...settle(i + 1, 0.3)} />
            ))}
            <motion.button type="button" aria-label="Convidar amigos" onClick={share} className="flex size-11 items-center justify-center rounded-full border-2 border-dashed border-ink/20 text-ink/40" whileTap={PRESS} {...settle(SLOTS + 1, 0.3)}>
              <PlusIcon className="size-5" />
            </motion.button>
          </div>
          <h2 className="mt-4 text-center text-[20px] font-semibold">Só você por enquanto</h2>
          <p className="mt-1 text-center text-[15px] text-ink/60">Convide amigos para participar {kindWord}.</p>

          <div className="mt-4 flex flex-col gap-1.5">
            <Row index={0} icon={<SendIcon className="size-5" />} title="Compartilhar convite" detail="WhatsApp, grupos, onde quiser" onClick={share} />
            <Row
              index={1}
              icon={<AnimatePresence mode="wait" initial={false}>{copied ? <motion.span key="ok" initial={{ scale: 0.6 }} animate={{ scale: 1 }}><CheckIcon className="size-5" /></motion.span> : <motion.span key="link" initial={{ scale: 0.6 }} animate={{ scale: 1 }}><LinkIcon className="size-5" /></motion.span>}</AnimatePresence>}
              title={copied ? "Link copiado!" : "Copiar link"}
              detail={inviteLink(group).replace("https://", "")}
              onClick={copy}
            />
            <Row index={2} icon={<QrCodeIcon className="size-5" />} title="Mostrar QR code" detail="Para quem está do seu lado" onClick={() => setQr(true)} />
          </div>
        </Card>

        <Card index={2}>
          <CardLabel>Quem pode entrar</CardLabel>
          <div role="radiogroup" aria-label="Quem pode entrar" className="mt-3 grid grid-cols-2 gap-2">
            {ACCESS.map(({ id, label, detail, icon: Icon }) => {
              const selected = group.access === id
              return (
                <motion.button
                  key={id}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => {
                    haptic()
                    onChange({ ...group, access: id })
                  }}
                  className={`flex flex-col items-center rounded-[20px] px-3 py-4 text-center transition-colors ${selected ? "bg-ink text-white" : "bg-[#EDEBEE]"}`}
                  whileTap={PRESS}
                >
                  <Icon className={`size-6 ${selected ? "text-white" : "text-ink/50"}`} />
                  <span className="mt-2 text-[16px] font-semibold">{label}</span>
                  <span className={`text-[13px] ${selected ? "text-white/70" : "text-ink/55"}`}>{detail}</span>
                </motion.button>
              )
            })}
          </div>
          <p className="mt-2 px-1 text-[14px] text-ink/55">{ACCESS.find((a) => a.id === group.access)!.help}</p>
        </Card>

        <motion.button type="button" onClick={onDone} className="h-12 shrink-0 rounded-[20px] bg-paper text-[16px] font-medium text-ink" whileTap={PRESS}>
          Ir para o grupo
        </motion.button>
      </div>

      <FloatingAction>
        <PrimaryButton onClick={share} className="h-14 shadow-[0_12px_32px_rgb(0_0_0/0.45)]">
          <SendIcon className="size-5" />
          Convidar amigos
        </PrimaryButton>
      </FloatingAction>

      <AnimatePresence>{qr && <QrDialog group={group} onClose={() => setQr(false)} />}</AnimatePresence>
    </div>
  )
}
