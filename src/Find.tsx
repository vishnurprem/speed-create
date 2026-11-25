import TalkToSomeone from './TalkToSomeone'
import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, LayoutGroup, motion } from 'motion/react'
import { CLIPS, type Clip, type ClipStatus } from './data'
import { CountUp, EASE, Magnetic, PlayIcon, Waveform } from './ui'
import { Footer } from './Landing'
import { useApp } from './App'
import { GoogleSignIn } from './GoogleSignIn'
import { getAccount, setAccount, submitRequest, type Account, type LicenseRequest } from './requests'

const ROLES: [string, string, string][] = [
  ['me', "It's me", 'I\'m the voice in these clips'],
  ['rep', 'I represent them', 'Agent, manager or team'],
  ['rights', 'I hold the rights', 'Network, label, publisher or estate'],
]

type Filter ='all' | 'unclaimed' | 'licensed' | 'removing'

function ClipCard({ c, playing, onPlay, onSet }: { c: Clip; playing: boolean; onPlay: () => void; onSet: (s: ClipStatus) => void }) {
  return (
    <motion.div
      layout
      className={`clip ${c.status}`}
      initial={{ opacity: 0, y: 30, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
      transition={{ type: 'spring', stiffness: 260, damping: 26 }}
      whileHover={{ y: -4 }}
    >
      <div className="clip-h">
        <div><b>{c.title}</b><small>{c.show} · {c.length} · links to original</small></div>
        <AnimatePresence mode="wait">
          <motion.span
            key={c.status}
            className={`chip ${c.status === 'licensed' ? 'chip-g' : c.status === 'removing' ? 'chip-r' : 'chip-n'}`}
            initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.5, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 500, damping: 22 }}
          >
            {c.status === 'licensed' ? 'Licensed' : c.status === 'removing' ? 'Removing in 24h' : 'Unclaimed'}
          </motion.span>
        </AnimatePresence>
      </div>
      <div className="lead">{c.lead}</div>
      <div className="q">{c.quote}</div>
      <div className="clip-play">
        <motion.button className="play" onClick={onPlay} whileTap={{ scale: 0.9 }} aria-label={playing ? 'Pause' : 'Play'}>
          {playing ? <svg width="12" height="12" viewBox="0 0 12 12"><rect x="1" y="1" width="3.5" height="10" rx="1" fill="#111" /><rect x="7.5" y="1" width="3.5" height="10" rx="1" fill="#111" /></svg> : <PlayIcon size={12} />}
        </motion.button>
        <Waveform bars={18} height={22} playing={playing} color={playing ? '#EA1C25' : '#555'} />
      </div>
      <AnimatePresence mode="wait" initial={false}>
        {c.status === 'unclaimed' ? (
          <motion.div key="a" className="clip-actions" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
            <motion.button className="btn btn-red" whileTap={{ scale: 0.95 }} onClick={() => onSet('licensed')}>License it</motion.button>
            <motion.button className="btn btn-ghost" whileTap={{ scale: 0.95 }} onClick={() => onSet('removing')}>Remove</motion.button>
          </motion.div>
        ) : (
          <motion.button key="b" className="undo" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => onSet('unclaimed')}>Change my mind</motion.button>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export default function Find() {
  const [q, setQ] = useState('Maya Rao')
  const [loading, setLoading] = useState(true)
  const [clips, setClips] = useState<Clip[]>(CLIPS)
  const [filter, setFilter] = useState<Filter>('all')
  const [playing, setPlaying] = useState<string | null>(null)
  const [toast, setToast] = useState<{ text: string; color: string } | null>(null)
  const toastT = useRef<number>(0)
  const [sheet, setSheet] = useState(false)
  const [done, setDone] = useState(false)
  const [files, setFiles] = useState<File[]>([])
  const [role, setRole] = useState('me')
  const [agree, setAgree] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const { go } = useApp()
  const [signIn, setSignIn] = useState(false)
  const [submitted, setSubmitted] = useState<LicenseRequest | null>(null)
  const [account, setAcc] = useState<Account | null>(getAccount)
  const finalize = async (a: Account) => {
    const roleLabel = ROLES.find(([k]) => k === role)?.[1] ?? role
    const req = await submitRequest({
      email: a.email, name: a.name, role: roleLabel,
      clips: clips.filter((c) => c.status !== 'unclaimed').map((c) => ({ id: c.id, title: c.title, show: c.show, status: c.status as 'licensed' | 'removing' })),
      files: files.map((f) => ({ name: f.name, size: f.size })),
    })
    setSubmitted(req); setDone(true)
  }
  const startSubmit = () => { setSheet(false); const a = getAccount(); if (a) finalize(a); else setSignIn(true) }
  const addFiles = (list: FileList) => setFiles((f) => [...f, ...Array.from(list)])
  useEffect(() => { document.documentElement.style.overflow = sheet || done || signIn ? 'hidden' : ''; return () => { document.documentElement.style.overflow = '' } }, [sheet, done, signIn])

  const search = () => { setLoading(true); setTimeout(() => setLoading(false), 900) }
  useEffect(() => { search() }, [])

  const notify = (text: string, color: string) => {
    setToast({ text, color }); window.clearTimeout(toastT.current); toastT.current = window.setTimeout(() => setToast(null), 2200)
  }
  const setStatus = (id: string, s: ClipStatus) => {
    setClips((cs) => cs.map((c) => (c.id === id ? { ...c, status: s } : c)))
    if (s === 'licensed') notify('Licensed. You\'ll be paid from our creator fund.', '#3BE08D')
    else if (s === 'removing') notify('Removing within 24 hours.', '#EA1C25')
    else notify('Back to unclaimed.', '#8A8A8A')
  }
  const licenseAll = () => { setClips((cs) => cs.map((c) => (c.status === 'unclaimed' ? { ...c, status: 'licensed' } : c))); notify('All unclaimed clips licensed.', '#3BE08D') }

  const counts = useMemo(() => ({
    all: clips.length,
    unclaimed: clips.filter((c) => c.status === 'unclaimed').length,
    licensed: clips.filter((c) => c.status === 'licensed').length,
    removing: clips.filter((c) => c.status === 'removing').length,
  }), [clips])
  const decided = counts.licensed + counts.removing > 0
  const shown = filter === 'all' ? clips : clips.filter((c) => c.status === filter)
  const tabs: [Filter, string][] = [['all', 'All'], ['unclaimed', 'Unclaimed'], ['licensed', 'Licensed'], ['removing', 'Removing']]

  return (
    <>
      <section className="find">
        <motion.div className="glow" animate={{ scale: [1, 1.06, 1] }} transition={{ duration: 8, repeat: Infinity }} />
        <div className="dotgrid" style={{ opacity: 0.6 }} />
        <div className="wrap" style={{ position: 'relative' }}>
          <div className="find-head">
            <div>
              <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: EASE }}>Find your content</motion.h1>
              <motion.p className="muted" style={{ fontSize: 18, marginTop: 12 }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
                Search your name or channel. License what we can use, and remove anything you don't want.
              </motion.p>
            </div>
            <motion.div className="sum" initial={{ opacity: 0, y: 20, rotateX: 20 }} animate={{ opacity: 1, y: 0, rotateX: 0 }} transition={{ duration: 0.8, ease: EASE, delay: 0.15 }}>
              <div><div className="k">Licensed</div><div className="v"><motion.span key={counts.licensed} initial={{ y: -10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} style={{ display: 'inline-block' }}>{counts.licensed}</motion.span> of {counts.all}</div></div>
              <div><div className="k">You get</div><div className="v" style={{ color: '#EA1C25' }}><CountUp to={2} prefix="$" /> <span style={{ fontSize: 15, color: '#fff', fontWeight: 700 }}>/ 1,000 listens</span></div></div>
            </motion.div>
          </div>

          <motion.form className="search" onSubmit={(e) => { e.preventDefault(); search() }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25, duration: 0.6, ease: EASE }}>
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Your name or channel" aria-label="Search your name or channel" />
            <Magnetic className="btn btn-white" strength={0.15}>Search</Magnetic>
          </motion.form>

          <div className="toolbar">
            <LayoutGroup>
              <div className="tabs">
                {tabs.map(([k, l]) => (
                  <button key={k} className={`tab${filter === k ? ' on' : ''}`} onClick={() => setFilter(k)}>
                    {filter === k && <motion.span layoutId="tabbg" className="tab-bg" transition={{ type: 'spring', stiffness: 400, damping: 32 }} />}
                    <span>{l} · {counts[k]}</span>
                  </button>
                ))}
              </div>
            </LayoutGroup>
            <motion.button className="btn btn-red btn-sm" whileTap={{ scale: 0.95 }} onClick={licenseAll} disabled={!counts.unclaimed} style={{ opacity: counts.unclaimed ? 1 : 0.4 }}>
              License all unclaimed
            </motion.button>
          </div>

          <motion.div className="grid" layout>
            {loading
              ? Array.from({ length: 6 }).map((_, k) => <motion.div key={k} className="skeleton" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: k * 0.05 }} />)
              : (
                <AnimatePresence mode="popLayout">
                  {shown.map((c) => (
                    <ClipCard key={c.id} c={c} playing={playing === c.id} onPlay={() => setPlaying(playing === c.id ? null : c.id)} onSet={(s) => setStatus(c.id, s)} />
                  ))}
                </AnimatePresence>
              )}
          </motion.div>
          {!loading && shown.length === 0 && <p className="muted" style={{ padding: '20px 0 60px' }}>Nothing here yet.</p>}
        </div>
      </section>

      <div className="find-foot">
        <div className="wrap">
          <div className="counts">
            <span><b>{counts.licensed}</b> licensed</span>
            <span><b>{counts.removing}</b> removing</span>
            <span><b>{counts.unclaimed}</b> unclaimed</span>
          </div>
          <div className="foot-actions">
            <span className="muted foot-note">Paid monthly from our creator fund. Remove any clip, any time.</span>
            <button className="btn btn-ghost btn-sm" onClick={() => setSheet(true)}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 16V4M7 9l5-5 5 5" /><path d="M4 16v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" /></svg>
              {files.length ? `Documents · ${files.length}` : 'Upload documents'}
            </button>
            <motion.button className="btn btn-red btn-sm" whileTap={{ scale: 0.96 }} disabled={!decided} style={{ opacity: decided ? 1 : 0.45 }} onClick={() => (files.length && agree ? startSubmit() : setSheet(true))}>
              Submit
            </motion.button>
          </div>
        </div>
      </div>
      <Footer />

      <AnimatePresence>
        {sheet && (
          <motion.div key="upload" className="sheet-scrim" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSheet(false)}>
            <motion.div className="up-sheet" data-lenis-prevent initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', stiffness: 300, damping: 32 }} onClick={(e) => e.stopPropagation()}>
              <div className="grab" />
              <h3>Upload documents</h3>
              <p className="muted">Show us you own or represent these clips. This is what lets us pay the right person.</p>
              <span className="up-lbl">Who are you?</span>
              <div className="up-roles">
                {ROLES.map(([k, t, s]) => (
                  <button key={k} className={`up-role${role === k ? ' on' : ''}`} onClick={() => setRole(k)}>
                    <span className="up-dot" /><span><b>{t}</b><small>{s}</small></span>
                  </button>
                ))}
              </div>
              <span className="up-lbl">{role === 'me' ? 'Proof of identity or channel ownership' : 'Letter of authority or licence'}</span>
              <label className={`up-drop${dragOver ? ' over' : ''}`} onDragOver={(e) => { e.preventDefault(); setDragOver(true) }} onDragLeave={() => setDragOver(false)}
                onDrop={(e) => { e.preventDefault(); setDragOver(false); addFiles(e.dataTransfer.files) }}>
                <input type="file" multiple accept=".pdf,.png,.jpg,.jpeg,.doc,.docx" onChange={(e) => e.target.files && addFiles(e.target.files)} />
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 16V4M7 9l5-5 5 5" /><path d="M4 16v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" /></svg>
                <b>Drop files or browse</b><small>PDF, image or Word · up to 10 MB each</small>
              </label>
              <AnimatePresence initial={false}>
                {files.map((f, k) => (
                  <motion.div key={f.name + k} className="up-file" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                    <span className="up-ic">{f.name.split('.').pop()?.toUpperCase().slice(0, 4)}</span>
                    <span className="up-fn"><b>{f.name}</b><small>{(f.size / 1024 / 1024).toFixed(2)} MB · ready</small></span>
                    <button onClick={() => setFiles(files.filter((_, j) => j !== k))} aria-label="Remove file">✕</button>
                  </motion.div>
                ))}
              </AnimatePresence>
              <TalkToSomeone account={account} role={ROLES.find(([k]) => k === role)?.[1] ?? role} clipCount={counts.licensed + counts.removing} />
              <label className="up-agree"><input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} /> I own or represent these clips and agree to the Creator terms.</label>
              <button className="btn btn-red" disabled={!files.length || !agree} style={{ width: '100%', opacity: files.length && agree ? 1 : 0.45 }} onClick={startSubmit}>
                Submit {counts.licensed + counts.removing} decision{counts.licensed + counts.removing === 1 ? '' : 's'}
              </button>
            </motion.div>
          </motion.div>
        )}
        {signIn && (
          <motion.div key="signin" className="sheet-scrim center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div initial={{ scale: 0.94, y: 24, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }} transition={{ type: 'spring', stiffness: 260, damping: 24 }}>
              <GoogleSignIn
                title="Sign in to submit"
                sub="So you can track this request and come back to license more clips."
                onClose={() => setSignIn(false)}
                onDone={(a) => { setAccount(a); setAcc(a); setSignIn(false); finalize(a) }}
              />
            </motion.div>
          </motion.div>
        )}
        {done && (
          <motion.div key="done" className="sheet-scrim center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="done-card" initial={{ scale: 0.9, y: 30, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }} transition={{ type: 'spring', stiffness: 260, damping: 22 }}>
              <motion.span className="done-tick" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: 'spring', stiffness: 400, damping: 15 }}>
                <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l5 5L20 7" /></svg>
              </motion.span>
              <h3>Submitted</h3>
              <p className="muted">Request <b style={{ color: '#fff' }}>{submitted?.id}</b>{account ? <> · signed in as {account.email}</> : null}. We'll check your documents within 1–2 working days.</p>
              <div className="done-rows">
                <div><b>{counts.licensed}</b><span>clips licensed · paid $2 per 1,000 listens</span></div>
                <div><b>{counts.removing}</b><span>coming down within 24 hours</span></div>
                <div><b>{files.length}</b><span>document{files.length === 1 ? '' : 's'} uploaded</span></div>
              </div>
              <button className="btn btn-white" style={{ width: '100%' }} onClick={() => { setDone(false); go('track') }}>Track my request</button>
              <button className="undo" style={{ alignSelf: 'center' }} onClick={() => setDone(false)}>License more clips</button>
            </motion.div>
          </motion.div>
        )}
        {toast && (
          <motion.div key="toast" className="toast" initial={{ opacity: 0, y: 30, x: '-50%', scale: 0.9 }} animate={{ opacity: 1, y: 0, x: '-50%', scale: 1 }} exit={{ opacity: 0, y: 20, x: '-50%' }} transition={{ type: 'spring', stiffness: 400, damping: 28 }}>
            <i style={{ background: toast.color }} />{toast.text}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
