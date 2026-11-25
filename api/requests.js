// Vercel serverless function: stores licensing requests for the /admin page.
//
// Storage: Upstash Redis (Vercel → Storage → add "Upstash for Redis" to this project).
// Vercel then sets KV_REST_API_URL and KV_REST_API_TOKEN (or UPSTASH_REDIS_REST_URL / _TOKEN).
// Admin access: username + password from /admin (prototype default admin / PWD123; set ADMIN_USER / ADMIN_PASSWORD on Vercel to change).
//
//   POST   /api/requests                 save a request (from the site)
//   GET    /api/requests?email=x         a creator's own requests (used by "Track request")
//   GET    /api/requests   + x-admin-key  every request (admin page)
//   PATCH  /api/requests   + x-admin-key  { id, status?, note?, clips?: [{ id, review }] }  review clips / update status

const URL_ = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL
const TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN
const ADMIN_KEY = `${process.env.ADMIN_USER || 'admin'}:${process.env.ADMIN_PASSWORD || 'PWD123'}` // prototype login; override with ADMIN_USER / ADMIN_PASSWORD
const KEY = 'sr:requests'
const STATUSES = ['In review', 'Approved', 'Partly approved', 'Needs info', 'Rejected']
const REVIEWS = ['approved', 'declined']

async function redis(cmd) {
  const r = await fetch(URL_, { method: 'POST', headers: { Authorization: `Bearer ${TOKEN}`, 'content-type': 'application/json' }, body: JSON.stringify(cmd) })
  const j = await r.json()
  if (j.error) throw new Error(j.error)
  return j.result
}

async function all() {
  const flat = (await redis(['HGETALL', KEY])) || []
  const out = []
  for (let i = 1; i < flat.length; i += 2) { try { out.push(JSON.parse(flat[i])) } catch { /* skip bad row */ } }
  return out.sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))
}

const clean = (s, n = 200) => String(s ?? '').slice(0, n)

export default async function handler(req, res) {
  res.setHeader('cache-control', 'no-store')
  if (!URL_ || !TOKEN) return res.status(503).json({ error: 'storage-not-configured' })

  try {
    if (req.method === 'POST') {
      const b = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {}
      if (!b.id || !b.email) return res.status(400).json({ error: 'missing id or email' })
      const row = {
        id: clean(b.id, 20), createdAt: new Date().toISOString(),
        email: clean(b.email, 120).toLowerCase(), name: clean(b.name, 120), role: clean(b.role, 60),
        clips: (Array.isArray(b.clips) ? b.clips : []).slice(0, 200).map((c) => ({ id: clean(c.id, 40), title: clean(c.title), show: clean(c.show), status: c.status === 'removing' ? 'removing' : 'licensed' })),
        files: (Array.isArray(b.files) ? b.files : []).slice(0, 20).map((f) => ({ name: clean(f.name), size: Number(f.size) || 0 })),
        status: 'In review', note: '',
      }
      await redis(['HSET', KEY, row.id, JSON.stringify(row)])
      return res.status(201).json(row)
    }

    if (req.method === 'GET') {
      const isAdmin = ADMIN_KEY && req.headers['x-admin-key'] === ADMIN_KEY
      if (isAdmin) return res.status(200).json(await all())
      const email = clean(req.query.email, 120).toLowerCase()
      if (!email) return res.status(401).json({ error: 'admin key required' })
      return res.status(200).json((await all()).filter((r) => r.email === email))
    }

    if (req.method === 'PATCH') {
      if (!ADMIN_KEY || req.headers['x-admin-key'] !== ADMIN_KEY) return res.status(401).json({ error: 'admin key required' })
      const b = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {}
      const cur = await redis(['HGET', KEY, clean(b.id, 20)])
      if (!cur) return res.status(404).json({ error: 'not found' })
      const row = JSON.parse(cur)
      if (STATUSES.includes(b.status)) row.status = b.status
      if (typeof b.note === 'string') row.note = clean(b.note, 1000)
      if (Array.isArray(b.clips)) {
        const rv = new Map(b.clips.map((c) => [String(c.id), REVIEWS.includes(c.review) ? c.review : null]))
        row.clips = row.clips.map((c) => (rv.has(c.id) ? { ...c, review: rv.get(c.id) } : c))
      }
      await redis(['HSET', KEY, row.id, JSON.stringify(row)])
      return res.status(200).json(row)
    }

    return res.status(405).json({ error: 'method not allowed' })
  } catch (e) {
    return res.status(500).json({ error: String(e && e.message || e) })
  }
}
