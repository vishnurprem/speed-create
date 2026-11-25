import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { sendMessage, type Account } from './requests'
import { EASE } from './ui'

/** Inside the upload sheet: for people who'd rather speak to a person than upload documents. */
export default function TalkToSomeone({ account, role, clipCount }: { account: Account | null; role: string; clipCount: number }) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState(account?.name ?? '')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState(account?.email ?? '')
  const [prefer, setPrefer] = useState<'call' | 'email'>('call')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const okEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  const okPhone = phone.replace(/\D/g, '').length >= 7
  const valid = name.trim() && (prefer === 'call' ? okPhone : okEmail)

  const submit = async () => {
    if (!valid || sending) return
    setSending(true)
    await sendMessage({
      name: name.trim(), email: email.trim(), phone: phone.trim(), topic: 'callback', prefer,
      message: `Wants to talk before uploading documents. Prefers ${prefer === 'call' ? 'a call' : 'email'}. Role: ${role}. ${clipCount} clip decision${clipCount === 1 ? '' : 's'} in progress.`,
    })
    setSending(false); setSent(true)
  }

  return (
    <div className={`tts${open ? ' open' : ''}`}>
      {!open ? (
        <button className="tts-head" onClick={() => setOpen(true)}>
          <span className="tts-ic" aria-hidden="true">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z" /></svg>
          </span>
          <span className="tts-t"><b>Rather talk to someone?</b><small>Leave your number or email. We'll call or write back within 1 business day.</small></span>
          <span className="tts-go" aria-hidden="true">→</span>
        </button>
      ) : (
        <AnimatePresence mode="wait">
          {!sent ? (
            <motion.div key="f" className="tts-form" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.3, ease: EASE }}>
              <div className="tts-top"><b>Talk to someone</b><button className="undo" onClick={() => setOpen(false)}>Cancel</button></div>
              <div className="tts-seg" role="radiogroup" aria-label="How should we reach you?">
                <button role="radio" aria-checked={prefer === 'call'} className={prefer === 'call' ? 'on' : ''} onClick={() => setPrefer('call')}>Call me</button>
                <button role="radio" aria-checked={prefer === 'email'} className={prefer === 'email' ? 'on' : ''} onClick={() => setPrefer('email')}>Email me</button>
              </div>
              <label><span>Name</span><input value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" /></label>
              <label><span>Phone{prefer === 'email' ? ' (optional)' : ''}</span><input value={phone} onChange={(e) => setPhone(e.target.value)} type="tel" inputMode="tel" autoComplete="tel" placeholder="+1 555 010 2030" /></label>
              <label><span>Email{prefer === 'call' ? ' (optional)' : ''}</span><input value={email} onChange={(e) => setEmail(e.target.value)} type="email" autoComplete="email" /></label>
              <button className="btn btn-white" disabled={!valid || sending} style={{ width: '100%', opacity: valid ? 1 : 0.45 }} onClick={submit}>
                {sending ? 'Sending…' : prefer === 'call' ? 'Request a call back' : 'Email me'}
              </button>
            </motion.div>
          ) : (
            <motion.div key="s" className="tts-done" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}>
              <span className="tts-ic ok" aria-hidden="true">✓</span>
              <span className="tts-t"><b>Got it, {name.split(' ')[0]}.</b><small>{prefer === 'call' ? `We'll call ${phone} within 1 business day.` : `We'll email ${email} within 1 business day.`} You can still upload now if you like.</small></span>
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </div>
  )
}
