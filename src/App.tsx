import { createContext, useContext, useEffect, useRef, useState } from 'react'
import Lenis from 'lenis'
import { AnimatePresence, motion, useScroll, useSpring } from 'motion/react'
import Landing from './Landing'
import Find from './Find'
import OptionB from './OptionB'
import { Nav } from './ui'

export type Variant = 'a' | 'b'
export type Route = 'home' | 'find'
interface Ctx { go: (r: Route) => void; scrollTo: (target: string | number) => void; route: Route; variant: Variant }
const AppCtx = createContext<Ctx>({ go: () => {}, scrollTo: () => {}, route: 'home', variant: 'a' })
export const useApp = () => useContext(AppCtx)

const readRoute = (): Route => (window.location.hash.startsWith('#/find') ? 'find' : 'home')

export default function App({ variant }: { variant: Variant }) {
  const [route, setRoute] = useState<Route>(readRoute)
  const lenis = useRef<Lenis | null>(null)
  const { scrollYProgress } = useScroll()
  const progress = useSpring(scrollYProgress, { stiffness: 120, damping: 30 })

  useEffect(() => {
    const l = new Lenis({ lerp: 0.09, smoothWheel: true })
    lenis.current = l
    let id = 0
    const raf = (t: number) => { l.raf(t); id = requestAnimationFrame(raf) }
    id = requestAnimationFrame(raf)
    const onHash = () => setRoute(readRoute())
    window.addEventListener('hashchange', onHash)
    return () => { cancelAnimationFrame(id); l.destroy(); window.removeEventListener('hashchange', onHash) }
  }, [])

  useEffect(() => {
    document.body.dataset.route = route === 'home' ? variant : 'find'
    window.scrollTo(0, 0)
    lenis.current?.scrollTo(0, { immediate: true })
  }, [route, variant])

  const go = (r: Route) => {
    window.location.hash = r === 'find' ? '#/find' : '#/'
    setRoute(r)
    lenis.current?.scrollTo(0, { immediate: true })
  }
  const scrollTo = (target: string | number) => {
    const opts = typeof target === 'string' ? { offset: -40 } : {}
    if (route === 'find') { go('home'); setTimeout(() => lenis.current?.scrollTo(target, opts), 450); return }
    lenis.current?.scrollTo(target, opts)
  }

  return (
    <AppCtx.Provider value={{ go, scrollTo, route, variant }}>
      <motion.div className="brand-line" style={{ scaleX: progress }} />
      <Nav />
      <AnimatePresence mode="wait">
        <motion.main
          key={route}
          initial={{ opacity: 0, y: 24, filter: 'blur(8px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)', transitionEnd: { filter: 'none', transform: 'none' } }}
          exit={{ opacity: 0, y: -16, filter: 'blur(6px)' }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        >
          {route === 'find' ? <Find /> : variant === 'b' ? <OptionB /> : <Landing />}
        </motion.main>
      </AnimatePresence>
    </AppCtx.Provider>
  )
}
