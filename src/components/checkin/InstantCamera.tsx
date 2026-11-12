import { CheckIcon, ImageIcon, RefreshCwIcon, RotateCcwIcon, XIcon } from "lucide-react"
import { AnimatePresence, motion } from "motion/react"
import { useCallback, useEffect, useRef, useState } from "react"

import { GroupCover } from "@/components/groups/GroupCover"
import { photoToDataUrl, type Group, type Post } from "@/components/groups/groups"
import { PrimaryButton } from "@/components/onboarding/SheetScreen"
import { FloatingAction, RoundButton } from "@/components/ui/kit"
import { haptic } from "@/hooks/useHaptic"
import { PRESS, close, open, popover, settle } from "@/motion"

const MAX_VIDEO = 5_000
const HOLD = 220
// For trying it on a computer without a camera.
const SAMPLE_PHOTO = "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=900&q=70&auto=format&fit=crop"

type Media = Post["media"]

/** Live camera: front or back, no audio. Null while starting or if there's none. */
function useCamera(facing: "user" | "environment", enabled: boolean) {
  const video = useRef<HTMLVideoElement>(null)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    if (!enabled) return
    let live = true
    let current: MediaStream | null = null
    if (!navigator.mediaDevices?.getUserMedia) {
      queueMicrotask(() => live && setFailed(true))
      return
    }
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: facing, width: { ideal: 1080 }, height: { ideal: 1440 } }, audio: false })
      .then((s) => {
        if (!live) return s.getTracks().forEach((t) => t.stop())
        current = s
        setStream(s)
        setFailed(false)
        if (video.current) video.current.srcObject = s
      })
      .catch(() => live && setFailed(true))
    // A permission prompt nobody answers would leave a black screen: offer the fallback after a few seconds.
    const slow = window.setTimeout(() => live && !current && setFailed(true), 4000)
    return () => {
      clearTimeout(slow)
      live = false
      current?.getTracks().forEach((t) => t.stop())
      setStream(null)
    }
  }, [facing, enabled])

  return { video, stream, failed }
}

/** Grabs the current frame as a JPEG, mirrored for the selfie camera like what you saw. */
function snapshot(video: HTMLVideoElement, mirror: boolean) {
  const width = Math.min(900, video.videoWidth || 900)
  const height = Math.round(width * ((video.videoHeight || 1200) / (video.videoWidth || 900)))
  const canvas = document.createElement("canvas")
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext("2d")!
  if (mirror) {
    ctx.translate(width, 0)
    ctx.scale(-1, 1)
  }
  ctx.drawImage(video, 0, 0, width, height)
  return canvas.toDataURL("image/jpeg", 0.78)
}

/** The shutter: tap for a photo, hold for up to five seconds of video. */
function Shutter({ recording, onTap, onHoldStart, onHoldEnd, disabled }: { recording: boolean; onTap: () => void; onHoldStart: () => void; onHoldEnd: () => void; disabled: boolean }) {
  const timer = useRef(0)
  const held = useRef(false)
  const down = () => {
    if (disabled) return
    held.current = false
    timer.current = window.setTimeout(() => {
      held.current = true
      onHoldStart()
    }, HOLD)
  }
  const up = () => {
    if (disabled) return
    clearTimeout(timer.current)
    if (held.current) onHoldEnd()
    else onTap()
  }
  return (
    <motion.button
      type="button"
      aria-label="Tirar foto. Segure para gravar vídeo"
      onPointerDown={down}
      onPointerUp={up}
      onPointerCancel={up}
      onContextMenu={(event) => event.preventDefault()}
      className="relative flex size-[84px] items-center justify-center rounded-full disabled:opacity-40"
      disabled={disabled}
      whileTap={{ scale: 0.92 }}
    >
      <svg viewBox="0 0 84 84" className="absolute inset-0 size-full -rotate-90" aria-hidden="true">
        <circle cx="42" cy="42" r="38" fill="none" stroke="#fff" strokeWidth="5" />
        {recording && (
          <motion.circle cx="42" cy="42" r="38" fill="none" stroke="#D23A2C" strokeWidth="5" strokeLinecap="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: MAX_VIDEO / 1000, ease: "linear" }} />
        )}
      </svg>
      <motion.span className="rounded-full bg-white" animate={recording ? { width: 34, height: 34, borderRadius: 10, backgroundColor: "#D23A2C" } : { width: 66, height: 66, borderRadius: 33, backgroundColor: "#ffffff" }} transition={{ type: "spring", stiffness: 500, damping: 30 }} />
    </motion.button>
  )
}

