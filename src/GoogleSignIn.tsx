import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import type { Account } from './requests'

// Real Google sign-in turns on when VITE_GOOGLE_CLIENT_ID is set (Vercel → Settings → Environment Variables).
// Without it this is a clearly labelled prototype: an account chooser with no password field.
const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined

declare global {
  interface Window {
    google?: { accounts: { id: { initialize: (o: object) => void; renderButton: (el: HTMLElement, o: object) => void } } }
  }
}

export const GoogleG = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true">
    <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
    <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
    <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
    <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
  </svg>
)

function decodeJwt(token: string): { email: string; name: string; picture?: string } {
  const p = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
  return JSON.parse(decodeURIComponent(atob(p).split('').map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('')))
}

export function GoogleSignIn({ title, sub, onDone, onClose }: { title: string; sub: string; onDone: (a: Account) => void; onClose?: () => void }) {
  const [step, setStep] = useState<'start' | 'choose' | 'other'>('start')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const btn = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!CLIENT_ID || !btn.current) return
    const init = () => {
      window.google?.accounts.id.initialize({
        client_id: CLIENT_ID,
        callback: (r: { credential: string }) => { const p = decodeJwt(r.credential); onDone({ email: p.email, name: p.name, picture: p.picture, via: 'google' }) },
      })
      if (btn.current) window.google?.accounts.id.renderButton(btn.current, { theme: 'filled_black', size: 'large', shape: 'pill', text: 'continue_with', width: 320 })
    }
    if (window.google) { init(); return }
    const s = document.createElement('script'); s.src = 'https://accounts.google.com/gsi/client'; s.async = true; s.onload = init; document.head.appendChild(s)
  }, [onDone])

  const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

  return (
    <div className="gs-card">
      {onClose && <button className="gs-x" onClick={onClose} aria-label="Close">✕</button>}
      <AnimatePresence mode="wait">
        {step === 'start' && (
          <motion.div key="start" className="gs-step" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <span className="gs-lock"><svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></svg></span>
            <h3>{title}</h3>
            <p className="muted">{sub}</p>
            {CLIENT_ID ? (
              <div ref={btn} className="gs-gbtn" />
            ) : (
              <motion.button className="gs-google" whileTap={{ scale: 0.97 }} onClick={() => setStep('choose')}><GoogleG />Continue with Google</motion.button>
            )}
            <ul className="gs-why">
              <li>Track the status of your request</li>
              <li>Come back to license more clips</li>
              <li>We only read your name and email</li>
            </ul>
            {!CLIENT_ID && <span className="gs-proto">Prototype sign-in · real Google login switches on when the Client ID is added</span>}
          </motion.div>
        )}
        {step === 'choose' && (
          <motion.div key="choose" className="gs-step gs-chooser" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <div className="gs-chead"><GoogleG size={22} /><span>Sign in with Google</span></div>
            <h3>Choose an account</h3>
            <p className="muted">to continue to <b>SpeedRadio</b></p>
            <button className="gs-acct" onClick={() => onDone({ email: 'maya@thelonganswer.fm', name: 'Maya Rao', via: 'prototype' })}>
              <span className="gs-av">MR</span><span><b>Maya Rao</b><small>maya@thelonganswer.fm</small></span>
            </button>
            <button className="gs-acct" onClick={() => setStep('other')}>
              <span className="gs-av gs-av-o">+</span><span><b>Use another account</b></span>
            </button>
            <span className="gs-proto">Prototype · no password is ever asked for here</span>
          </motion.div>
        )}
        {step === 'other' && (
          <motion.form key="other" className="gs-step" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
            onSubmit={(e) => { e.preventDefault(); if (validEmail) onDone({ email: email.trim(), name: name.trim() || email.split('@')[0], via: 'prototype' }) }}>
            <div className="gs-chead"><GoogleG size={22} /><span>Sign in with Google</span></div>
            <h3>Use another account</h3>
            <label className="gs-field"><span>Name</span><input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" autoComplete="name" /></label>
            <label className="gs-field"><span>Email</span><input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" type="email" autoComplete="email" /></label>
            <div className="gs-row">
              <button type="button" className="undo" onClick={() => setStep('choose')}>Back</button>
              <button type="submit" className="btn btn-red btn-sm" disabled={!validEmail} style={{ opacity: validEmail ? 1 : 0.45 }}>Continue</button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  )
}
