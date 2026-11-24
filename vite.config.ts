import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Multi-page: index.html = option picker, a.html = Option A, b.html = Option B
// Default base '/' (Vercel serves from the domain root).
// `npm run deploy` builds with --base=/speed-create/ for GitHub Pages.
export default defineConfig({
  base: '/',
  plugins: [react()],
  build: {
    rollupOptions: {
      input: { index: 'index.html', a: 'a.html', b: 'b.html' },
    },
  },
})
