import handler from '@tanstack/react-start/server-entry'
import { env } from 'cloudflare:workers'
import type { ExecutionContext } from '@cloudflare/workers-types'

// The generated entry's fetch accepts the extra Worker runtime args at
// runtime; its declared type just omits them.
type WorkerFetch = (request: Request, env?: unknown, ctx?: unknown) => Promise<Response>

// Custom worker entry: the TanStack handler plus an Origin-Trial header on
// HTML responses, so browsers without a flag still enable WebMCP on the
// deployed origin (see ORIGIN_TRIAL_TOKEN in .env / wrangler vars).
export default {
  async fetch(request: Request, cfEnv: unknown, ctx: ExecutionContext) {
    const res = await (handler.fetch as WorkerFetch)(request, cfEnv, ctx)
    const token = env.ORIGIN_TRIAL_TOKEN
    if (!token || !res.headers.get('content-type')?.startsWith('text/html')) return res
    const headers = new Headers(res.headers)
    headers.set('Origin-Trial', token)
    return new Response(res.body, { status: res.status, statusText: res.statusText, headers })
  },
}
