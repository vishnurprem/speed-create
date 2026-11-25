import '@fontsource-variable/inter'
import './admin.css'
import type { ClipDecision, ContactMessage, LicenseRequest, RequestStatus } from './requests'

type View = 'license' | 'remove' | 'messages'
type Filter = 'pending' | 'approved' | 'declined' | 'all'
type Review = 'approved' | 'declined' | null

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T
let key = sessionStorage.getItem('sr_admin_key') || ''
let rows: LicenseRequest[] = []
let msgs: ContactMessage[] = []
let mode: 'api' | 'local' = 'api'
let view: View = (sessionStorage.getItem('sr_admin_view') as View) || 'license'
let filter: Filter = 'pending'

const esc = (s: unknown) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!))
const when = (iso: string) => new Date(iso).toLocaleString(undefined, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
const initials = (n: string) => n.split(/\s+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase() || '?'
const kindOf = (v: View): ClipDecision['status'] => (v === 'remove' ? 'removing' : 'licensed')
const clipsOf = (r: LicenseRequest, v: View) => r.clips.filter((c) => c.status === kindOf(v))

function banner(msg: string) { const b = $('banner'); b.innerHTML = msg; b.hidden = !msg }
let toastT = 0
function toast(msg: string) { const t = $('toast'); t.textContent = msg; t.hidden = false; clearTimeout(toastT); toastT = window.setTimeout(() => (t.hidden = true), 2200) }

const localRows = (): LicenseRequest[] => { try { return JSON.parse(localStorage.getItem('sr_requests') || '[]') } catch { return [] } }
const localMsgs = (): ContactMessage[] => { try { return JSON.parse(localStorage.getItem('sr_messages') || '[]') } catch { return [] } }

/** A request's overall status follows its clip reviews (Needs info sticks while anything is still pending). */
function derive(r: LicenseRequest): RequestStatus {
  const rv = r.clips.map((c) => c.review || null)
  if (!rv.length) return r.status
  if (rv.some((x) => !x)) return r.status === 'Needs info' ? 'Needs info' : 'In review'
  if (rv.every((x) => x === 'approved')) return 'Approved'
  if (rv.every((x) => x === 'declined')) return 'Rejected'
  return 'Partly approved'
}

async function load() {
  if (mode === 'local') { rows = localRows(); msgs = localMsgs(); banner('Showing requests saved <b>in this browser</b> only. Connect the database on Vercel to see everyone\'s.'); return render() }
  try {
    const r = await fetch('/api/requests', { headers: { 'x-admin-key': key } })
    if (r.status === 401) { sessionStorage.removeItem('sr_admin_key'); key = ''; showLogin('Wrong username or password.'); return }
    if (!r.ok) throw new Error(r.status === 503 ? 'storage' : String(r.status))
    rows = await r.json()
    try { const m = await fetch('/api/contact', { headers: { 'x-admin-key': key } }); msgs = m.ok ? await m.json() : [] } catch { msgs = [] }
    banner(''); render()
  } catch (e) {
    mode = 'local'; rows = localRows(); msgs = localMsgs()
    banner(String(e).includes('storage')
      ? 'The database isn\'t connected yet. On Vercel: <b>Storage → Upstash for Redis</b>, then redeploy. Showing requests saved in this browser for now.'
      : 'Couldn\'t reach <code>/api/requests</code> (it only runs on Vercel). Showing requests saved in this browser.')
    render()
  }
}

async function save(id: string, patch: { status?: RequestStatus; note?: string; clips?: { id: string; review: Review }[] }) {
  const row = rows.find((r) => r.id === id); if (!row) return
  if (patch.clips) { const m = new Map(patch.clips.map((c) => [c.id, c.review])); row.clips = row.clips.map((c) => (m.has(c.id) ? { ...c, review: m.get(c.id) } : c)) }
  if (patch.note !== undefined) row.note = patch.note
  if (patch.status) row.status = patch.status
  if (patch.clips) row.status = derive(row)
  const body = { id, ...patch, status: row.status }
  if (mode === 'local') {
    const all = localRows().map((r) => (r.id === id ? row : r)); localStorage.setItem('sr_requests', JSON.stringify(all))
  } else {
    await fetch('/api/requests', { method: 'PATCH', headers: { 'content-type': 'application/json', 'x-admin-key': key }, body: JSON.stringify(body) })
  }
  render()
}

const pillClass = (s: string) => ({ Approved: 'g', 'Partly approved': 'g', Rejected: 'r', 'Needs info': 'y', approved: 'g', declined: 'r' } as Record<string, string>)[s] || 'n'

function counts() {
  const pend = (v: View) => rows.reduce((n, r) => n + clipsOf(r, v).filter((c) => !c.review).length, 0)
  return { license: pend('license'), remove: pend('remove'), messages: msgs.length }
}

function renderSide() {
  const c = counts()
  document.querySelectorAll<HTMLButtonElement>('#side button').forEach((b) => b.classList.toggle('on', b.dataset.view === view))
  document.querySelectorAll<HTMLElement>('[data-count]').forEach((b) => { const n = c[b.dataset.count as View]; b.textContent = n ? String(n) : ''; b.hidden = !n })
}

function clipRow(c: ClipDecision, v: View) {
  const yes = v === 'remove' ? 'Remove' : 'Approve', no = v === 'remove' ? 'Keep' : 'Decline'
  const label = c.review === 'approved' ? (v === 'remove' ? 'Removed' : 'Approved') : c.review === 'declined' ? (v === 'remove' ? 'Kept' : 'Declined') : 'Pending'
  return `<li class="adm-clip" data-clip="${esc(c.id)}">
    <div class="adm-clip-t"><b>${esc(c.title)}</b><span class="muted">${esc(c.show)}</span></div>
    <span class="pill ${pillClass(c.review || '')}">${label}</span>
    <div class="adm-seg">
      <button data-review="approved" class="${c.review === 'approved' ? 'on yes' : ''}" title="${yes}">✓ ${yes}</button>
      <button data-review="declined" class="${c.review === 'declined' ? 'on no' : ''}" title="${no}">✕ ${no}</button>
    </div>
  </li>`
}

function requestCard(r: LicenseRequest, v: View) {
  const cs = clipsOf(r, v)
  const yesAll = v === 'remove' ? 'Remove all' : 'Approve all', noAll = v === 'remove' ? 'Keep all' : 'Decline all'
  return `<article class="adm-card" data-id="${esc(r.id)}">
    <div class="adm-card-head">
      <span class="adm-av">${esc(initials(r.name))}</span>
      <div class="adm-who"><b>${esc(r.name)}</b><a href="mailto:${esc(r.email)}">${esc(r.email)}</a><small>${esc(r.id)} · ${when(r.createdAt)} · ${esc(r.role)}</small></div>
      <span class="pill ${pillClass(r.status)}">${esc(r.status)}</span>
    </div>
    <div class="adm-bulk">
      <span class="muted">${cs.length} clip${cs.length === 1 ? '' : 's'} to ${v === 'remove' ? 'remove' : 'license'}</span>
      <span class="adm-sp"></span>
      <button class="adm-btn sm yes" data-all="approved">✓ ${yesAll}</button>
      <button class="adm-btn sm ghost no" data-all="declined">✕ ${noAll}</button>
      <button class="adm-btn sm ghost" data-needs ${r.status === 'Needs info' ? 'disabled' : ''}>Needs info</button>
    </div>
    <ul class="adm-clips">${cs.map((c) => clipRow(c, v)).join('')}</ul>
    ${r.files.length ? `<div class="adm-docs"><span class="muted">Documents</span>${r.files.map((f) => `<span class="adm-doc">📄 ${esc(f.name)} <i>${(f.size / 1048576).toFixed(2)} MB</i></span>`).join('')}</div>` : '<div class="adm-docs"><span class="muted">No documents uploaded</span></div>'}
    <div class="adm-notes">
      <label for="n-${esc(r.id)}">Notes <span class="muted">· shown to the creator on their Track page</span></label>
      <textarea id="n-${esc(r.id)}" data-note rows="2" placeholder="e.g. Please upload proof you hold the rights to these episodes.">${esc(r.note || '')}</textarea>
      <div class="adm-notes-row"><span class="muted" data-saved></span><button class="adm-btn sm ghost" data-save>Save note</button></div>
    </div>
  </article>`
}

function render() {
  renderSide()
  const list = $('list'), stats = $('stats'), filters = $('filters')
  if (view === 'messages') {
    $('title').textContent = 'Messages'; $('subtitle').textContent = 'From the Talk to us form.'
    stats.innerHTML = ''; filters.innerHTML = ''
    list.innerHTML = msgs.length ? msgs.map((m) => `<article class="adm-card">
        <div class="adm-card-head"><span class="adm-av">${esc(initials(m.name))}</span>
          <div class="adm-who"><b>${esc(m.name)}</b><a href="mailto:${esc(m.email)}">${esc(m.email)}</a><small>${esc(m.id)} · ${when(m.createdAt)}</small></div>
          <a class="adm-btn sm ghost" href="mailto:${esc(m.email)}?subject=${encodeURIComponent('Re: your message to SpeedRadio')}">Reply</a></div>
        <p class="adm-msg">${esc(m.message)}</p></article>`).join('') : '<p class="muted adm-empty">No messages yet.</p>'
    return
  }
  const isRem = view === 'remove'
  $('title').textContent = isRem ? 'Removals' : 'License requests'
  $('subtitle').textContent = isRem ? 'Clips creators asked us to take down. Remove them or keep them, one by one or all at once.' : 'Clips creators want to license to us. Approve or decline each one, or the whole request.'
  const all = rows.flatMap((r) => clipsOf(r, view))
  const n = (f: (c: ClipDecision) => boolean) => all.filter(f).length
  stats.innerHTML = `
    <div><b>${rows.filter((r) => clipsOf(r, view).length).length}</b><span>requests</span></div>
    <div><b>${n((c) => !c.review)}</b><span>pending clips</span></div>
    <div><b>${n((c) => c.review === 'approved')}</b><span>${isRem ? 'removed' : 'approved'}</span></div>
    <div><b>${n((c) => c.review === 'declined')}</b><span>${isRem ? 'kept' : 'declined'}</span></div>`
  const F: [Filter, string][] = [['pending', 'Pending'], ['approved', isRem ? 'Removed' : 'Approved'], ['declined', isRem ? 'Kept' : 'Declined'], ['all', 'All']]
  filters.innerHTML = F.map(([f, l]) => `<button data-f="${f}" class="${f === filter ? 'on' : ''}">${l}</button>`).join('')
  const shown = rows.filter((r) => {
    const cs = clipsOf(r, view); if (!cs.length) return false
    if (filter === 'all') return true
    if (filter === 'pending') return cs.some((c) => !c.review)
    return cs.some((c) => c.review === filter)
  })
  list.innerHTML = shown.length ? shown.map((r) => requestCard(r, view)).join('') : `<p class="muted adm-empty">${filter === 'pending' ? 'All caught up. Nothing waiting for review.' : 'Nothing here yet.'}</p>`
}

function setView(v: View) { view = v; filter = 'pending'; sessionStorage.setItem('sr_admin_view', v); render(); window.scrollTo(0, 0) }

function showLogin(err = '') { $('login').hidden = false; $('app').hidden = true; const e = $('loginErr'); e.textContent = err; e.hidden = !err }
function showApp() { $('login').hidden = true; $('app').hidden = false; load() }

// Prototype login. The API checks the same pair (ADMIN_USER / ADMIN_PASSWORD on Vercel, default admin / PWD123).
const PROTO_USER = 'admin', PROTO_PASS = 'PWD123'
$('loginForm').addEventListener('submit', (e) => {
  e.preventDefault()
  const u = ($('user') as HTMLInputElement).value.trim(), p = ($('pass') as HTMLInputElement).value
  if (!u || !p) return showLogin('Enter your username and password.')
  if (u !== PROTO_USER || p !== PROTO_PASS) return showLogin('Wrong username or password.')
  key = `${u}:${p}`; sessionStorage.setItem('sr_admin_key', key); mode = 'api'; showApp()
})
$('refresh').addEventListener('click', () => { load(); toast('Refreshed') })
$('logout').addEventListener('click', () => { sessionStorage.removeItem('sr_admin_key'); key = ''; showLogin() })
$('side').addEventListener('click', (e) => { const b = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-view]'); if (b) setView(b.dataset.view as View) })
$('filters').addEventListener('click', (e) => { const f = (e.target as HTMLElement).dataset.f; if (f) { filter = f as Filter; render() } })
$('list').addEventListener('click', async (e) => {
  const t = (e.target as HTMLElement).closest<HTMLButtonElement>('button'); if (!t) return
  const card = t.closest<HTMLElement>('.adm-card'); const id = card?.dataset.id; if (!id) return
  const row = rows.find((r) => r.id === id)!
  if (t.dataset.review) {
    const cid = t.closest<HTMLElement>('[data-clip]')!.dataset.clip!
    const cur = row.clips.find((c) => c.id === cid)?.review || null
    const next = (cur === t.dataset.review ? null : t.dataset.review) as Review
    await save(id, { clips: [{ id: cid, review: next }] })
  } else if (t.dataset.all) {
    const review = t.dataset.all as Review
    await save(id, { clips: clipsOf(row, view).map((c) => ({ id: c.id, review })) })
    toast(`${row.name}: ${review === 'approved' ? (view === 'remove' ? 'all removed' : 'all approved') : (view === 'remove' ? 'all kept' : 'all declined')}`)
  } else if (t.hasAttribute('data-needs')) {
    await save(id, { status: 'Needs info' }); toast('Marked as Needs info. Add a note so they know what to send.')
    ;(document.querySelector(`.adm-card[data-id="${CSS.escape(id)}"] [data-note]`) as HTMLTextAreaElement | null)?.focus()
  } else if (t.hasAttribute('data-save')) {
    const note = (card!.querySelector('[data-note]') as HTMLTextAreaElement).value.trim()
    await save(id, { note }); toast('Note saved')
  }
})

if (key) showApp()
