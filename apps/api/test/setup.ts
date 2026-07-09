import { api, CookieJar, randomSlug } from './helpers'

/**
 * Creates a business + one resource with a daily 08:00-20:00 schedule, owned by `jar`.
 * Test phone numbers get reused across separate test runs, and the FREE plan caps an
 * account at one business — so if this phone already owns one (from a prior run),
 * reuse it instead of failing; a fresh resource+schedule is always created either way.
 */
export async function setupBusinessWithResource(jar: CookieJar, opts: { slugPrefix: string }) {
  const biz = await api('/api/businesses', {
    method: 'POST',
    jar,
    body: {
      name: `QA Test Salon ${opts.slugPrefix}`,
      slug: randomSlug(opts.slugPrefix),
      type: 'SALON',
    },
  })
  let businessId: string
  if (biz.status === 201) {
    businessId = biz.json.id as string
  } else {
    const mine = await api('/api/businesses/my', { jar })
    const existing = mine.json?.[0]?.id as string | undefined
    if (mine.status !== 200 || !existing) {
      throw new Error(`business create failed (${biz.status} ${JSON.stringify(biz.json)}) and no existing business to reuse`)
    }
    businessId = existing
  }

  const resource = await api('/api/resources', {
    method: 'POST',
    jar,
    body: { businessId, name: 'Chair 1', capacity: 2 },
  })
  if (resource.status !== 201) throw new Error(`resource create failed: ${resource.status} ${JSON.stringify(resource.json)}`)
  const resourceId = resource.json.id as string

  const schedule = await api(`/api/resources/${resourceId}/schedules`, {
    method: 'POST',
    jar,
    body: { dayOfWeek: [0, 1, 2, 3, 4, 5, 6], startTime: '08:00', endTime: '20:00' },
  })
  if (schedule.status !== 201) throw new Error(`schedule create failed: ${schedule.status} ${JSON.stringify(schedule.json)}`)

  return { businessId, resourceId, scheduleId: schedule.json.id as string }
}
