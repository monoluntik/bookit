import { beforeAll, describe, expect, it } from 'vitest'
import { api, assertServerReachable, loginTestPhone } from './helpers'
import { setupBusinessWithResource } from './setup'

// REGRESSION test for a cross-tenant IDOR found during a full-platform QA pass
// (2026-07-08): DELETE /api/resources/:id/exceptions/:exceptionId checks that
// :id (the resource in the URL) belongs to the caller, but never checks that
// :exceptionId actually belongs to THAT resource's schedule — so any business
// owner can delete any other tenant's schedule exception by pairing their own
// resourceId with a stolen/guessed exceptionId. See apps/api/src/routes/resource.ts.
const PHONE_OWNER_A = '+996700000006'
const PHONE_OWNER_B = '+996700000012'

beforeAll(assertServerReachable)

describe('cross-tenant schedule exception deletion', () => {
  it('BUG: owner B cannot delete owner A exception via B\'s own resourceId', async () => {
    const jarA = await loginTestPhone(PHONE_OWNER_A)
    const jarB = await loginTestPhone(PHONE_OWNER_B)

    const { resourceId: resourceA } = await setupBusinessWithResource(jarA, { slugPrefix: 'qa-idor-a' })
    const { resourceId: resourceB } = await setupBusinessWithResource(jarB, { slugPrefix: 'qa-idor-b' })

    const created = await api(`/api/resources/${resourceA}/exceptions`, {
      method: 'POST',
      jar: jarA,
      body: { date: '2026-12-25', isClosed: true, reason: 'Holiday' },
    })
    expect(created.status).toBe(201)
    const exceptionId = created.json.id as string

    // Owner B attempts to delete A's exception, scoping the URL to B's OWN resource.
    const crossTenantDelete = await api(`/api/resources/${resourceB}/exceptions/${exceptionId}`, {
      method: 'DELETE',
      jar: jarB,
    })
    // Expected: 404 (exception doesn't belong to resourceB's schedule).
    // BUG today: this returns 200 and the exception is actually deleted.
    expect(crossTenantDelete.status).not.toBe(200)

    // The exception must still exist and be visible to its real owner (A).
    const listAfter = await api(`/api/resources/${resourceA}/exceptions`, { jar: jarA })
    expect(listAfter.status).toBe(200)
    const stillThere = (listAfter.json as any[]).some(e => e.id === exceptionId)
    expect(stillThere).toBe(true)
  })
})
