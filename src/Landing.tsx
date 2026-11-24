import { useEffect, useRef, useState } from 'react'
import {
  AnimatePresence, motion, useAnimationFrame, useInView, useMotionTemplate, useMotionValue,
  useMotionValueEvent, useScroll, useSpring, useTransform, useVelocity, type MotionValue,
} from 'motion/react'
import { useApp } from './App'
import { ARC_CLIPS, TOPICS } from './data'
import { BASE, CountUp, EASE, Logo, Magnetic, PlayIcon, Waveform } from './ui'

const wrap = (min: number, max: number, v: number) => { const r = max - min; return ((((v - min) % r) + r) % r) + min }

/* ---------------- HERO ---------------- */
function Hero() {
  const { go } = useApp()
  const { scrollY } = useScroll()
  const comicY = useTransform(scrollY, [0, 800], [0, 160])
  const glowY = useTransform(scrollY, [0, 800], [0, -120])
  const fade = useTransform(scrollY, [0, 500], [1, 0])
  const mx = useMotionValue(-999), my = useMotionValue(-999)
  const sx = useSpring(mx, { stiffness: 120, damping: 20 }), sy = useSpring(my, { stiffness: 120, damping: 20 })

  // card tilt
  const rx = useSpring(0, { stiffness: 150, damping: 14 }), ry = useSpring(0, { stiffness: 150, damping: 14 })

  const words1 = ['License', 'your', 'content', 'to', 'us', 'and']
  const words2 = ['from', 'our', 'creator', 'fund.']
  let i = 0
  const W = ({ w }: { w: string }) => {
    const d = 0.35 + i++ * 0.055
    return (
      <span className="word">
        <motion.span initial={{ y: '110%' }} animate={{ y: 0 }} transition={{ duration: 0.9, ease: EASE, delay: d }}>{w}</motion.span>
        {' '}
      </span>
    )
  }

  return (
    <section
      className="hero"
      onPointerMove={(e) => { const r = e.currentTarget.getBoundingClientRect(); mx.set(e.clientX - r.left); my.set(e.clientY - r.top) }}
    >
      <div className="dotgrid" />
      <motion.div className="spot" style={{ left: sx, top: sy }} />
      <motion.div className="glow" style={{ y: glowY }} animate={{ scale: [1, 1.08, 1], opacity: [0.85, 1, 0.85] }} transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }} />
      <motion.img className="comic" src={BASE + 'brand/bg2.png'} alt="" style={{ y: comicY }} initial={{ opacity: 0, rotate: -8, scale: 0.9 }} animate={{ opacity: 0.07, rotate: 0, scale: 1 }} transition={{ duration: 1.6, ease: EASE }} />

      <motion.div className="wrap hero-grid" style={{ opacity: fade }}>
        <div>
          <motion.div className="pill" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: EASE, delay: 0.2 }}>
            <span className="pulse" /> We are an audio native social network of spoken clips.
          </motion.div>
          <h1 className="h1">
            {words1.map((w) => <W key={w} w={w} />)}
            <span className="word hl">
              <motion.span initial={{ y: '110%' }} animate={{ y: 0 }} transition={{ duration: 0.9, ease: EASE, delay: 0.35 + 6 * 0.055 }}>get&nbsp;paid</motion.span>
              <svg viewBox="0 0 300 20" preserveAspectRatio="none" aria-hidden="true">
                <motion.path d="M4 14 C 80 4, 200 4, 296 12" stroke="#EA1C25" strokeWidth="7" strokeLinecap="round" fill="none"
                  initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.9, ease: EASE, delay: 1.3 }} />
              </svg>
              {' '}
            </span>
            {(i = 7, words2.map((w) => <W key={w} w={w} />))}
          </h1>
          <motion.p className="hero-sub" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: EASE, delay: 1.0 }}>
            We source, clip and promote your content. And you get paid. It's as simple as that.
          </motion.p>
          <motion.div className="hero-cta" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: EASE, delay: 1.15 }}>
            <Magnetic className="btn btn-red" onClick={() => go('find')}>Find your content <span className="arrow">→</span></Magnetic>
            <a className="btn btn-ghost" href="mailto:company@speedradio.com">Talk to us</a>
          </motion.div>
        </div>

        <motion.div
          className="rate-wrap"
          id="rate"
          initial={{ opacity: 0, y: 60, rotateX: 25, scale: 0.92 }}
          animate={{ opacity: 1, y: 0, rotateX: 0, scale: 1 }}
          transition={{ duration: 1.1, ease: EASE, delay: 0.6 }}
          onPointerMove={(e) => { const r = e.currentTarget.getBoundingClientRect(); ry.set(((e.clientX - r.left) / r.width - 0.5) * 16); rx.set(-((e.clientY - r.top) / r.height - 0.5) * 16) }}
          onPointerLeave={() => { rx.set(0); ry.set(0) }}
        >
          <motion.div className="rate" style={{ rotateX: rx, rotateY: ry }}>
            <div className="rate-top" />
            <div className="rate-k">YOU GET</div>
            <div className="rate-v"><CountUp to={2} prefix="$" duration={1.6} /></div>
            <div className="rate-l">per 1,000 listens</div>
            <div className="rate-foot">
              <span className="stripe">Paid by <b>Stripe</b></span>
              <Waveform bars={16} height={28} color="#EA1C25" />
            </div>
          </motion.div>
        </motion.div>
      </motion.div>

      <motion.div className="scroll-cue" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2 }}>
        Scroll
        <motion.span animate={{ scaleY: [0, 1, 0], originY: [0, 0, 1] }} transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }} />
      </motion.div>
    </section>
  )
}

