import { useEffect, useRef, useState, type ReactNode } from 'react'
import { animate, motion, useInView, useMotionValue, useMotionValueEvent, useScroll, useSpring } from 'motion/react'
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

export function Nav() {
  const { go, scrollTo, route } = useApp()
  const { scrollY } = useScroll()
  const [compact, setCompact] = useState(false)
  useMotionValueEvent(scrollY, 'change', (v) => setCompact(v > 40))
  return (
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
          <button onClick={() => scrollTo('#how')}>How it works</button>
          <button onClick={() => scrollTo('#rate')}>What you get</button>
        </div>
        {route !== 'find' ? (
          <Magnetic className="btn btn-red btn-sm" onClick={() => go('find')} strength={0.2}>
            Find your content <span className="arrow">→</span>
          </Magnetic>
        ) : (
          <button className="btn btn-ghost btn-sm" onClick={() => go('home')}>← Back</button>
        )}
      </motion.nav>
    </div>
  )
}
