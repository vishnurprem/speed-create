# SpeedRadio · Creator licensing site (prototype)

Live: deployed on Vercel from `main` (also mirrored at https://vishnurprem.github.io/speed-create/)

- `index.html` · choose a design option
- `a.html` · Option A, editorial scroll site
- `b.html` · Option B, mobile-first swipe feed with the real app feed card, audio and captions
- `#/find` on either page · find your content, license or remove clips, upload documents, submit

- `#/track` · sign in and track your requests, license more clips
- `/admin` · every submitted request, with status updates (needs the setup below)

Built with Vite, React, Motion (`motion/react`) and Lenis.

## Vercel setup (one time)

1. **Database for /admin:** Vercel project → Storage → add **Upstash for Redis** (free) to this project. It sets `KV_REST_API_URL` and `KV_REST_API_TOKEN`.
2. **Admin key:** Settings → Environment Variables → add `ADMIN_KEY` (any passphrase). You type it on `/admin`.
3. **Real Google sign-in (optional):** create an OAuth Client ID (Web) in Google Cloud, add your Vercel domain as an authorised JavaScript origin, then add `VITE_GOOGLE_CLIENT_ID`. Until then sign-in is a labelled prototype (no password field).
4. Redeploy.

Uploaded documents: only file names and sizes are stored for now. Storing the files themselves needs Vercel Blob.

## Run locally

```
npm install
npm run dev
```

## Deploy

- **Vercel:** every push to `main` builds with `npm run build` (output `dist/`, base `/`).
- **GitHub Pages mirror:** `npm run deploy` builds with base `/speed-create/` and pushes `dist/` to the `gh-pages` branch.

Prototype for internal review. Clip audio and captions are staging samples.
