import { beforeAll, describe, expect, it } from 'vitest'
import { api, assertServerReachable, CookieJar } from './helpers'

// These are REGRESSION tests for two auth bugs found during a full-platform QA
// pass (2026-07-08). Both currently FAIL against the live code — that is
// expected and intentional: they pin down the exact broken behavior so the
// bugs can't silently regress once fixed, and they'll start passing the
// moment auth.ts's verify handler is corrected. See the QA report for the
// root-cause analysis (apps/api/src/routes/auth.ts, POST /challenge/:id/verify).
//
// Dedicated test phones so runs don't collide with other suites/manual QA.
const PHONE_LOCKOUT = '+996700000014'
const PHONE_REUSE = '+996700000015'

beforeAll(assertServerReachable)

describe('auth challenge lockout', () => {
  it('BUG: does not grant a session after MAX_ATTEMPTS lockout, even with an empty code', async () => {
    const jar = new CookieJar()
    const start = await api('/api/auth/start', { method: 'POST', body: { phone: PHONE_LOCKOUT }, jar })
    expect(start.status).toBe(201)
    const challengeId = start.json.challengeId as string

    // Burn all 5 attempts with a wrong code.
    for (let i = 0; i < 5; i++) {
      const wrong = await api(`/api/auth/challenge/${challengeId}/verify`, {
        method: 'POST',
        body: { code: '111111' },
        jar,
      })
      expect(wrong.status).toBe(401)
    }

    // 6th call: lockout should kick in.
    const locked = await api(`/api/auth/challenge/${challengeId}/verify`, {
      method: 'POST',
      body: { code: '111111' },
      jar,
    })
    expect(locked.status).toBe(429)

    // BUG: calling verify again with NO code at all currently returns 200 and
    // issues a full session — the lockout only guards the `PENDING` branch,
    // and once the challenge flips to `EXPIRED` the code-check is skipped
    // entirely, falling through straight to "find/create user, issue session".
    const afterLockout = await api(`/api/auth/challenge/${challengeId}/verify`, {
      method: 'POST',
      body: {},
      jar,
    })
    expect(afterLockout.status).not.toBe(200)
    expect([401, 410]).toContain(afterLockout.status)
  })
})

describe('confirmed challenge reuse', () => {
  it('BUG: a CONFIRMED challengeId cannot be replayed to mint another session with the wrong/no code', async () => {
    const jar = new CookieJar()
    const start = await api('/api/auth/start', { method: 'POST', body: { phone: PHONE_REUSE }, jar })
    expect(start.status).toBe(201)
    const challengeId = start.json.challengeId as string

    const verify = await api(`/api/auth/challenge/${challengeId}/verify`, {
      method: 'POST',
      body: { code: '999999' },
      jar,
    })
    expect(verify.status).toBe(200)

    // BUG: the challenge is CONFIRMED now, but replaying /verify on the same
    // id — with a wrong code, or no code — currently still returns 200 and
    // mints a brand new session. A confirmed challenge should be single-use.
    const replay = await api(`/api/auth/challenge/${challengeId}/verify`, {
      method: 'POST',
      body: { code: '000000' },
    })
    expect(replay.status).not.toBe(200)
  })
})
