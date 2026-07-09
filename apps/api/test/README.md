## Regression tests for the 2026-07-08 full-platform QA pass

These are integration tests that hit a **real running instance** of the API
(there's no exported Fastify app factory in `src/index.ts` to inject requests
into directly, so they go over HTTP like a real client).

Every test here currently **fails on purpose** — each one pins down a specific
bug found during manual + agent-driven QA testing, with the assertion written
against the *correct* expected behavior. A red run means the bug is still
present; once a fix lands, the corresponding test goes green and stays green,
protecting against a regression.

### Run

```bash
cd apps/api
pnpm dev                       # in one terminal — ALLOW_TEST_PHONES=true must be set
pnpm test                      # in another
```

Optional: `TEST_API_URL=http://localhost:4000 pnpm test` to point at a
different instance.

### What's covered

| File | Bug | Severity |
|---|---|---|
| `auth-security.test.ts` | `POST /api/auth/challenge/:id/verify` grants a session with no code at all right after the 5-attempt lockout fires | Critical |
| `auth-security.test.ts` | A `CONFIRMED` challenge never expires and can be replayed indefinitely to mint new sessions with any/no code | High |
| `resource-idor.test.ts` | `DELETE /api/resources/:id/exceptions/:exceptionId` never checks the exception belongs to `:id`'s schedule — cross-tenant delete | Critical |
| `booking-schedule-enforcement.test.ts` | `POST /api/bookings` ignores `ScheduleException` (closed/holiday days) | Critical |
| `booking-schedule-enforcement.test.ts` | `POST /api/bookings` ignores the resource's open hours (`Schedule`) | Critical |

These don't attempt full endpoint coverage — see the QA report for the
complete list of findings (including several lower-severity ones not yet
turned into automated tests).
