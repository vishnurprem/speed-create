import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useMotionValue, useMotionValueEvent, useScroll, useSpring, useTransform } from 'motion/react'
import { useApp } from './App'
import { BASE, EASE, Magnetic } from './ui'
import { Faq, Final, Footer, HowItWorks, Statement } from './Landing'
import { APP_CLIPS, FeedCard, StationProfile, YOUR_CLIP, useClipPlayer, type AppClip } from './AppFeed'

function useIsMobile(q = '(max-width: 900px)') {
  const [m, setM] = useState(() => window.matchMedia(q).matches)
  useEffect(() => { const mq = window.matchMedia(q); const f = () => setM(mq.matches); mq.addEventListener('change', f); return () => mq.removeEventListener('change', f) }, [q])
  return m
}

const Tick = ({ delay = 0 }: { delay?: number }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#EA1C25" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <motion.path d="M5 12l5 5L20 7" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.5, ease: EASE, delay }} />
  </svg>
)
const HEAD = ['The', 'social', 'network', 'for', 'spoken', 'clips.']
const Up = ({ size = 26 }: { size?: number }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#EA1C25" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M6 15l6-6 6 6" /></svg>

function Pitch({ compact }: { compact?: boolean }) {
  const { go } = useApp()
  return (
    <div className={`b-pitch${compact ? ' compact' : ''}`}>
      <h1 aria-label="The social network for spoken clips.">
        {HEAD.slice(0, 4).map((w, k) => (
          <span className="word" key={k}>
            <motion.span initial={{ y: '110%', rotate: 4 }} animate={{ y: 0, rotate: 0 }} transition={{ duration: 0.9, ease: EASE, delay: 0.15 + k * 0.07 }}>{w}</motion.span>
            {' '}
          </span>
        ))}
        <span className="b-hl">
          {HEAD.slice(4).map((w, k) => (
            <span className="word" key={w}>
              <motion.span initial={{ y: '110%', rotate: 4 }} animate={{ y: 0, rotate: 0 }} transition={{ duration: 0.9, ease: EASE, delay: 0.15 + (k + 4) * 0.07 }}>{w}</motion.span>
              {k === 0 && ' '}
            </span>
          ))}
          <svg viewBox="0 0 300 20" preserveAspectRatio="none" aria-hidden="true">
            <motion.path d="M4 13 C 90 4, 210 4, 296 11" stroke="#EA1C25" strokeWidth="6" strokeLinecap="round" fill="none" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.9, ease: EASE, delay: 0.95 }} />
          </svg>
        </span>
      </h1>
      <motion.p initial={{ opacity: 0, y: 20, filter: 'blur(6px)' }} animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }} transition={{ duration: 0.8, ease: EASE, delay: 0.7 }}>
        People scroll short clips from voices they love. License your clips to us and get paid for every listen.
      </motion.p>
      <ul>
        {['$2 for every 1,000 listens', 'Paid monthly from our creator fund', 'Non-exclusive. Remove anything, any time.'].map((t, k) => (
          <motion.li key={t} initial={{ opacity: 0, x: -18 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.55, ease: EASE, delay: 0.95 + k * 0.12 }}><Tick delay={1.05 + k * 0.12} />{t}</motion.li>
        ))}
      </ul>
      {!compact && (
        <motion.div className="b-pitch-cta" initial={{ opacity: 0, y: 16, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ delay: 1.35, duration: 0.6, ease: EASE }}>
          <Magnetic className="btn btn-red" onClick={() => go('find')}>License my content <span className="arrow">→</span></Magnetic>
          <span className="muted" style={{ fontSize: 13 }}>Free. Takes about 2 minutes.</span>
        </motion.div>
      )}
    </div>
  )
}

function YourClipExtra({ showCta }: { showCta: boolean }) {
  const { go } = useApp()
  return (
    <>
      <div className="you-rate"><strong>$2</strong><span>for every 1,000 listens<br />Paid monthly from our creator fund</span></div>
      {showCta && <motion.button className="btn btn-red" style={{ width: '100%', height: 48, marginBottom: 4 }} whileTap={{ scale: 0.97 }} onClick={() => go('find')}>License my content →</motion.button>}
    </>
  )
}

