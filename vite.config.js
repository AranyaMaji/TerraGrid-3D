import { spawn } from 'node:child_process'
import { existsSync } from 'node:fs'

// winget install path; shells opened before install don't have it on PATH yet
const WIN_EXE = 'C:\\Program Files (x86)\\cloudflared\\cloudflared.exe'
const CLOUDFLARED = existsSync(WIN_EXE) ? WIN_EXE : 'cloudflared'

// Runs the Cloudflare tunnel only while the dev server is up, so
// preview.amsham.net goes down when `npm run dev` stops.
const tunnel = {
  name: 'cloudflare-tunnel',
  configureServer(server) {
    const proc = spawn(CLOUDFLARED, ['tunnel', '--url', 'http://localhost:5173', 'run', 'terragrid-preview'], { stdio: 'ignore' })
    proc.on('error', () => console.warn('cloudflared not found, preview.amsham.net is off'))
    server.httpServer?.on('close', () => proc.kill())
    process.on('exit', () => proc.kill())
  },
}

// POST /api/brief: optimizer facts in, three-section council brief out. Key stays server-side.
const MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash-lite'
const brief = {
  name: 'gemini-brief',
  configureServer(server) {
    server.middlewares.use('/api/brief', async (req, res) => {
      const send = (code, obj) => { res.statusCode = code; res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(obj)) }
      const key = process.env.GEMINI_API_KEY
      // cloudflared stamps every tunnelled request; keep the paid key local-only
      if (req.headers['cf-connecting-ip']) return send(403, { error: 'local only' })
      if (req.method !== 'POST') return send(405, { error: 'POST only' })
      if (!key) return send(503, { error: 'GEMINI_API_KEY not set' })
      let body = ''
      for await (const c of req) body += c
      const prompt = `You write a one-page business case for a city council officer pitching a cooling budget to councillors (COP31 framing welcome).
Use ONLY the facts below; quote their numbers exactly, invent no new figures. Plain, confident, specific. No markdown.
Return JSON {"hazard": string, "plan": string, "roi": string}, each 2-3 sentences, max 60 words:
- hazard: who is exposed to what heat and air quality right now, and where.
- plan: what the budget funds, where, and why these roofs beat a uniform rollout.
- roi: payback, peak grid demand cut, and health/equity outcome.
Facts: ${body}`
      try {
        const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
          body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { responseMimeType: 'application/json', temperature: 0.4 } }),
        })
        const j = await r.json()
        if (!r.ok) return send(502, { error: j.error?.message || r.status })
        send(200, { ...JSON.parse(j.candidates[0].content.parts[0].text), model: MODEL })
      } catch (e) {
        send(502, { error: String(e) })
      }
    })
  },
}

export default {
  server: { port: 5173, strictPort: true, allowedHosts: ['preview.amsham.net'] },
  plugins: [tunnel, brief],
}
