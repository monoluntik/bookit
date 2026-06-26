const BASE = process.env.BAKAI_API_URL ?? 'https://openbanking-api.bakai.kg'

interface TokenEntry { token: string; expiry: number }
const tokenCache = new Map<string, TokenEntry>()

async function getToken(username: string, password: string, cacheKey: string): Promise<string> {
  const cached = tokenCache.get(cacheKey)
  if (cached && Date.now() < cached.expiry) return cached.token

  const res = await fetch(`${BASE}/Auth/Login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  })

  if (!res.ok) throw new Error(`Bakai auth failed: ${res.status}`)
  const data = await res.json() as { token: string }
  tokenCache.set(cacheKey, { token: data.token, expiry: Date.now() + 50 * 60 * 1000 })
  return data.token
}

export interface BusinessCredentials {
  username: string
  password: string
  businessId: string
}

export interface CreatePayLinkParams {
  amount: number
  transactionId: string
  redirectUrl: string
  bookingId?: string
  ttlMinutes?: number
  credentials?: BusinessCredentials
}

export interface PayLinkResult {
  payUrl: string
  transactionId: string
}

export async function createPayLink(params: CreatePayLinkParams): Promise<PayLinkResult> {
  const { credentials } = params

  if (!credentials?.username || !credentials?.password) {
    return {
      payUrl: `${process.env.FRONTEND_URL ?? 'http://localhost:3000'}/booking/pay-mock?txId=${params.transactionId}&amount=${params.amount}&bookingId=${params.bookingId ?? ''}`,
      transactionId: params.transactionId,
    }
  }

  const token = await getToken(credentials.username, credentials.password, credentials.businessId)
  const res = await fetch(`${BASE}/api/PayLink/CreatePayLink`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      amount: params.amount,
      transactionId: params.transactionId,
      redirectUrl: params.redirectUrl,
      ttlMinutes: params.ttlMinutes ?? 30,
    }),
  })

  if (!res.ok) throw new Error(`Bakai createPayLink failed: ${res.status}`)
  const data = await res.json() as { url?: string; payUrl?: string }
  return { payUrl: (data.url ?? data.payUrl)!, transactionId: params.transactionId }
}

export async function getPaymentStatus(
  transactionId: string,
  credentials?: BusinessCredentials,
): Promise<'PENDING' | 'SUCCESS' | 'FAILED'> {
  if (!credentials?.username || !credentials?.password) {
    return 'SUCCESS'
  }

  const token = await getToken(credentials.username, credentials.password, credentials.businessId)
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