/* ---------------- ARC CAROUSEL ---------------- */
const TONES: Record<string, string> = {
  red: 'linear-gradient(180deg, rgba(194,39,46,.55), rgba(0,0,0,0) 70%)',
  yel: 'linear-gradient(180deg, rgba(215,189,48,.5), rgba(0,0,0,0) 70%)',
  cya: 'linear-gradient(180deg, rgba(45,177,169,.5), rgba(0,0,0,0) 70%)',
  cre: 'linear-gradient(180deg, rgba(203,192,182,.45), rgba(0,0,0,0) 70%)',
}
const STEP = 12
function ArcCard({ c, i, base }: { c: (typeof ARC_CLIPS)[number]; i: number; base: MotionValue<number> }) {
  const span = ARC_CLIPS.length * STEP
  const rotate = useTransform(base, (b) => wrap(-span / 2, span / 2, b + i * STEP))
  const opacity = useTransform(rotate, (r) => Math.max(0, 1 - Math.abs(r) / (span / 2)) * 1.4)
  return (
    <motion.div className="arc-card" style={{ rotate, opacity }}>
      <div className="bgwash" style={{ background: TONES[c.tone] }} />
      <div className="tex" />
      <div className="ac-top"><span>{c.show}</span><span className="chip chip-g">Licensed</span></div>
      <div className="ac-lead">{c.lead}</div>
      <div className="ac-quote">{c.quote}</div>
      <div className="ac-bot"><span className="play"><PlayIcon /></span><Waveform bars={14} height={24} /></div>
    </motion.div>
  )
}
function ArcCarousel() {
  const base = useMotionValue(0)
  const drag = useRef<{ x: number } | null>(null)
  const vel = useRef(-0.0035)
  useAnimationFrame((_, dt) => { if (!drag.current) base.set(base.get() + vel.current * dt) })
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-20%' })
  return (
    <section className="arc-sec" ref={ref}>
      <motion.div className="wrap arc-head" initial={{ opacity: 0, y: 30 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.9, ease: EASE }}>
        <span className="eyebrow">Spoken clips</span>
        <h2 className="h2">Your best moments,<br />heard by new people.</h2>
        <p className="muted" style={{ fontSize: 18 }}>Every clip is credited to you and linked to the original.</p>
      </motion.div>
      <div
        className="arc-stage"
        onPointerDown={(e) => { drag.current = { x: e.clientX }; (e.target as HTMLElement).setPointerCapture?.(e.pointerId) }}
        onPointerMove={(e) => { if (!drag.current) return; const dx = e.clientX - drag.current.x; drag.current.x = e.clientX; base.set(base.get() + dx * 0.045); vel.current = dx > 0 ? 0.0035 : -0.0035 }}
        onPointerUp={() => { drag.current = null }}
        onPointerCancel={() => { drag.current = null }}
      >
        {ARC_CLIPS.map((c, i) => <ArcCard key={i} c={c} i={i} base={base} />)}
      </div>
      <motion.div style={{ display: 'flex', justifyContent: 'center', padding: '0 0 90px', marginTop: -60, position: 'relative' }} initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ delay: 0.4, duration: 0.7, ease: EASE }}>
        <Magnetic className="btn btn-white" onClick={() => window.open('https://speedradio.com', '_blank')}>Experience our SpeedRadio <span className="arrow">→</span></Magnetic>
      </motion.div>
    </section>
  )
}

