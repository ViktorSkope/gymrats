import { StrictMode, useSyncExternalStore } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { installDragScroll } from './dragScroll.ts'
import { FRAME_QUERY, PhoneFrame, shouldFrame } from './PhoneFrame.tsx'

// Inside the phone frame, scrollbars hide and the mouse drags to scroll, like a thumb on a phone.
const inFrame = window.self !== window.top
document.documentElement.classList.toggle('in-frame', inFrame)
if (inFrame) installDragScroll()

const subscribe = (onChange: () => void) => {
  const query = window.matchMedia(FRAME_QUERY)
  query.addEventListener('change', onChange)
  return () => query.removeEventListener('change', onChange)
}

function Root() {
  const framed = useSyncExternalStore(subscribe, shouldFrame)
  return framed ? <PhoneFrame /> : <App />
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Root />
  </StrictMode>,
)
