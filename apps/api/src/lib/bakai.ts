const BASE = process.env.BAKAI_API_URL ?? 'https://openbanking-api.bakai.kg'

// Bakai's `/Auth/Login` password is single-use and there is no refresh-token
// endpoint in their API — so we exchange login+password for a token exactly
// once (when the business owner connects, see routes/business.ts) and persist
// that token on the Business row (`bakaiToken`). Everything below just uses
// the already-issued token; it never re-authenticates with username/password.

/** One-time exchange of Bakai login+password for a durable token. Throws on failure. */
export async function loginBakai(login: string, password: string): Promise<string> {
  const res = await fetch(`${BASE}/Auth/Login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ login, password }),
  })

  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`Bakai auth failed: ${res.status} ${body}`)
  }
  const data = await res.json() as { token?: string }
  if (!data.token) throw new Error('Bakai auth: no token in response')
  return data.token
}

export interface CreatePayLinkParams {
  amount: number
  transactionId: string
  redirectUrl: string
  bookingId?: string
  ttlMinutes?: number
  token?: string | null
}

export interface PayLinkResult {
  payUrl: string
  transactionId: string
}

export async function createPayLink(params: CreatePayLinkParams): Promise<PayLinkResult> {
  if (!params.token) {
    return {
      payUrl: `${process.env.FRONTEND_URL ?? 'http://localhost:3000'}/booking/pay-mock?txId=${params.transactionId}&amount=${params.amount}&bookingId=${params.bookingId ?? ''}`,
      transactionId: params.transactionId,
    }
  }

  const res = await fetch(`${BASE}/api/PayLink/CreatePayLink`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${params.token}` },
    body: JSON.stringify({
      amount: params.amount,
      transactionID: params.transactionId,
      redirectURL: params.redirectUrl,
      ttl: params.ttlMinutes ?? 30,
      ttlUnits: 1, // QrTtlUnits.Minutes
    }),
  })

  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`Bakai createPayLink failed: ${res.status} ${body}`)
  }

  // The CreatePayLink response shape isn't formally documented in Bakai's spec
  // (just "returns a link"), so accept either a bare string body or a JSON
  // object with one of a few plausible field names.
  const raw = await res.text()
  let payUrl: string | undefined
  try {
    const data = JSON.parse(raw) as Record<string, unknown>
    payUrl = (data.url ?? data.payUrl ?? data.link ?? data.Url ?? data.PayLink) as string | undefined
  } catch {
    payUrl = raw.trim().replace(/^"|"$/g, '') || undefined
  }
  if (!payUrl) throw new Error(`Bakai createPayLink: could not parse pay URL from response: ${raw}`)

  return { payUrl, transactionId: params.transactionId }
}

export async function getPaymentStatus(
  transactionId: string,
  token?: string | null,
): Promise<'PENDING' | 'SUCCESS' | 'FAILED'> {
  if (!token) return 'SUCCESS'

  const res = await fetch(
    `${BASE}/api/Qr/GetStateCustomQr?qrType=PayLink&transactionID=${transactionId}`,
    { headers: { Authorization: `Bearer ${token}` } },
  )

  if (!res.ok) return 'PENDING'
  const data = await res.json() as { state?: string }

  if (data.state === 'Success' || data.state === 'Processed') return 'SUCCESS'
  if (data.state === 'Error') return 'FAILED'
  return 'PENDING'
}