/* ---------------- MARQUEE ---------------- */
function MarqueeRow({ items, speed, outline = false }: { items: string[]; speed: number; outline?: boolean }) {
  const baseX = useMotionValue(0)
  const { scrollY } = useScroll()
  const v = useSpring(useVelocity(scrollY), { damping: 50, stiffness: 400 })
  const factor = useTransform(v, [0, 1000], [0, 4], { clamp: false })
  const skew = useTransform(v, [-2000, 2000], [8, -8])
  const x = useTransform(baseX, (b) => `${wrap(-50, 0, b)}%`)
  const dir = useRef(1)
  useAnimationFrame((_, dt) => {
    let move = dir.current * speed * (dt / 1000)
    if (factor.get() < 0) dir.current = -1; else if (factor.get() > 0) dir.current = 1
    move += dir.current * move * factor.get()
    baseX.set(baseX.get() + move)
  })
  const row = [...items, ...items]
  return (
    <div style={{ overflow: 'hidden' }}>
      <motion.div className={`marq-row${outline ? ' out' : ''}`} style={{ x, skewX: skew }}>
        {[0, 1].map((k) => row.map((t, j) => (
          <span key={`${k}-${j}`}>{t}<img src={BASE + 'brand/logo-mark.png'} alt="" /></span>
        )))}
      </motion.div>
    </div>
  )
}
function Marquee() {
  return (
    <section className="marq">
      <MarqueeRow items={TOPICS} speed={-3} />
      <MarqueeRow items={[...TOPICS].reverse()} speed={3} outline />
    </section>
  )
}

/* ---------------- STATEMENT (scroll reveal) ---------------- */
function RevealWord({ w, p, a, b, red }: { w: string; p: MotionValue<number>; a: number; b: number; red: boolean }) {
  const o = useTransform(p, [a, b], [0.12, 1])
  const y = useTransform(p, [a, b], [8, 0])
  return <motion.span className="w" style={{ opacity: o, y, color: red ? '#EA1C25' : '#fff' }}>{w}</motion.span>
}
export function Statement() {
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 0.85', 'end 0.5'] })
  const text = "We source, clip and promote your content. And you get paid. It's as simple as that."
  const words = text.split(' ')
  return (
    <section className="statement" ref={ref}>
      <div className="wrap">
        <p>
          {words.map((w, k) => (
            <RevealWord key={k} w={w} p={scrollYProgress} a={k / words.length} b={(k + 1) / words.length} red={w === 'get' || w === 'paid.'} />
          ))}
        </p>
      </div>
    </section>
  )
}

