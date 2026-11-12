import { AnimatePresence, MotionConfig } from "motion/react"
import { useCallback, useEffect, useState } from "react"

import { GoalSheet } from "@/components/onboarding/GoalSheet"
import { Paywall, type Plan } from "@/components/onboarding/Paywall"
import { PreparingSheet } from "@/components/onboarding/PreparingSheet"
import { Ready } from "@/components/onboarding/Ready"
import { Dashboard } from "@/components/home/Dashboard"
import { StatusBar } from "@/components/StatusBar"
import { SheetScreen, type RatMood } from "@/components/onboarding/SheetScreen"
import { SignupSheet } from "@/components/onboarding/SignupSheet"
import { Splash } from "@/components/onboarding/Splash"
import { Welcome } from "@/components/onboarding/Welcome"
import { useStored } from "@/hooks/useStored"
import { GOALS, goalById, type GoalId } from "@/theme"

const STEPS = ["splash", "welcome", "goal", "signup", "paywall", "preparing", "ready", "home"] as const
type Step = (typeof STEPS)[number]

/** The step lives in the URL hash, so the back button works and any step can be opened directly (#goal). */
const stepFromHash = (): Step | null => {
  const hash = window.location.hash.slice(1)
  return (STEPS as readonly string[]).includes(hash) && hash !== "splash" ? (hash as Step) : null
}

// The desktop phone frame loads the app in an iframe; only there do we draw an iPhone status bar.
const inFrame = window.self !== window.top

const go = (next: Step) => {
  window.location.hash = next
}

export default function App() {
  const [step, setStep] = useState<Step>(() => stepFromHash() ?? "splash")
  const [goal, setGoal] = useStored<GoalId | null>("goal", null)
  const [name, setName] = useStored("name", "")
  const [, setPlan] = useStored<Plan | null>("plan", null)
  const [mood, setMoodFor] = useState<{ step: Step; mood: RatMood }>({ step, mood: {} })
  const [hop, setHop] = useState(0)

  useEffect(() => {
    const onHash = () => setStep(stepFromHash() ?? "welcome")
    window.addEventListener("hashchange", onHash)
    return () => window.removeEventListener("hashchange", onHash)
  }, [])

  // The splash never goes into history: back from welcome leaves the app, as on a phone.
  const finishSplash = useCallback(() => {
    history.replaceState(null, "", "#welcome")
    setStep("welcome")
  }, [])

  // A mood only counts for the step that set it, so it cannot leak into the next one.
  const setMood = useCallback((next: RatMood) => setMoodFor({ step: stepFromHash() ?? "welcome", mood: next }), [])
  const bumpHop = useCallback(() => setHop((n) => n + 1), [])
  // Loading is not a place to come back to: going back from the finish line skips it.
  const finishPreparing = useCallback(() => {
    history.replaceState(null, "", "#ready")
    setStep("ready")
  }, [])

  const chosen = goalById(goal)
  const ratMood = mood.step === step ? mood.mood : {}

  // Every pick gets a hop: the rat noting your answer.
  const selectGoal = (id: GoalId) => {
    bumpHop()
    setGoal(id)
  }

  const restart = () => {
    setGoal(null)
    setName("")
    setPlan(null)
    try {
      sessionStorage.removeItem("gymrats.photo")
    } catch {
      // Storage blocked: no photo saved.
    }
    try {
      sessionStorage.removeItem("gymrats.groups")
    } catch {
      // Storage blocked: nothing saved to clear.
    }
    history.replaceState(null, "", "#")
    setStep("splash")
  }

  const sheet = () => {
    if (step === "signup")
      return (
        <SignupSheet
          name={name}
          onMood={setMood}
          onDone={(value) => {
            setName(value)
            go("paywall")
          }}
        />
      )
    if (step === "goal") return <GoalSheet goal={goal} onSelect={selectGoal} onContinue={() => go("signup")} />
    if (step === "preparing") return <PreparingSheet goalStep={chosen?.prepStep ?? "Montando seu primeiro grupo"} onMood={setMood} onHop={bumpHop} onDone={finishPreparing} />
    return null
  }

  const back = step === "goal" ? () => go("welcome") : step === "signup" ? () => go("goal") : undefined
  const screen = step === "goal" || step === "signup" || step === "preparing" ? "sheet" : step

  return (
    <MotionConfig reducedMotion="user">
      <main className="relative mx-auto h-dvh max-w-[430px] overflow-hidden bg-ink">
        <AnimatePresence initial={false}>
          {screen === "splash" && <Splash key="splash" onDone={finishSplash} />}
          {screen === "welcome" && <Welcome key="welcome" onContinue={() => go("goal")} />}
          {screen === "sheet" && (
            <SheetScreen key="sheet" mood={ratMood} hop={hop} contentKey={step} onBack={back}>
              {sheet()}
            </SheetScreen>
          )}
          {screen === "paywall" && (
            <Paywall
              key="paywall"
              onDone={(picked) => {
                setPlan(picked)
                go("preparing")
              }}
            />
          )}
          {screen === "ready" && <Ready key="ready" title={(chosen ?? GOALS[0]).ready} onDone={() => go("home")} />}
          {screen === "home" && <Dashboard key="home" kind="red" name={name} onRestart={restart} />}
        </AnimatePresence>
        {inFrame && <StatusBar />}
      </main>
    </MotionConfig>
  )
}
