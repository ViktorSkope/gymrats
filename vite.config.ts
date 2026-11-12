import path from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  // Relative paths, so the build works from any folder, including GitHub Pages' /gymrats/.
  base: './',
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@': path.resolve(import.meta.dirname, './src') },
  },
  // host: true exposes the dev server on your LAN, so you can open it on a real phone.
  server: { port: 5184, strictPort: true, host: true },
})