/* ---------------- HOW IT WORKS (sticky) ---------------- */
function Typer({ text }: { text: string }) {
  const [n, setN] = useState(0)
  useEffect(() => { setN(0); const t = setInterval(() => setN((v) => (v < text.length ? v + 1 : v)), 90); return () => clearInterval(t) }, [text])
  return <>{text.slice(0, n)}<span className="caret" /></>
}
function ScreenFind() {
  return (
    <motion.div key="s0" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.45, ease: EASE }}>
      <div style={{ fontSize: 30, fontWeight: 800, letterSpacing: '-0.03em' }}>Find your content</div>
      <div className="mini-search"><div className="mini-input"><Typer text="Maya Rao" /></div><span className="btn btn-white btn-sm" style={{ height: 50 }}>Search</span></div>
      {[['MR', '#FEDD01', 'Maya Rao', '@mayarao · 12 clips'], ['LA', '#09D1C7', 'The Long Answer', 'Podcast · 5 clips']].map(([i, c, t, s], k) => (
        <motion.div key={t} className="mini-res" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1 + k * 0.15, duration: 0.5, ease: EASE }}>
          <span className="ring" style={{ background: c }}>{i}</span>
          <div style={{ flex: 1 }}><div style={{ fontWeight: 700 }}>{t}</div><div style={{ fontSize: 12, color: '#8a8a8a' }}>{s}</div></div>
          <span className="chip chip-n">That's me</span>
        </motion.div>
      ))}
    </motion.div>
  )
}
function ScreenLicense() {
  const [done, setDone] = useState(false)
  useEffect(() => { const t = setTimeout(() => setDone(true), 1100); return () => clearTimeout(t) }, [])
  const items = [['Here\'s the thing,', "you can't pay back sleep on a Saturday."], ['It isn\'t clever.', 'Small, boring, every single day.']]
  return (
    <motion.div key="s1" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.45, ease: EASE }}>
      <div style={{ fontSize: 30, fontWeight: 800, letterSpacing: '-0.03em' }}>License it</div>
      <div className="mini-clips">
        {items.map(([l, q], k) => {
          const lic = k === 1 || done
          return (
            <motion.div layout key={k} className="mini-clip" style={{ borderColor: lic ? '#1f5a37' : undefined }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ fontSize: 12, color: '#8a8a8a' }}>The Long Answer</span>
                <AnimatePresence mode="wait"><motion.span key={String(lic)} initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className={`chip ${lic ? 'chip-g' : 'chip-n'}`}>{lic ? 'Licensed' : 'Unclaimed'}</motion.span></AnimatePresence>
              </div>
              <div style={{ fontSize: 13, color: '#666', fontWeight: 600 }}>{l}</div>
              <div className="q">{q}</div>
              {!lic && <div className="mini-btns"><motion.span animate={{ scale: [1, 0.94, 1] }} transition={{ delay: 0.8, duration: 0.3 }} style={{ background: '#EA1C25' }}>License it</motion.span><span style={{ border: '1.5px solid #3a3a3a' }}>Remove</span></div>}
            </motion.div>
          )
        })}
      </div>
    </motion.div>
  )
}
function ScreenPaid() {
  return (
    <motion.div key="s2" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.45, ease: EASE }}>
      <div style={{ fontSize: 30, fontWeight: 800, letterSpacing: '-0.03em' }}>Get paid by Stripe</div>
      <div className="payout">
        <div className="payout-row"><span className="muted">You get</span><b style={{ color: '#EA1C25', fontSize: 22 }}>$2 per 1,000 listens</b></div>
        <div className="payout-row"><span className="muted">Licensed clips</span><b>12</b></div>
        <div className="payout-row"><span className="muted">Paid</span><b>Every month, by Stripe</b></div>
        <div className="payout-row"><span className="muted">Next payout</span><b>15 Dec</b></div>
      </div>
      <motion.div className="btn btn-red" style={{ marginTop: 18, width: '100%' }} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>Connect Stripe</motion.div>
    </motion.div>
  )
}
function StepBar({ p, i }: { p: MotionValue<number>; i: number }) {
  const s = useTransform(p, [i / 3, (i + 1) / 3], [0, 1])
  return <div className="bar"><motion.i style={{ scaleX: s }} /></div>
}
export function HowItWorks() {
  const ref = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] })
  const enter = useScroll({ target: ref, offset: ['start end', 'start start'] }).scrollYProgress
  const scale = useTransform(enter, [0, 1], [0.8, 1])
  const rotX = useTransform(enter, [0, 1], [24, 0])
  const [step, setStep] = useState(0)
  useMotionValueEvent(scrollYProgress, 'change', (v) => setStep(v < 0.34 ? 0 : v < 0.67 ? 1 : 2))
  const steps = [
    ['1', '#FEDD01', 'Find your content', 'Search your name or channel.'],
    ['2', '#09D1C7', 'License it', "Choose what we can use. Remove anything you don't want."],
    ['3', '#EA1C25', 'Get paid by Stripe', 'Straight to your bank, every month.'],
  ]
  return (
    <section className="how" id="how" ref={ref}>
      <div className="how-sticky">
        <div className="wrap how-grid">
          <div>
            <span className="eyebrow">How it works</span>
            <h2 className="h2" style={{ marginTop: 14, fontSize: 'clamp(32px, 3.4vw, 46px)' }}>Find your content, license it and get paid by Stripe.</h2>
            <div className="steps">
              {steps.map(([n, c, t, d], k) => (
                <motion.div key={n} className="step" animate={{ opacity: step === k ? 1 : 0.38 }} transition={{ duration: 0.4 }}>
                  <span className="step-n" style={{ background: c, color: c === '#EA1C25' ? '#fff' : '#111' }}>{n}</span>
                  <div style={{ flex: 1 }}>
                    <h3>{t}</h3><p>{d}</p>
                    <StepBar p={scrollYProgress} i={k} />
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
          <div style={{ perspective: 1400 }}>
            <motion.div className="browser" style={{ scale, rotateX: rotX }}>
              <div className="browser-top"><i /><i /><i /><div className="url">speedradio.com/creators</div></div>
              <div className="screen">
                <AnimatePresence mode="wait">
                  {step === 0 && <ScreenFind key="a" />}
                  {step === 1 && <ScreenLicense key="b" />}
                  {step === 2 && <ScreenPaid key="c" />}
                </AnimatePresence>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ---------------- FLOATING TAGS ---------------- */
const TAGS = [
  { t: 'Credited on every play', c: '#FEDD01', to: [-420, -200], from: [-900, -500], r: -8 },
  { t: 'Linked to your original', c: '#09D1C7', to: [380, -230], from: [900, -560], r: 6 },
  { t: 'We clip it', c: '#EFE2D5', to: [-500, 40], from: [-1100, 80], r: 4 },
  { t: 'We promote it', c: '#EA1C25', to: [470, 60], from: [1100, 120], r: -5 },
  { t: 'Paid by Stripe', c: '#fff', to: [-300, 240], from: [-700, 700], r: 7 },
  { t: 'Remove any time', c: '#FEDD01', to: [320, 250], from: [800, 700], r: -6 },
]
function FTag({ tag, p }: { tag: (typeof TAGS)[number]; p: MotionValue<number> }) {
  const x = useTransform(p, [0, 0.55], [tag.from[0], tag.to[0]])
  const y = useTransform(p, [0, 0.55], [tag.from[1], tag.to[1]])
  const rotate = useTransform(p, [0, 0.55, 1], [tag.r * 4, tag.r, tag.r * 0.4])
  const opacity = useTransform(p, [0, 0.25], [0, 1])
  return <motion.div className="ftag" style={{ x, y, rotate, opacity, translateX: '-50%', translateY: '-50%', background: tag.c, color: tag.c === '#EA1C25' ? '#fff' : '#111' }}>{tag.t}</motion.div>
}
export function FloatingTags() {
  const ref = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] })
  const b = useTransform(scrollYProgress, [0, 0.5], [20, 0])
  const filter = useMotionTemplate`blur(${b}px)`
  const s = useTransform(scrollYProgress, [0, 0.5], [0.85, 1])
  return (
    <section className="tags" ref={ref}>
      <div className="tags-sticky">
        {TAGS.map((t) => <FTag key={t.t} tag={t} p={scrollYProgress} />)}
        <motion.div className="tags-center" style={{ filter, scale: s }}>
          <div className="big"><em>$2</em> for every<br />1,000 listens.</div>
          <div className="small">Paid every month, straight to your bank.</div>
        </motion.div>
      </div>
    </section>
  )
}

/* ---------------- FOUNDING CREATORS ---------------- */
const PERKS = [
  'A guaranteed quarterly minimum of [AMOUNT], on top of per-listen earnings',
  'We clip and upload your back catalogue for you, and you approve every clip',
  'Featured placement on Stations at launch',
  'A direct line to the founders',
]
function Check() {
  return <svg width="22" height="22" viewBox="0 0 22 22" aria-hidden="true"><path d="M5 11.5l4 4 8-9" stroke="#EA1C25" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" fill="none" /></svg>
}
export function Founding() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-15%' })
  return (
    <section className="founding">
      <div className="wrap">
        <motion.div ref={ref} className="founding-card" initial={{ opacity: 0, y: 60, scale: 0.97 }} animate={inView ? { opacity: 1, y: 0, scale: 1 } : {}} transition={{ duration: 0.9, ease: EASE }}>
          <div className="founding-l">
            <span className="eyebrow">By invitation</span>
            <h2 className="h2" style={{ fontSize: 'clamp(36px, 4vw, 52px)' }}>Founding Creators</h2>
            <p className="muted" style={{ fontSize: 18, lineHeight: 1.55 }}>We're inviting 100 voices in science, ideas, business and news to launch SpeedRadio with us, and to help prove that short-form can treat creators fairly.</p>
            <Magnetic className="btn btn-red" onClick={() => { window.location.href = 'mailto:company@speedradio.com?subject=Founding%20Creators' }}>Request an invitation <span className="arrow">→</span></Magnetic>
          </div>
          <ul className="founding-r">
            {PERKS.map((p, k) => (
              <motion.li key={k} initial={{ opacity: 0, x: 24 }} animate={inView ? { opacity: 1, x: 0 } : {}} transition={{ duration: 0.6, ease: EASE, delay: 0.3 + k * 0.1 }}>
                <Check /><span>{p}</span>
              </motion.li>
            ))}
          </ul>
        </motion.div>
      </div>
    </section>
  )
}

