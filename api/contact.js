// Vercel serverless function: "Talk to us" messages for the /admin page.
// Uses the same Upstash Redis + admin login as /api/requests.
//
//   POST /api/contact                 save a message (from the site)
//   GET  /api/contact  + x-admin-key  every message (admin page)

const URL_ = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL
const TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN
const ADMIN_KEY = `${process.env.ADMIN_USER || 'admin'}:${process.env.ADMIN_PASSWORD || 'PWD123'}` // prototype login; override with ADMIN_USER / ADMIN_PASSWORD
const KEY = 'sr:messages'

async function redis(cmd) {
  const r = await fetch(URL_, { method: 'POST', headers: { Authorization: `Bearer ${TOKEN}`, 'content-type': 'application/json' }, body: JSON.stringify(cmd) })
  const j = await r.json()
  if (j.error) throw new Error(j.error)
  return j.result
}
const clean = (s, n = 200) => String(s ?? '').slice(0, n)

export default async function handler(req, res) {
  res.setHeader('cache-control', 'no-store')
  if (!URL_ || !TOKEN) return res.status(503).json({ error: 'storage-not-configured' })
  try {
    if (req.method === 'POST') {
      const b = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {}
      if (!b.email || !b.message) return res.status(400).json({ error: 'missing email or message' })
      const row = { id: clean(b.id, 20) || 'MSG-' + Date.now(), createdAt: new Date().toISOString(), name: clean(b.name, 120), email: clean(b.email, 120).toLowerCase(), message: clean(b.message, 4000) }
      await redis(['HSET', KEY, row.id, JSON.stringify(row)])
      return res.status(201).json({ ok: true })
    }
    if (req.method === 'GET') {
      if (!ADMIN_KEY || req.headers['x-admin-key'] !== ADMIN_KEY) return res.status(401).json({ error: 'admin key required' })
      const flat = (await redis(['HGETALL', KEY])) || []
      const out = []
      for (let i = 1; i < flat.length; i += 2) { try { out.push(JSON.parse(flat[i])) } catch { /* skip */ } }
      out.sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))
      return res.status(200).json(out)
    }
    return res.status(405).json({ error: 'method not allowed' })
  } catch (e) {
    return res.status(500).json({ error: String(e && e.message || e) })
  }
}
