import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { useApp } from './App'
import { getAccount, sendMessage } from './requests'
import { EASE } from './ui'
import { Footer } from './Landing'

export default function Contact() {
  const { go } = useApp()
  const acct = getAccount()
  const [name, setName] = useState(acct?.name ?? '')
  const [email, setEmail] = useState(acct?.email ?? '')
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const valid = name.trim() && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && message.trim().length > 2

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); if (!valid || sending) return
    setSending(true)
    await sendMessage({ name: name.trim(), email: email.trim(), message: message.trim() })
    setSending(false); setSent(true)
  }

  return (
    <>
      <section className="find contact">
        <motion.div className="glow" animate={{ scale: [1, 1.06, 1] }} transition={{ duration: 8, repeat: Infinity }} />
        <div className="dotgrid" style={{ opacity: 0.5 }} />
        <div className="ct-wrap">
          <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: EASE }}>Get in touch</motion.h1>
          <motion.p className="ct-sub" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: EASE, delay: 0.15 }}>
            Have questions or feedback? We're here to help. Send us a message and we'll respond within 2 business days.
          </motion.p>
          <motion.div className="ct-card" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: EASE, delay: 0.25 }}>
            <AnimatePresence mode="wait">
              {!sent ? (
                <motion.form key="f" onSubmit={submit} className="ct-form" exit={{ opacity: 0, y: -12 }}>
                  <label><span>Name</span><input value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" /></label>
                  <label><span>Email</span><input value={email} onChange={(e) => setEmail(e.target.value)} type="email" autoComplete="email" /></label>
                  <label><span>Message</span><textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={6} /></label>
                  <motion.button className="ct-send" whileTap={{ scale: 0.98 }} disabled={!valid || sending} style={{ opacity: valid ? 1 : 0.5 }}>
                    {sending ? 'Sending…' : 'Send message'}
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M22 2L11 13" /><path d="M22 2l-7 20-4-9-9-4 20-7z" /></svg>
                  </motion.button>
                </motion.form>
              ) : (
                <motion.div key="s" className="ct-done" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
                  <motion.span className="done-tick" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.15, type: 'spring', stiffness: 400, damping: 15 }}>
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l5 5L20 7" /></svg>
                  </motion.span>
                  <h3>Message sent</h3>
                  <p className="muted">Thanks, {name.split(' ')[0]}. We'll reply to {email} within 2 business days.</p>
                  <div className="ct-row">
                    <button className="btn btn-white btn-sm" onClick={() => go('find')}>Find your content</button>
                    <button className="undo" onClick={() => { setSent(false); setMessage('') }}>Send another</button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </section>
      <Footer />
    </>
  )
}