function Deck() {
  const { go, scrollTo } = useApp()
  const mobile = useIsMobile()
  const ref = useRef<HTMLElement>(null)
  const player = useClipPlayer()
  const clipsN = APP_CLIPS.length + 1 // + "your clip" card
  const N = mobile ? clipsN + 1 : clipsN
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] })
  const [idx, setIdx] = useState(0)
  useMotionValueEvent(scrollYProgress, 'change', (v) => setIdx(Math.min(N - 1, Math.max(0, Math.floor(v * N * 0.9999)))))
  const clipIdx = mobile ? idx - 1 : idx
  const FEED_ALL = [...APP_CLIPS, YOUR_CLIP]
  const activeClip: AppClip | undefined = FEED_ALL[clipIdx]
  const [station, setStation] = useState<AppClip | null>(null)
  const [menu, setMenu] = useState(false)
  // mouse-driven depth for the desktop hero
  const mx = useMotionValue(0), my = useMotionValue(0)
  const sx = useSpring(mx, { stiffness: 90, damping: 18 }), sy = useSpring(my, { stiffness: 90, damping: 18 })
  const tiltY = useTransform(sx, [-0.5, 0.5], [-8, 8]), tiltX = useTransform(sy, [-0.5, 0.5], [6, -6])
  const glowX = useTransform(sx, [-0.5, 0.5], [-40, 40]), glowY = useTransform(sy, [-0.5, 0.5], [-30, 30])
  const comicX = useTransform(sx, [-0.5, 0.5], [18, -18]), comicY = useTransform(sy, [-0.5, 0.5], [14, -14])
  // the visible feed card owns the audio; if you paused, nothing starts by itself
  useEffect(() => { if (activeClip && !station) player.load(activeClip) ; else if (!activeClip && !station) player.pause() }, [activeClip?.id]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { document.documentElement.style.overflow = menu ? 'hidden' : ''; return () => { document.documentElement.style.overflow = '' } }, [menu])

  const next = () => {
    const el = ref.current; if (!el) return
    const top = el.getBoundingClientRect().top + window.scrollY
    const per = (el.offsetHeight - window.innerHeight) / Math.max(1, N - 1)
    scrollTo(top + per * Math.min(N - 1, idx + 1) + 2)
  }
  const jump = (sel: string) => { setMenu(false); setTimeout(() => scrollTo(sel), 250) }
  const links: [string, () => void][] = [
    ['How it works', () => jump('#how')],
    ['Questions', () => jump('#faq')],
    ['Find your content', () => { setMenu(false); go('find') }],
    ['Track my request', () => { setMenu(false); go('track') }],
    ['Talk to us', () => { setMenu(false); window.location.href = 'mailto:company@speedradio.com' }],
  ]

  return (
    <section className="b-deck" ref={ref} style={{ height: `${N * 100}svh` }}>
      <div
        className="b-sticky"
        onPointerMove={(e) => { if (mobile) return; const r = e.currentTarget.getBoundingClientRect(); const nx = (e.clientX - r.left) / r.width - 0.5, ny = (e.clientY - r.top) / r.height - 0.5; mx.set(nx); my.set(ny) }}
        onPointerLeave={() => { mx.set(0); my.set(0) }}
      >
        <motion.div className="b-glow" style={{ x: glowX, y: glowY }} animate={{ scale: [1, 1.08, 1], opacity: [0.85, 1, 0.85] }} transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }} />
        <motion.img className="b-comic" src={BASE + 'brand/bg2.png'} alt="" style={{ x: comicX, y: comicY }} initial={{ opacity: 0, rotate: -10, scale: 0.9 }} animate={{ opacity: 0.06, rotate: 0, scale: 1 }} transition={{ duration: 1.6, ease: EASE }} />
        <div className="b-grid">
          {!mobile && (
            <div className="b-left">
              <Pitch />
              <div className="b-dots">
                {Array.from({ length: clipsN }).map((_, k) => <motion.span key={k} animate={{ width: k === idx ? 28 : 8, background: k === idx ? '#EA1C25' : '#3a3a3a' }} />)}
                <span className="muted" style={{ fontSize: 13, marginLeft: 8 }}>Scroll the feed · tap a clip to listen</span>
              </div>
            </div>
          )}
          <div className="b-phone-wrap">
          <motion.div
            className="b-phone"
            style={mobile ? undefined : { rotateX: tiltX, rotateY: tiltY }}
            initial={mobile ? { opacity: 0 } : { opacity: 0, y: 120, rotateX: 22, rotate: -6, scale: 0.9 }}
            animate={mobile ? { opacity: 1 } : { opacity: 1, y: 0, rotate: 0, scale: 1 }}
            transition={{ duration: 1.2, ease: EASE, delay: mobile ? 0 : 0.35 }}
          >
            {mobile && (
              <div className="b-head">
                <div className="b-brand"><img src={BASE + 'brand/logo-mark.png'} alt="" /><b>SpeedRadio</b><i /><span>For creators</span></div>
                <button className={`b-burger${menu ? ' open' : ''}`} onClick={() => setMenu(!menu)} aria-label={menu ? 'Close menu' : 'Open menu'} aria-expanded={menu}><i /><i /><i /></button>
              </div>
            )}
            <div className="b-viewport">
              <motion.div className="b-track-y" animate={{ y: `${-idx * 100}%` }} transition={{ type: 'spring', stiffness: 170, damping: 26 }}>
                {mobile && (
                  <div className="b-slide b-slide-pitch">
                    <img className="b-pitch-comic" src={BASE + 'brand/bg2.png'} alt="" />
                    <div style={{ flex: 1 }} />
                    <Pitch compact />
                    <div style={{ flex: 1.15 }} />
                    <button className="b-swipe" onClick={next}>
                      <motion.span animate={{ y: [0, -6, 0] }} transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}><Up /></motion.span>
                      Swipe up to hear what it's like
                    </button>
                  </div>
                )}
                {APP_CLIPS.map((c, k) => (
                  <div className="b-slide b-slide-feed" key={c.id}>
                    <FeedCard clip={c} active={clipIdx === k} player={player} onStation={() => setStation(c)} onNext={next} />
                  </div>
                ))}
                <div className="b-slide b-slide-feed"><FeedCard clip={YOUR_CLIP} active={clipIdx === APP_CLIPS.length} player={player} onStation={() => go('find')} extra={<YourClipExtra showCta={!mobile} />} /></div>
              </motion.div>
              <AnimatePresence>
                {station && <StationProfile key={station.id} clip={station} player={player} onBack={() => setStation(null)} />}
              </AnimatePresence>
            </div>
          </motion.div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {mobile && menu && (
          <motion.div className="b-menu" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
            <div className="b-head">
              <div className="b-brand"><img src={BASE + 'brand/logo-mark.png'} alt="" /><b>SpeedRadio</b><i /><span>For creators</span></div>
              <button className="b-burger open" onClick={() => setMenu(false)} aria-label="Close menu"><i /><i /><i /></button>
            </div>
            <nav className="b-menu-links">
              {links.map(([label, fn], k) => (
                <motion.button key={label} onClick={fn} initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 12 }} transition={{ duration: 0.45, ease: EASE, delay: 0.05 + k * 0.05 }}>
                  {label}<span>→</span>
                </motion.button>
              ))}
            </nav>
            <motion.div className="b-menu-foot" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
              <button className="btn btn-red" onClick={() => { setMenu(false); go('find') }}>License my content</button>
              <span>$2 for every 1,000 listens · Paid from our creator fund</span>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {mobile && (
        <div className="b-cta">
          <button className="btn btn-red" onClick={() => go('find')}>License my content</button>
          <span>Free. Takes about 2 minutes.</span>
        </div>
      )}
    </section>
  )
}

export default function OptionB() {
  return (
    <div className="optb">
      <Deck />
      <Statement />
      <HowItWorks />
      <Faq />
      <Final />
      <Footer />
    </div>
  )
}
