import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { useApp } from './App'
import { GoogleSignIn } from './GoogleSignIn'
import { getAccount, myRequests, setAccount, type Account, type LicenseRequest } from './requests'
import { EASE } from './ui'
import { Footer } from './Landing'

const STEPS = ['Submitted', 'In review', 'Approved', 'Earning']
const stepIndex = (s: LicenseRequest['status']) => (s === 'Approved' || s === 'Partly approved' ? 3 : s === 'Rejected' ? 0 : 1)
const clipLabel = (c: LicenseRequest['clips'][number]) =>
  c.status === 'licensed' ? (c.review === 'approved' ? 'Licensed ✓' : c.review === 'declined' ? 'Not licensed' : 'Licensing') : (c.review === 'approved' ? 'Removed ✓' : c.review === 'declined' ? 'Kept' : 'Removing')
const pill = (s: LicenseRequest['status']) => (s === 'Approved' || s === 'Partly approved' ? 'chip-g' : s === 'Rejected' ? 'chip-r' : s === 'Needs info' ? 'chip-y' : 'chip-n')

function RequestCard({ r, k }: { r: LicenseRequest; k: number }) {
  const [open, setOpen] = useState(k === 0)
  const lic = r.clips.filter((c) => c.status === 'licensed').length
  const rem = r.clips.filter((c) => c.status === 'removing').length
  const at = stepIndex(r.status)
  return (
    <motion.div className="tr-card" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: EASE, delay: k * 0.06 }}>
      <div className="tr-top">
        <div><b>Request {r.id}</b><small>{new Date(r.createdAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })} · {r.role}</small></div>
        <span className={`chip ${pill(r.status)}`}>{r.status}</span>
      </div>
      <div className="tr-steps">
        {STEPS.map((s, i) => (
          <div key={s} className={`tr-step${i <= at && r.status !== 'Rejected' ? ' on' : ''}`}>
            <span className="tr-dot">{i < at || (i === at && (r.status === 'Approved' || r.status === 'Partly approved')) ? '✓' : i + 1}</span>
            <small>{s}</small>
          </div>
        ))}
      </div>
      {r.note && <p className="tr-note">{r.note}</p>}
      <div className="tr-nums">
        <div><b>{lic}</b><span>licensed · $2 per 1,000 listens</span></div>
        <div><b>{rem}</b><span>coming down within 24h</span></div>
        <div><b>{r.files.length}</b><span>document{r.files.length === 1 ? '' : 's'}</span></div>
      </div>
      <button className="undo" onClick={() => setOpen(!open)}>{open ? 'Hide clips' : 'Show clips'}</button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.ul className="tr-clips" initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
            {r.clips.map((c) => (
              <li key={c.id}><span>{c.title}<small>{c.show}</small></span><span className={`chip ${c.review === 'declined' ? 'chip-n' : c.status === 'licensed' ? 'chip-g' : 'chip-r'}`}>{clipLabel(c)}</span></li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export default function Track() {
  const { go } = useApp()
  const [account, setAcc] = useState<Account | null>(getAccount)
  const [reqs, setReqs] = useState<LicenseRequest[] | null>(null)

  useEffect(() => { if (account) myRequests(account.email).then(setReqs) }, [account])

  const signIn = (a: Account) => { setAccount(a); setAcc(a) }
  const signOut = () => { setAccount(null); setAcc(null); setReqs(null) }

  return (
    <>
      <section className="find track">
        <motion.div className="glow" animate={{ scale: [1, 1.06, 1] }} transition={{ duration: 8, repeat: Infinity }} />
        <div className="dotgrid" style={{ opacity: 0.5 }} />
        <div className="wrap" style={{ position: 'relative' }}>
          {!account ? (
            <div className="tr-signin">
              <GoogleSignIn title="Track your requests" sub="Sign in with the account you used when you submitted. You can also license more clips from here." onDone={signIn} />
            </div>
          ) : (
            <>
              <div className="find-head">
                <div>
                  <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: EASE }}>My requests</motion.h1>
                  <p className="muted" style={{ fontSize: 18, marginTop: 12 }}>Track what's happening with your clips, and license more any time.</p>
                </div>
                <div className="tr-acct">
                  <span className="gs-av">{account.name.split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase()}</span>
                  <span><b>{account.name}</b><small>{account.email}</small></span>
                  <button className="undo" onClick={signOut}>Sign out</button>
                </div>
              </div>
              <div className="tr-actions">
                <button className="btn btn-red" onClick={() => go('find')}>License more clips →</button>
                <span className="muted" style={{ fontSize: 14 }}>Paid monthly from our creator fund · reviews take 1–2 working days</span>
              </div>
              <div className="tr-list">
                {reqs === null && <div className="skeleton" style={{ minHeight: 180 }} />}
                {reqs && reqs.length === 0 && (
                  <div className="tr-empty"><b>No requests yet</b><p className="muted">Find your clips, choose what we can license, and submit. It'll show up here.</p><button className="btn btn-white btn-sm" onClick={() => go('find')}>Find your content</button></div>
                )}
                {reqs?.map((r, k) => <RequestCard key={r.id} r={r} k={k} />)}
              </div>
            </>
          )}
        </div>
      </section>
      <Footer />
    </>
  )
}
