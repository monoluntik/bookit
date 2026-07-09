// Integration-test helpers. These tests hit a REAL running instance of the API
// (see README "Установка и запуск") rather than an in-process Fastify build,
// because src/index.ts does not export a reusable app factory.
//
// Requirements to run `pnpm test`:
//   - API dev server running at BASE_URL (default http://localhost:4000)
//   - ALLOW_TEST_PHONES=true on that server, so phones from testPhones.ts accept code 999999
//   - A real Postgres behind it (DATABASE_URL) — these tests create real rows.

export const BASE_URL = process.env.TEST_API_URL ?? 'http://localhost:4000'
export const TEST_CODE = '999999'

export class CookieJar {
  private jar = new Map<string, string>()

  capture(res: Response) {
    const setCookies = (res.headers as any).getSetCookie?.() as string[] | undefined
    for (const raw of setCookies ?? []) {
      const pair = raw.split(';')[0]
      const idx = pair.indexOf('=')
      if (idx > 0) this.jar.set(pair.slice(0, idx), pair.slice(idx + 1))
    }
  }

  header(): string {
    return [...this.jar.entries()].map(([k, v]) => `${k}=${v}`).join('; ')
  }
}

export async function api(
  path: string,
  opts: { method?: string; body?: unknown; jar?: CookieJar } = {},
) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: opts.method ?? 'GET',
    headers: {
      ...(opts.body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...(opts.jar ? { Cookie: opts.jar.header() } : {}),
    },
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
  })
  opts.jar?.capture(res)
  const text = await res.text()
  let json: any = null
  try { json = text ? JSON.parse(text) : null } catch { json = text }
  return { status: res.status, json, res }
}

/** Runs the full phone -> challenge -> verify flow for a test phone number and returns an authenticated cookie jar. */
export async function loginTestPhone(phone: string): Promise<CookieJar> {
  const jar = new CookieJar()
  const start = await api('/api/auth/start', { method: 'POST', body: { phone }, jar })
  if (start.status !== 201) throw new Error(`auth/start failed for ${phone}: ${start.status} ${JSON.stringify(start.json)}`)
  const challengeId = start.json.challengeId as string
  const verify = await api(`/api/auth/challenge/${challengeId}/verify`, {
    method: 'POST',
    body: { code: TEST_CODE },
    jar,
  })
  if (verify.status !== 200) throw new Error(`verify failed for ${phone}: ${verify.status} ${JSON.stringify(verify.json)}`)
  return jar
}

export function randomSlug(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`
}

export async function assertServerReachable() {
  try {
    const res = await fetch(`${BASE_URL}/health`)
    if (!res.ok) throw new Error(`unexpected status ${res.status}`)
  } catch (e) {
    throw new Error(
      `Cannot reach API at ${BASE_URL} — start it first (cd apps/api && pnpm dev), ` +
      `and set ALLOW_TEST_PHONES=true. Original error: ${(e as Error).message}`,
    )
  }
}