/**
 * Check-in, the way an Instant works: open straight to the camera, one tap (or a
 * short hold for video), no filters or edits. Then pick the groups it counts for and send.
 * Without a camera (or permission), you can pick a photo or video from the device instead.
 */
export function InstantCamera({ groups, preselect, onClose, onPost }: { groups: Group[]; preselect: string[]; onClose: () => void; onPost: (media: Media, groupIds: string[]) => void }) {
  const [facing, setFacing] = useState<"user" | "environment">("user")
  const [media, setMedia] = useState<Media | null>(null)
  const [recording, setRecording] = useState(false)
  const [selected, setSelected] = useState<string[]>(preselect.length ? preselect : groups.map((g) => g.id))
  const { video, stream, failed } = useCamera(facing, !media)
  const recorder = useRef<MediaRecorder | null>(null)
  const stopTimer = useRef(0)
  const file = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && onClose()
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [onClose])

  const takePhoto = () => {
    if (!video.current || !stream) return
    haptic(15)
    setMedia({ kind: "photo", src: snapshot(video.current, facing === "user") })
  }

  const startVideo = () => {
    if (!stream || typeof MediaRecorder === "undefined") return takePhoto()
    const chunks: Blob[] = []
    const rec = new MediaRecorder(stream)
    rec.ondataavailable = (event) => event.data.size && chunks.push(event.data)
    rec.onstop = () => {
      setRecording(false)
      if (chunks.length) setMedia({ kind: "video", src: URL.createObjectURL(new Blob(chunks, { type: rec.mimeType })) })
    }
    recorder.current = rec
    rec.start()
    haptic(20)
    setRecording(true)
    stopTimer.current = window.setTimeout(() => rec.state === "recording" && rec.stop(), MAX_VIDEO)
  }

  const stopVideo = useCallback(() => {
    clearTimeout(stopTimer.current)
    if (recorder.current?.state === "recording") recorder.current.stop()
  }, [])

  const pickFile = async (picked: File | undefined) => {
    if (!picked) return
    if (picked.type.startsWith("video/")) return setMedia({ kind: "video", src: URL.createObjectURL(picked) })
    try {
      setMedia({ kind: "photo", src: await photoToDataUrl(picked, 900) })
    } catch {
      // Unreadable file: stay on the camera.
    }
  }

  const toggle = (id: string) => {
    haptic()
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]))
  }

  const send = () => {
    if (!media || !selected.length) return
    haptic(30)
    onPost(media, selected)
  }

  return (
    <div className="absolute inset-0 z-30 flex flex-col bg-black text-white">
      <div className="relative mx-[7px] mt-[max(6px,var(--sat))] min-h-0 flex-1 overflow-hidden rounded-[30px] bg-[#111]">
        {/* What the camera sees, or what you just took. */}
        {!media && <video ref={video} autoPlay playsInline muted className={`absolute inset-0 size-full object-cover ${facing === "user" ? "-scale-x-100" : ""}`} />}
        {media?.kind === "photo" && <img src={media.src} alt="Seu check-in" className="absolute inset-0 size-full object-cover" />}
        {media?.kind === "video" && <video src={media.src} autoPlay loop playsInline muted className="absolute inset-0 size-full object-cover" />}

        {!media && failed && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-8 text-center">
            <p className="text-[20px] leading-tight">Câmera indisponível</p>
            <p className="text-[15px] text-white/60">Permita o acesso à câmera ou escolha uma foto ou vídeo do aparelho.</p>
            <motion.button type="button" onClick={() => file.current?.click()} className="mt-2 flex h-12 items-center gap-2 rounded-[20px] bg-white px-5 text-[16px] text-ink" whileTap={PRESS}>
              <ImageIcon className="size-5" />
              Escolher foto ou vídeo
            </motion.button>
            <motion.button type="button" onClick={() => setMedia({ kind: "photo", src: SAMPLE_PHOTO })} className="h-11 px-4 text-[15px] text-white/70 underline underline-offset-4" whileTap={PRESS}>
              Usar foto de exemplo
            </motion.button>
          </div>
        )}

        <div className="absolute inset-x-3 top-3 flex items-center justify-between">
          <RoundButton label="Fechar" onClick={onClose}>
            <XIcon className="size-5" />
          </RoundButton>
          {media ? (
            <motion.button type="button" onClick={() => setMedia(null)} className="flex h-11 items-center gap-2 rounded-full bg-black/45 px-4 text-[15px] backdrop-blur-md" whileTap={PRESS} {...popover}>
              <RotateCcwIcon className="size-4" />
              Refazer
            </motion.button>
          ) : (
            <RoundButton label="Trocar câmera" onClick={() => setFacing((f) => (f === "user" ? "environment" : "user"))} className="bg-black/45! text-white! backdrop-blur-md">
              <RefreshCwIcon className="size-5" />
            </RoundButton>
          )}
        </div>
      </div>

      <AnimatePresence mode="wait" initial={false}>
        {!media ? (
          <motion.div key="shoot" className="flex shrink-0 flex-col items-center gap-2 pt-4 pb-[max(18px,var(--sab))]" initial={{ opacity: 0 }} animate={{ opacity: 1, transition: open() }} exit={{ opacity: 0, transition: close }}>
            <p className="text-[13px] text-white/60">{recording ? "Gravando…" : "Toque para foto · segure para vídeo"}</p>
            <div className="flex w-full items-center justify-center gap-10">
              <motion.button type="button" aria-label="Escolher da galeria" onClick={() => file.current?.click()} className="flex size-11 items-center justify-center rounded-full bg-white/12" whileTap={PRESS}>
                <ImageIcon className="size-5" />
              </motion.button>
              <Shutter recording={recording} onTap={takePhoto} onHoldStart={startVideo} onHoldEnd={stopVideo} disabled={!stream} />
              <span className="size-11" />
            </div>
          </motion.div>
        ) : (
          <motion.div key="send" className="shrink-0 px-[7px] pt-3 pb-[calc(56px+max(14px,var(--sab))+14px)]" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0, transition: open() }} exit={{ opacity: 0, transition: close }}>
            <p className="px-2 text-[14px] font-semibold text-white/70">Contar para</p>
            <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
              {groups.map((group, i) => {
                const on = selected.includes(group.id)
                return (
                  <motion.button
                    key={group.id}
                    type="button"
                    role="checkbox"
                    aria-checked={on}
                    onClick={() => toggle(group.id)}
                    className={`flex h-12 shrink-0 items-center gap-2 rounded-full py-1 pr-4 pl-1 text-[15px] transition-colors ${on ? "bg-white text-ink" : "bg-white/12 text-white"}`}
                    whileTap={PRESS}
                    {...settle(i, 0.05)}
                  >
                    <GroupCover cover={group.cover} rat={false} className="size-10 rounded-full" />
                    <span className="max-w-[140px] truncate">{group.name}</span>
                    {on && <CheckIcon className="size-4 text-check" strokeWidth={3} />}
                  </motion.button>
                )
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {media && (
        <FloatingAction>
          <PrimaryButton onClick={send} disabled={!selected.length} className="h-14 shadow-[0_12px_32px_rgb(0_0_0/0.45)]">
            {selected.length > 1 ? `Fazer check-in em ${selected.length} grupos` : "Fazer check-in"}
          </PrimaryButton>
        </FloatingAction>
      )}

      <input ref={file} type="file" accept="image/*,video/*" capture="user" className="sr-only" tabIndex={-1} onChange={(event) => pickFile(event.target.files?.[0])} />
    </div>
  )
}
