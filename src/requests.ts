// Licensing requests: saved in this browser (so the creator can track them) and sent to /api/requests
// (a Vercel function that stores them for the /admin page). If the API isn't reachable the local copy still works.

export type RequestStatus = 'In review' | 'Approved' | 'Needs info' | 'Rejected'
export interface Account { email: string; name: string; picture?: string; via: 'google' | 'prototype' }
export interface ClipDecision { id: string; title: string; show: string; status: 'licensed' | 'removing' }
export interface LicenseRequest {
  id: string
  createdAt: string
  email: string
  name: string
  role: string
  clips: ClipDecision[]
  files: { name: string; size: number }[]
  status: RequestStatus
  note?: string
}

const ACCOUNT_KEY = 'sr_account'
const REQ_KEY = 'sr_requests'

const read = <T,>(k: string, fallback: T): T => { try { const v = localStorage.getItem(k); return v ? (JSON.parse(v) as T) : fallback } catch { return fallback } }
const write = (k: string, v: unknown) => { try { localStorage.setItem(k, JSON.stringify(v)) } catch { /* private mode */ } }

export const getAccount = () => read<Account | null>(ACCOUNT_KEY, null)
export const setAccount = (a: Account | null) => { if (a) write(ACCOUNT_KEY, a); else { try { localStorage.removeItem(ACCOUNT_KEY) } catch { /* noop */ } } }

export const localRequests = () => read<LicenseRequest[]>(REQ_KEY, [])

export async function submitRequest(r: Omit<LicenseRequest, 'id' | 'createdAt' | 'status'>): Promise<LicenseRequest> {
  const req: LicenseRequest = { ...r, id: 'SR-' + Math.random().toString(36).slice(2, 7).toUpperCase(), createdAt: new Date().toISOString(), status: 'In review' }
  write(REQ_KEY, [req, ...localRequests()])
  try { await fetch('/api/requests', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(req) }) } catch { /* offline / not deployed */ }
  return req
}

/** The creator's requests: local copies, with status updates from the server when it's available. */
export async function myRequests(email: string): Promise<LicenseRequest[]> {
  const local = localRequests().filter((r) => r.email.toLowerCase() === email.toLowerCase())
  try {
    const res = await fetch('/api/requests?email=' + encodeURIComponent(email))
    if (!res.ok) return local
    const remote = (await res.json()) as LicenseRequest[]
    const byId = new Map(local.map((r) => [r.id, r]))
    for (const r of remote) byId.set(r.id, { ...byId.get(r.id), ...r })
    return [...byId.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  } catch { return local }
}
