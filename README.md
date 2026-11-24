# SpeedRadio · Creator licensing site (prototype)

Live: deployed on Vercel from `main` (also mirrored at https://vishnurprem.github.io/speed-create/)

- `index.html` · choose a design option
- `a.html` · Option A, editorial scroll site
- `b.html` · Option B, mobile-first swipe feed with the real app feed card, audio and captions
- `#/find` on either page · find your content, license or remove clips, upload documents, submit

Built with Vite, React, Motion (`motion/react`) and Lenis.

## Run locally

```
npm install
npm run dev
```

## Deploy

- **Vercel:** every push to `main` builds with `npm run build` (output `dist/`, base `/`).
- **GitHub Pages mirror:** `npm run deploy` builds with base `/speed-create/` and pushes `dist/` to the `gh-pages` branch.

Prototype for internal review. Clip audio and captions are staging samples.
