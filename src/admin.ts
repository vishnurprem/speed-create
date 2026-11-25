import '@fontsource-variable/inter'
import './admin.css'
import type { ContactMessage, LicenseRequest, RequestStatus } from './requests'

const STATUSES: RequestStatus[] = ['In review', 'Approved', 'Needs info', 'Rejected']
const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T
let key = sessionStorage.getItem('sr_admin_key') || ''
let rows: LicenseRequest[] = []
let msgs: ContactMessage[] = []
let mode: 'api' | 'local' = 'api'
let filter: 'All' | RequestStatus = 'All'

const esc = (s: unknown) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!))
const when = (iso: string) => new Date(iso).toLocaleString(undefined, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })

function banner(msg: string) { const b = $('banner'); b.innerHTML = msg; b.hidden = !msg }

function localRows(): LicenseRequest[] { try { return JSON.parse(localStorage.getItem('sr_requests') || '[]') } catch { return [] } }
function localMsgs(): ContactMessage[] { try { return JSON.parse(localStorage.getItem('sr_messages') || '[]') } catch { return [] } }

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

async function update(id: string, patch: { status?: RequestStatus; note?: string }) {
  const row = rows.find((r) => r.id === id); if (!row) return
  Object.assign(row, patch)
  if (mode === 'local') {
    const all = localRows().map((r) => (r.id === id ? { ...r, ...patch } : r)); localStorage.setItem('sr_requests', JSON.stringify(all))
  } else {
    await fetch('/api/requests', { method: 'PATCH', headers: { 'content-type': 'application/json', 'x-admin-key': key }, body: JSON.stringify({ id, ...patch }) })
  }
  render()
}

function render() {
  const count = (s: RequestStatus) => rows.filter((r) => r.status === s).length
  const licensed = rows.reduce((n, r) => n + r.clips.filter((c) => c.status === 'licensed').length, 0)
  $('stats').innerHTML = `
    <div><b>${rows.length}</b><span>requests</span></div>
    <div><b>${count('In review')}</b><span>in review</span></div>
    <div><b>${count('Approved')}</b><span>approved</span></div>
    <div><b>${licensed}</b><span>clips licensed</span></div>`
  $('filters').innerHTML = (['All', ...STATUSES] as const).map((s) => `<button data-f="${s}" class="${s === filter ? 'on' : ''}">${s}</button>`).join('')
  const shown = filter === 'All' ? rows : rows.filter((r) => r.status === filter)
  $('list').innerHTML = shown.length ? shown.map((r) => {
    const lic = r.clips.filter((c) => c.status === 'licensed'), rem = r.clips.filter((c) => c.status === 'removing')
    return `<article class="adm-card" data-id="${esc(r.id)}">
      <div class="adm-top">
        <div><b>${esc(r.name)}</b> <span class="muted">${esc(r.email)}</span><small>${esc(r.id)} · ${when(r.createdAt)} · ${esc(r.role)}</small></div>
        <select data-status>${STATUSES.map((s) => `<option ${s === r.status ? 'selected' : ''}>${s}</option>`).join('')}</select>
      </div>
      <div class="adm-cols">
        <div><h4>Licensed · ${lic.length}</h4>${lic.map((c) => `<p>${esc(c.title)} <span class="muted">${esc(c.show)}</span></p>`).join('') || '<p class="muted">None</p>'}</div>
        <div><h4>Remove · ${rem.length}</h4>${rem.map((c) => `<p>${esc(c.title)} <span class="muted">${esc(c.show)}</span></p>`).join('') || '<p class="muted">None</p>'}</div>
        <div><h4>Documents · ${r.files.length}</h4>${r.files.map((f) => `<p>${esc(f.name)} <span class="muted">${(f.size / 1048576).toFixed(2)} MB</span></p>`).join('') || '<p class="muted">None</p>'}</div>
      </div>
      <div class="adm-note"><input data-note placeholder="Note to the creator (shown when status is Needs info)" value="${esc(r.note || '')}" /><button data-save class="adm-btn ghost">Save note</button></div>
    </article>`
  }).join('') : '<p class="muted adm-empty">No requests here yet.</p>'
  $('msgs').innerHTML = msgs.length ? msgs.map((m) => `<article class="adm-card">
      <div class="adm-top"><div><b>${esc(m.name)}</b> <a class="muted" href="mailto:${esc(m.email)}">${esc(m.email)}</a><small>${esc(m.id)} · ${when(m.createdAt)}</small></div>
      <a class="adm-btn ghost adm-reply" href="mailto:${esc(m.email)}?subject=${encodeURIComponent('Re: your message to SpeedRadio')}">Reply</a></div>
      <p class="adm-msg">${esc(m.message)}</p></article>`).join('') : '<p class="muted adm-empty">No messages yet.</p>'
}

function showLogin(err = '') { $('login').hidden = false; $('board').hidden = true; $('refresh').hidden = true; $('logout').hidden = true; const e = $('loginErr'); e.textContent = err; e.hidden = !err }
function showBoard() { $('login').hidden = true; $('board').hidden = false; $('refresh').hidden = false; $('logout').hidden = false; load() }

// Prototype login. The API checks the same pair (ADMIN_USER / ADMIN_PASSWORD on Vercel, default admin / PWD123).
const PROTO_USER = 'admin', PROTO_PASS = 'PWD123'
$('loginForm').addEventListener('submit', (e) => {
  e.preventDefault()
  const u = ($('user') as HTMLInputElement).value.trim(), p = ($('pass') as HTMLInputElement).value
  if (!u || !p) return showLogin('Enter your username and password.')
  if (u !== PROTO_USER || p !== PROTO_PASS) return showLogin('Wrong username or password.')
  key = `${u}:${p}`; sessionStorage.setItem('sr_admin_key', key); mode = 'api'; showBoard()
})
$('refresh').addEventListener('click', load)
$('logout').addEventListener('click', () => { sessionStorage.removeItem('sr_admin_key'); key = ''; showLogin() })
$('filters').addEventListener('click', (e) => { const f = (e.target as HTMLElement).dataset.f; if (f) { filter = f as typeof filter; render() } })
$('list').addEventListener('change', (e) => { const t = e.target as HTMLSelectElement; if (t.matches('[data-status]')) update(t.closest<HTMLElement>('.adm-card')!.dataset.id!, { status: t.value as RequestStatus }) })
$('list').addEventListener('click', (e) => { const t = e.target as HTMLElement; if (t.matches('[data-save]')) { const card = t.closest<HTMLElement>('.adm-card')!; update(card.dataset.id!, { note: (card.querySelector('[data-note]') as HTMLInputElement).value }) } })

if (key) showBoard()
