import { BASE } from './ui'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import CLIPS_JSON from './clips.json'

export interface AppClip { id: number; title: string; dur: number; tags: string[]; station: string; handle: string; desc: string; creator: string; img: string; audio: string; vtt: string }
const ROOT = import.meta.env.BASE_URL
export const APP_CLIPS = (CLIPS_JSON as AppClip[]).map((c) => ({ ...c, img: ROOT + c.img.replace(/^\//, ''), audio: ROOT + c.audio.replace(/^\//, '') }))

/* ---------- captions: port of the app's CaptionLyricScroll ---------- */
interface Cue { start: number; end: number; text: string }
interface Line { text: string; start: number; end: number; rb: number; rs: number }

export function parseVtt(src: string): Cue[] {
  const toSec = (t: string) => { const p = t.trim().replace(',', '.').split(':').map(Number); return p.length === 3 ? p[0] * 3600 + p[1] * 60 + p[2] : p[0] * 60 + p[1] }
  const cues: Cue[] = []
  for (const b of src.replace(/\r/g, '').split(/\n{2,}/)) {
    const l = b.split('\n'); const i = l.findIndex((x) => x.includes('-->')); if (i < 0) continue
    const [a, c] = l[i].split('-->')
    const text = l.slice(i + 1).join(' ').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim()
    if (text) cues.push({ start: toSec(a), end: toSec(c.trim().split(/\s/)[0]), text })
  }
  return cues.sort((x, y) => x.start - y.start)
}
const cv = document.createElement('canvas').getContext('2d')!
function rows(text: string, px: number, w: number) {
  cv.font = `700 ${px}px "Inter Variable", Inter, system-ui, sans-serif`
  let r = 1, line = ''
  for (const word of text.split(' ')) { const n = line ? line + ' ' + word : word; if (line && cv.measureText(n).width > w) { r++; line = word } else line = n }
  return r
}
function buildLines(cues: Cue[], w: number, max: number, big: number, small: number): Line[] {
  const out: Line[] = []
  for (const cue of cues) {
    const words = cue.text.split(' '); const chunks: string[] = []; let cur = ''
    for (const wd of words) { const n = cur ? cur + ' ' + wd : wd; if (cur && rows(n, big, w) > max) { chunks.push(cur); cur = wd } else cur = n }
    if (cur) chunks.push(cur)
    const total = chunks.reduce((n, c) => n + c.length + 1, 0); let t = cue.start
    for (const text of chunks) { const d = (cue.end - cue.start) * (text.length + 1) / total; out.push({ text, start: t, end: t + d, rb: rows(text, big, w), rs: rows(text, small, w) }); t += d }
  }
  return out
}
function activeIndex(L: Line[], t: number) { let lo = 0, hi = L.length - 1, ans = 0; while (lo <= hi) { const m = (lo + hi) >> 1; if (L[m].start <= t) { ans = m; lo = m + 1 } else hi = m - 1 } return ans }

export function LyricCaptions({ vtt, time, big = 30 }: { vtt: string; time: number; big?: number }) {
  const win = useRef<HTMLDivElement>(null)
  const st = useRef<{ lines: Line[]; a: number; els: Map<number, HTMLParagraphElement> }>({ lines: [], a: -1, els: new Map() })
  const cues = useMemo(() => parseVtt(vtt), [vtt])
  const small = Math.round(big / 2), lhB = Math.round(big * 1.25), lhS = Math.round(small * 1.25)
  const build = useCallback(() => {
    const w = win.current?.offsetWidth || 280
    st.current.lines = buildLines(cues, w, 2, big, small); st.current.a = -1
    if (win.current) win.current.innerHTML = ''
    st.current.els.clear()
  }, [cues, big, small])
  useEffect(() => { build(); document.fonts?.ready.then(build) }, [build])
  useEffect(() => {
    const el = win.current; const s = st.current; const L = s.lines
    if (!el || !L.length) return
    const na = time < L[0].start - 0.1 ? -1 : activeIndex(L, time + 0.1)
    if (na === s.a) return
    const jump = s.a < 0 || na < s.a || na - s.a > 1; s.a = na
    if (na < 0) { el.innerHTML = ''; s.els.clear(); return }
    if (jump) { el.innerHTML = ''; s.els.clear(); el.classList.remove('dissolve'); void el.offsetWidth; el.classList.add('dissolve') }
    const a = na, from = Math.max(0, a - 3), to = Math.min(L.length - 1, a + 2), tops: Record<number, number> = {}
    const top0 = lhS * 2 + 12
    tops[a] = top0; let y = top0 + L[a].rb * lhB + 16
    for (let j = a + 1; j <= to; j++) { tops[j] = y; y += L[j].rb * lhB + 8 }
    y = top0 - 6; for (let j = a - 1; j >= from; j--) { y -= L[j].rs * lhS; tops[j] = y; y -= 6 }
    for (const [j, p] of s.els) if (j < from || j > to) { p.remove(); s.els.delete(j) }
    for (let j = from; j <= to; j++) {
      const d = j - a, isBig = d >= 0, op = d === 0 || d === -1 ? 1 : d === -2 ? 0.55 : 0
      const col = isBig ? '#EBEBEB' : d === -1 ? '#666666' : '#505050'
      let p = s.els.get(j)
      const apply = (e: HTMLParagraphElement) => { e.style.transform = `translate3d(0,${tops[j]}px,0)`; e.style.fontSize = (isBig ? big : small) + 'px'; e.style.lineHeight = (isBig ? lhB : lhS) + 'px'; e.style.color = col; e.style.opacity = String(op) }
      if (!p) { p = document.createElement('p'); p.className = 'ln'; p.textContent = L[j].text; p.style.transition = 'none'; apply(p); if (!jump) p.style.opacity = '0'; el.appendChild(p); s.els.set(j, p); void p.offsetWidth; p.style.transition = '' }
      apply(p)
    }
  }, [time, big, small, lhB, lhS])
  return <div className="cap-win" ref={win} style={{ height: lhS * 2 + 12 + lhB * 2 + 16 + lhB }} />
}

/* ---------- one shared audio element ---------- */
export function useClipPlayer() {
  const audio = useRef<HTMLAudioElement | null>(null)
  const [id, setId] = useState<number | null>(null)
  const [playing, setPlaying] = useState(false)
  const [time, setTime] = useState(0)
  const [dur, setDur] = useState(0)
  const wantPlay = useRef(false)
  useEffect(() => {
    const a = new Audio(); a.preload = 'auto'; audio.current = a
    const onMeta = () => setDur(a.duration || 0)
    const onPlay = () => setPlaying(true), onPause = () => setPlaying(false)
    const onEnd = () => { a.currentTime = 0; a.play().catch(() => {}) } // feed clip loops, like Home in the app
    a.addEventListener('loadedmetadata', onMeta); a.addEventListener('play', onPlay); a.addEventListener('pause', onPause); a.addEventListener('ended', onEnd)
    let raf = 0; const tick = () => { setTime(a.currentTime); raf = requestAnimationFrame(tick) }; raf = requestAnimationFrame(tick)
    return () => { cancelAnimationFrame(raf); a.pause(); a.src = '' }
  }, [])
  const load = useCallback((clip: AppClip, autoplay = wantPlay.current) => {
    const a = audio.current; if (!a) return
    if (id !== clip.id) { a.src = clip.audio; a.currentTime = 0; setId(clip.id); setTime(0); setDur(clip.dur) }
    if (autoplay) a.play().catch(() => {})
  }, [id])
  const toggle = useCallback((clip: AppClip) => {
    const a = audio.current; if (!a) return
    if (id !== clip.id) { wantPlay.current = true; load(clip, true); return }
    if (a.paused) { wantPlay.current = true; a.play().catch(() => {}) } else { wantPlay.current = false; a.pause() }
  }, [id, load])
  const seek = useCallback((t: number) => { const a = audio.current; if (a && isFinite(t)) { a.currentTime = t; setTime(t) } }, [])
  const pause = useCallback(() => { audio.current?.pause() }, [])
  return { id, playing, time, dur, load, toggle, seek, pause }
}
export type Player = ReturnType<typeof useClipPlayer>

const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`

/* ---------- feed card (Home content page) ---------- */
export function FeedCard({ clip, active, player, onStation, onNext }: { clip: AppClip; active: boolean; player: Player; onStation: () => void; onNext?: () => void }) {
  const isMe = player.id === clip.id
  const playing = isMe && player.playing
  const t = isMe ? player.time : 0
  const d = (isMe && player.dur) || clip.dur
  const [liked, setLiked] = useState(false)
  const track = useRef<HTMLDivElement>(null)
  const dragging = useRef(false)
  const seekFrom = (x: number) => { const r = track.current!.getBoundingClientRect(); const p = Math.min(1, Math.max(0, (x - r.left) / r.width)); if (!isMe) player.load(clip, false); player.seek(p * d) }
  return (
    <div className="fc">
      <div className="fc-card">
        <div className="fc-tex" />
        <div className="fc-top"><span className="fc-menu" aria-hidden="true"><i /><i /></span></div>
        <div className="fc-title">{clip.title}</div>
        <div className="fc-tags">{clip.tags.join('  ')}</div>
        <div className="fc-mid">
          <button className="fc-capzone" onClick={() => player.toggle(clip)} aria-label={playing ? 'Pause' : 'Play'}>
            <div className={`fc-ind${playing ? '' : ' paused'}`}>{playing && <img src={BASE + 'media/audio-indicator.gif'} alt="" />}</div>
            {active || isMe ? <LyricCaptions vtt={clip.vtt} time={t} /> : <div className="cap-win" style={{ height: 150 }} />}
            <AnimatePresence>
              {!playing && (
                <motion.span className="fc-play" initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.3 }} transition={{ type: 'spring', stiffness: 380, damping: 24 }}>
                  <svg width="30" height="30" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.4-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5Z" fill="#111" /></svg>
                  {t === 0 && <em>Tap to listen</em>}
                </motion.span>
              )}
            </AnimatePresence>
          </button>
          <div className="fc-actions">
            <motion.button whileTap={{ scale: 0.8 }} onClick={() => setLiked(!liked)} aria-label="Like">
              <svg width="28" height="28" viewBox="0 0 24 24" fill={liked ? '#EA1C25' : 'none'} stroke={liked ? '#EA1C25' : '#fff'} strokeWidth="1.8" strokeLinejoin="round"><path d="M12 20.5s-7.5-4.6-7.5-10.3A4.2 4.2 0 0 1 12 7.6a4.2 4.2 0 0 1 7.5 2.6c0 5.7-7.5 10.3-7.5 10.3z" /></svg>
              <span>{liked ? '2.9K' : '2.9K'}</span>
            </motion.button>
            <button aria-label="Comments">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinejoin="round"><rect x="3" y="4" width="18" height="13" rx="2.5" /><path d="M8 21l2.5-4M7.5 11.5h3M13.5 11.5h3" /></svg>
              <span>265</span>
            </button>
            <button aria-label="Share on WhatsApp">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinejoin="round"><path d="M4 20l1.3-3.9A8 8 0 1 1 8 18.8z" /><path d="M9 9.5c.3 2 2.3 4.2 4.6 4.9l1.2-1.1 1.6.8-.4 1.4c-3.6.4-7.5-3.3-7.4-6.9l1.4-.5.8 1.6z" fill="#fff" stroke="none" /></svg>
              <span>152</span>
            </button>
          </div>
        </div>
        <div className="fc-by"><i /><span>by</span> {clip.creator}</div>
        <div className="fc-prog">
          <div
            className="fc-track" ref={track}
            onPointerDown={(e) => { dragging.current = true; (e.target as HTMLElement).setPointerCapture(e.pointerId); seekFrom(e.clientX) }}
            onPointerMove={(e) => { if (dragging.current) seekFrom(e.clientX) }}
            onPointerUp={() => { dragging.current = false }}
          >
            <i style={{ width: `${Math.min(100, (t / d) * 100)}%` }} />
            <b style={{ left: `${Math.min(100, (t / d) * 100)}%` }} />
          </div>
          <span className="fc-time">{fmt(t)}</span>
          <span className="fc-speed">1x</span>
        </div>
        <button className="fc-station" onClick={onStation}>
          <div className="fc-st-txt"><b>{clip.station}</b><span>{clip.desc}</span></div>
          <span className="fc-st-img"><img src={clip.img} alt="" /><em>+</em></span>
        </button>
      </div>
      {onNext && (
        <button className="fc-next" onClick={onNext} aria-label="Next clip">
          <motion.svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#EA1C25" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"
            animate={{ y: [0, -4, 0] }} transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}><path d="M6 15l6-6 6 6" /></motion.svg>
          Swipe up for next
        </button>
      )}
    </div>
  )
}

/* ---------- Station profile ---------- */
const WASHES = ['rgba(194,39,46,.35)', 'rgba(215,189,48,.28)', 'rgba(45,177,169,.3)', 'rgba(203,192,182,.25)']
export function StationProfile({ clip, player, onBack }: { clip: AppClip; player: Player; onBack: () => void }) {
  const [follow, setFollow] = useState(false)
  const [tab, setTab] = useState('Popular')
  const list = [clip, ...APP_CLIPS.filter((c) => c.id !== clip.id)].slice(0, 4)
  return (
    <motion.div className="sp" initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', stiffness: 260, damping: 30 }}>
      <div className="sp-scroll" data-lenis-prevent>
        <div className="sp-cover" style={{ backgroundImage: `url(${clip.img})` }}>
          <button className="sp-round" onClick={onBack} aria-label="Back"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M11 6l-6 6 6 6" /></svg></button>
          <span className="sp-round sp-more" aria-hidden="true"><i /><i /><i /></span>
        </div>
        <div className="sp-art"><img src={clip.img} alt="" /></div>
        <div className="sp-head">
          <h3>{clip.station}</h3>
          <div className="sp-handle">@{clip.handle}</div>
          <div className="sp-stats"><b>18.2K</b> followers <i>·</i> <b>64</b> clips <i>·</i> <b>Public</b></div>
          <p>{clip.desc}</p>
          <div className="sp-host"><span className="sp-av"><img src={clip.img} alt="" /></span>Hosted by <b>{clip.creator}</b></div>
          <motion.button className={`sp-follow${follow ? ' on' : ''}`} whileTap={{ scale: 0.97 }} onClick={() => setFollow(!follow)}>{follow ? 'Following' : 'Follow'}</motion.button>
        </div>
        <div className="sp-tabs">
          {['Latest', 'Popular', 'Oldest'].map((x) => <button key={x} className={x === tab ? 'on' : ''} onClick={() => setTab(x)}>{x}</button>)}
          <span className="sp-search" aria-hidden="true"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></svg></span>
        </div>
        <div className="sp-list">
          {list.map((c, k) => {
            const on = player.id === c.id && player.playing
            return (
              <motion.button key={c.id} className={`sp-item${on ? ' on' : ''}`} style={{ background: `linear-gradient(135deg, ${WASHES[k % 4]}, #1b1b1b 60%)` }} onClick={() => player.toggle(c)}
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 + k * 0.06 }}>
                <div className="sp-it-t">{c.title}</div>
                <div className="sp-it-by"><span className="sp-av sm"><img src={c.img} alt="" /></span>{c.creator}</div>
                <div className="sp-it-st"><span>▲ 2.9K</span><span>▤ 265</span><span className="sp-it-play">{on ? 'Playing' : 'Play'} · {fmt(c.dur)}</span></div>
              </motion.button>
            )
          })}
        </div>
      </div>
    </motion.div>
  )
}