/* ---------------- FAQ ---------------- */
const FAQS = [
  ['Do I give up any rights?', 'No. Your licence to SpeedRadio is non-exclusive and you can withdraw it at any time. You own your work.'],
  ['Who can join?', 'Anyone who owns original spoken audio or video they can clip: scientists, commentators, podcasters, news and opinion creators. You must own the rights to what you upload.'],
  ['Does it cost anything?', 'No. There are no fees to join, claim or upload.'],
  ['Why is the rate higher than other platforms?', 'Because we believe voices are the product. The fund is capped so the promise stays sustainable, and we publish the effective rate every month.'],
]
export function Faq() {
  const [open, setOpen] = useState<number[]>([0])
  const toggle = (k: number) => setOpen((o) => (o.includes(k) ? o.filter((x) => x !== k) : [...o, k]))
  return (
    <section className="faq" id="faq">
      <div className="wrap">
        <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-15%' }} transition={{ duration: 0.7, ease: EASE }}>
          <span className="eyebrow">FAQ</span>
          <h2 className="h2" style={{ marginTop: 12 }}>Questions</h2>
        </motion.div>
        <div className="faq-list">
          {FAQS.map(([q, a], k) => {
            const isOpen = open.includes(k)
            return (
              <motion.div key={k} className={`faq-item${isOpen ? ' open' : ''}`} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-10%' }} transition={{ duration: 0.5, ease: EASE, delay: k * 0.06 }}>
                <button className="faq-q" onClick={() => toggle(k)} aria-expanded={isOpen}>
                  <span>{q}</span>
                  <motion.span className="faq-ic" animate={{ rotate: isOpen ? 45 : 0 }} transition={{ type: 'spring', stiffness: 300, damping: 20 }}>+</motion.span>
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div key="a" initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.35, ease: EASE }} style={{ overflow: 'hidden' }}>
                      <p className="faq-a">{a}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

/* ---------------- FINAL ---------------- */
export function Final() {
  const { go } = useApp()
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-20%' })
  const text = "It's as simple as that."
  return (
    <section className="final" ref={ref}>
      <div className="washbg" />
      <img className="comic2" src={BASE + 'brand/bg4.png'} alt="" />
      <div className="wrap final-in">
        <h2 aria-label={text}>
          {text.split(' ').map((word, wi, arr) => {
            const offset = arr.slice(0, wi).join(' ').length + (wi ? 1 : 0)
            return (
              <span key={wi} style={{ display: 'inline-block', whiteSpace: 'nowrap' }}>
                {word.split('').map((ch, k) => (
                  <motion.span key={k} className="ch" initial={{ y: 80, opacity: 0, rotate: 8 }} animate={inView ? { y: 0, opacity: 1, rotate: 0 } : {}} transition={{ duration: 0.8, ease: EASE, delay: (offset + k) * 0.03 }}>
                    {ch}
                  </motion.span>
                ))}
                {wi < arr.length - 1 && ' '}
              </span>
            )
          })}
        </h2>
        <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={inView ? { opacity: 1, scale: 1 } : {}} transition={{ delay: 0.7, duration: 0.6, ease: EASE }}>
          <Magnetic className="btn btn-white" onClick={() => go('find')}>Find your content <span className="arrow">→</span></Magnetic>
        </motion.div>
      </div>
    </section>
  )
}

export function Footer() {
  return (
    <footer className="footer">
      <div className="wrap">
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}><Logo /><span>© SpeedRadio, Inc.</span></div>
        <nav><a href="#/">Request a removal</a><a href="#/">Creator terms</a><a href="mailto:company@speedradio.com">company@speedradio.com</a></nav>
      </div>
    </footer>
  )
}

export default function Landing() {
  return (
    <>
      <Hero />
      <ArcCarousel />
      <Marquee />
      <Statement />
      <HowItWorks />
      <FloatingTags />
      <Founding />
      <Faq />
      <Final />
      <Footer />
    </>
  )
}
