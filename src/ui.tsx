import { useEffect, useRef, useState, type ReactNode } from 'react'
import { animate, AnimatePresence, motion, useInView, useMotionValue, useMotionValueEvent, useScroll, useSpring } from 'motion/react'
import { useApp } from './App'

export const BASE = import.meta.env.BASE_URL
export const EASE = [0.22, 1, 0.36, 1] as const

export function Logo() {
  return (
    <span className="logo">
      <img src={BASE + 'brand/logo-mark.png'} alt="" />
      SpeedRadio
    </span>
  )
}

export function PlayIcon({ size = 14, color = '#111' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" aria-hidden="true">
      <path d="M2 1.2v11.6a.8.8 0 0 0 1.2.7l9.6-5.8a.8.8 0 0 0 0-1.4L3.2.5A.8.8 0 0 0 2 1.2Z" fill={color} />
    </svg>
  )
}

/** Button that leans toward the cursor. */
export function Magnetic({ children, className = '', onClick, strength = 0.35 }: { children: ReactNode; className?: string; onClick?: () => void; strength?: number }) {
  const ref = useRef<HTMLButtonElement>(null)
  const x = useSpring(0, { stiffness: 220, damping: 16 })
  const y = useSpring(0, { stiffness: 220, damping: 16 })
  return (
    <motion.button
      ref={ref}
      className={className}
      style={{ x, y }}
      whileTap={{ scale: 0.96 }}
      onClick={onClick}
      onPointerMove={(e) => {
        const r = ref.current!.getBoundingClientRect()
        x.set((e.clientX - (r.left + r.width / 2)) * strength)
        y.set((e.clientY - (r.top + r.height / 2)) * strength)
      }}
      onPointerLeave={() => { x.set(0); y.set(0) }}
    >
      {children}
    </motion.button>
  )
}

/** Looping audio waveform. */
export function Waveform({ bars = 22, playing = true, color = '#fff', height = 30 }: { bars?: number; playing?: boolean; color?: string; height?: number }) {
  const seeds = useRef(Array.from({ length: bars }, (_, i) => 0.25 + ((i * 37) % 70) / 100))
  return (
    <span className="wave" style={{ height }}>
      {seeds.current.map((s, i) => (
        <motion.i
          key={i}
          style={{ background: color }}
          animate={playing ? { height: [height * s * 0.4, height * s, height * s * 0.55, height * s * 0.9] } : { height: height * s * 0.35 }}
          transition={playing ? { duration: 1.1 + (i % 5) * 0.12, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut', delay: i * 0.03 } : { duration: 0.3 }}
        />
      ))}
    </span>
  )
}

/** Counts up from 0 when scrolled into view. */
export function CountUp({ to, prefix = '', decimals = 0, duration = 1.4 }: { to: number; prefix?: string; decimals?: number; duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, margin: '-10%' })
  const mv = useMotionValue(0)
  const [text, setText] = useState(prefix + (0).toFixed(decimals))
  useMotionValueEvent(mv, 'change', (v) => setText(prefix + v.toFixed(decimals)))
  useEffect(() => {
    if (!inView) return
    const c = animate(mv, to, { duration, ease: EASE })
    return () => c.stop()
  }, [inView, to, duration, mv])
  return <span ref={ref}>{text}</span>
}

/** The one menu used everywhere: desktop nav and the mobile hamburger. */
export function useMenuItems(): [string, () => void][] {
  const { go, scrollTo } = useApp()
  return [
    ['How it works', () => scrollTo('#how')],
    ['FAQ', () => scrollTo('#faq')],
    ['Track request', () => go('track')],
    ['Find your content', () => go('find')],
    ['Talk to us', () => go('contact')],
  ]
}

export function MobileMenu({ open, onClose }: { open: boolean; onClose: () => void }) {
  const items = useMenuItems()
  const { go } = useApp()
  useEffect(() => { document.documentElement.style.overflow = open ? 'hidden' : ''; return () => { document.documentElement.style.overflow = '' } }, [open])
  return (
    <AnimatePresence>
      {open && (
        <motion.div className="b-menu" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
          <div className="b-head">
            <div className="b-brand"><img src={BASE + 'brand/logo-mark.png'} alt="" /><b>SpeedRadio</b><i /><span>For creators</span></div>
            <button className="b-burger open" onClick={onClose} aria-label="Close menu"><i /><i /><i /></button>
          </div>
          <nav className="b-menu-links">
            {items.map(([label, fn], k) => (
              <motion.button key={label} onClick={() => { onClose(); setTimeout(fn, 260) }} initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 12 }} transition={{ duration: 0.45, ease: EASE, delay: 0.05 + k * 0.05 }}>
                {label}<span>→</span>
              </motion.button>
            ))}
          </nav>
          <motion.div className="b-menu-foot" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
            <button className="btn btn-red" onClick={() => { onClose(); go('find') }}>License my content</button>
            <span>$2 for every 1,000 listens · Paid from our creator fund</span>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export function Nav() {
  const { go, route } = useApp()
  const items = useMenuItems()
  const { scrollY } = useScroll()
  const [compact, setCompact] = useState(false)
  const [menu, setMenu] = useState(false)
  useMotionValueEvent(scrollY, 'change', (v) => setCompact(v > 40))
  return (<>
    <div className="nav-shell">
      <motion.nav
        className="nav"
        initial={{ y: -40, opacity: 0 }}
        animate={{ y: 0, opacity: 1, paddingLeft: compact ? 14 : 18 }}
        transition={{ duration: 0.7, ease: EASE, delay: 0.1 }}
        style={{ width: compact ? 'min(760px, calc(100vw - 24px))' : 'min(1120px, calc(100vw - 24px))', transition: 'width .5s cubic-bezier(.22,1,.36,1)' }}
      >
        <button onClick={() => go('home')} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Logo />
          <span className="tag-chip">For creators</span>
        </button>
        <div className="nav-links">
          {items.filter(([l]) => l !== 'Find your content').map(([label, fn]) => (
            <button key={label} className={(label === 'Track request' && route === 'track') || (label === 'Talk to us' && route === 'contact') ? 'on' : ''} onClick={fn}>{label}</button>
          ))}
        </div>
        <div className="nav-right">
          {route !== 'find' && (
            <Magnetic className="btn btn-red btn-sm" onClick={() => go('find')} strength={0.2}>
              Find your content <span className="arrow">→</span>
            </Magnetic>
          )}
          <button className="b-burger nav-burger" onClick={() => setMenu(true)} aria-label="Open menu"><i /><i /><i /></button>
        </div>
      </motion.nav>
    </div>
    <MobileMenu open={menu} onClose={() => setMenu(false)} />
  </>)
}
