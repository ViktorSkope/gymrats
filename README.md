# gymrats

Mobile-first front end for building fitness groups and ranking friends by gym points.
Same stack as whirl: React, Vite, Tailwind, motion. No backend: answers live in sessionStorage.

## Run it

```bash
npm install
npm run dev
```

Open http://localhost:5184. On a wide screen it renders inside a phone frame.
To test on a phone on the same Wi-Fi, use the Network URL Vite prints.

Every step has its own URL, so you can jump straight to one: `#welcome`, `#goal`, `#signup`, `#paywall`, `#preparing`, `#ready`, `#home`.
Load `/` with no hash to see the splash.

## Onboarding flow

1. Splash: the logo writes itself in, drops slide down. Tap to skip.
2. Welcome: the red rat grows out of the login card. It sweats, breathes hard, follows the pointer and squishes when tapped. Every button goes to the goal question for now.
3. Goal: one question, with the glasses rat taking notes. The rat hops at each pick; the answer only tailors later copy (no colour change).
4. Signup: name, email, password. The rat shuts its eyes while you type the password.
5. Paywall: Gymrats Pro, yearly preselected. Buying is faked (spinner, then a check). Skipping is always available.
6. Preparing: fake loading that shows the setup steps, then moves on by itself.
7. Ready: the flexing rat over animated stripes, then the dashboard.

The rats in `src/components/rats/paths.ts` were traced from the illustration PNGs; eyes, glasses, mouth and the flexing arm are drawn on top so they can move.

## Structure

```
src/
  App.tsx                         Step routing (URL hash) and shared answers
  theme.ts                        Rat colours and the goal options
  components/
    Logo.tsx                      Logo mark and wordmark
    rats/Rat.tsx                  The four rats
    rats/Eyes.tsx                 Blinking, glancing, controllable eyes
    onboarding/Splash.tsx
    onboarding/Welcome.tsx        The sweaty block and sign-in buttons
    onboarding/SheetScreen.tsx    Rat over a white sheet, shared by the later steps
    onboarding/SignupSheet.tsx
    onboarding/GoalSheet.tsx
    onboarding/PreparingSheet.tsx
```
