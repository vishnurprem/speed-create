import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Multi-page: index.html = option picker, a.html = Option A, b.html = Option B
// On build the site is served from GitHub Pages at /speed-create/.
export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/speed-create/' : '/',
  plugins: [react()],
  build: {
    rollupOptions: {
      input: { index: 'index.html', a: 'a.html', b: 'b.html' },
    },
  },
}))
