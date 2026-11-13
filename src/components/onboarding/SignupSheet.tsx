import { EyeIcon, EyeOffIcon } from "lucide-react"
import { motion } from "motion/react"
import { useEffect, useState, type ChangeEvent, type FormEvent } from "react"

import { settle } from "@/motion"
import { PrimaryButton, SheetBody, type RatMood } from "./SheetScreen"

type Field = "name" | "email" | "password"

const isEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim())

// Prototype: nothing is required. Empty is fine; only something typed wrong gets a hint.
function errorFor(field: Field, value: string) {
  if (!value.trim()) return ""
  if (field === "name") return value.trim().length < 2 ? "Como podemos te chamar?" : ""
  if (field === "email") return isEmail(value) ? "" : "Confira o email, parece incompleto."
  return value.length < 6 ? "Use pelo menos 6 caracteres." : ""
}

/**
 * Account creation, kept to three fields. Errors wait until a field is left, so
 * nobody is scolded mid-typing. The rat covers its eyes while you type a password.
 */
export function SignupSheet({ name: initialName, onDone, onMood }: { name: string; onDone: (name: string) => void; onMood: (mood: RatMood) => void }) {
  const [values, setValues] = useState({ name: initialName, email: "", password: "" })
  const [touched, setTouched] = useState<Record<Field, boolean>>({ name: false, email: false, password: false })
  const [focused, setFocused] = useState<Field | null>(null)
  const [showPassword, setShowPassword] = useState(false)

  useEffect(() => {
    if (focused === "password") onMood(showPassword ? { look: { x: 0.2, y: 1 } } : { closed: true })
    else if (focused) onMood({ look: { x: -0.3, y: 1 } })
    else onMood({})
  }, [focused, showPassword, onMood])

  const errors = { name: errorFor("name", values.name), email: errorFor("email", values.email), password: errorFor("password", values.password) }
  const submit = (event: FormEvent) => {
    event.preventDefault()
    onDone(values.name.trim())
  }

  const input = (field: Field) => ({
    id: field,
    value: values[field],
    onChange: (event: ChangeEvent<HTMLInputElement>) => setValues((v) => ({ ...v, [field]: event.target.value })),
    onFocus: () => setFocused(field),
    onBlur: () => {
      setFocused(null)
      setTouched((t) => ({ ...t, [field]: true }))
    },
    "aria-invalid": touched[field] && !!errors[field],
    "aria-describedby": `${field}-error`,
    className:
      "h-[52px] w-full rounded-2xl border border-white/15 bg-white/6 px-4 text-[17px] text-white outline-none transition-[border-color,box-shadow] placeholder:text-white/35 focus:border-white focus:ring-3 focus:ring-white/10 aria-invalid:border-[#FF6B5C]",
  })

  const label = (field: Field, text: string) => (
    <label htmlFor={field} className="mb-1.5 block text-[14px] font-medium text-white/70">
      {text}
    </label>
  )

  const error = (field: Field) => (
    <p id={`${field}-error`} className="mt-1.5 min-h-[18px] text-[13px] text-[#FF8A7E]" aria-live="polite">
      {touched[field] ? errors[field] : ""}
    </p>
  )

  return (
    <form onSubmit={submit} noValidate className="flex min-h-0 flex-1 flex-col">
      <SheetBody
        title="Crie sua conta"
        action={
          <>
            <PrimaryButton shared type="submit">
              Criar conta
            </PrimaryButton>
            <p className="mt-3 text-center text-[12px] leading-snug text-white/50">
              Ao continuar, você concorda com os <span className="underline">Termos</span> e a <span className="underline">Política de Privacidade</span>.
            </p>
          </>
        }
      >
        <p className="mt-2 text-[15px] text-white/60">No protótipo, pode deixar em branco e seguir.</p>
        <motion.div className="mt-6" {...settle(0, 0.1)}>
          {label("name", "Nome")}
          <input {...input("name")} type="text" autoComplete="given-name" autoCapitalize="words" enterKeyHint="next" placeholder="Seu nome" />
          {error("name")}
        </motion.div>
        <motion.div className="mt-1" {...settle(1, 0.1)}>
          {label("email", "Email")}
          <input {...input("email")} type="email" inputMode="email" autoComplete="email" autoCapitalize="none" spellCheck={false} enterKeyHint="next" placeholder="voce@email.com" />
          {error("email")}
        </motion.div>
        <motion.div className="mt-1" {...settle(2, 0.1)}>
          {label("password", "Senha")}
          <div className="relative">
            <input {...input("password")} type={showPassword ? "text" : "password"} autoComplete="new-password" enterKeyHint="go" placeholder="Mínimo de 6 caracteres" />
            <button
              type="button"
              aria-label={showPassword ? "Esconder senha" : "Mostrar senha"}
              aria-pressed={showPassword}
              // Keep focus in the field, so the rat's reaction makes sense.
              onPointerDown={(event) => event.preventDefault()}
              onClick={() => setShowPassword((s) => !s)}
              className="absolute top-1/2 right-1.5 flex size-10 -translate-y-1/2 items-center justify-center rounded-xl text-white/55"
            >
              {showPassword ? <EyeOffIcon className="size-5" /> : <EyeIcon className="size-5" />}
            </button>
          </div>
          {error("password")}
        </motion.div>
      </SheetBody>
    </form>
  )
}
