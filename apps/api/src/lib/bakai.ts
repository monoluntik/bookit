const BASE = process.env.BAKAI_API_URL ?? 'https://openbanking-api.bakai.kg'

let cachedToken: string | null = null
let tokenExpiry = 0

async function getToken(): Promise<string> {
  if (cachedToken && Date.now() < tokenExpiry) return cachedToken

  const res = await fetch(`${BASE}/Auth/Login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: process.env.BAKAI_USERNAME,
      password: process.env.BAKAI_PASSWORD,
    }),
  })

  if (!res.ok) throw new Error(`Bakai auth failed: ${res.status}`)
  const data = await res.json() as { token: string }
  cachedToken = data.token
  tokenExpiry = Date.now() + 50 * 60 * 1000 // 50 min
  return cachedToken!
}

export interface CreatePayLinkParams {
  amount: number
  transactionId: string
  redirectUrl: string
  bookingId?: string
  ttlMinutes?: number
}

export interface PayLinkResult {
  payUrl: string
  transactionId: string
}

export async function createPayLink(params: CreatePayLinkParams): Promise<PayLinkResult> {
  if (!process.env.BAKAI_USERNAME || !process.env.BAKAI_PASSWORD) {
    // Dev mode — return fake URL
    return {
      payUrl: `${process.env.FRONTEND_URL}/booking/pay-mock?txId=${params.transactionId}&amount=${params.amount}&bookingId=${params.bookingId ?? ''}`,
      transactionId: params.transactionId,
    }
  }

  const token = await getToken()
  const res = await fetch(`${BASE}/api/PayLink/CreatePayLink`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
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

export async function getPaymentStatus(transactionId: string): Promise<'PENDING' | 'SUCCESS' | 'FAILED'> {
  if (!process.env.BAKAI_USERNAME || !process.env.BAKAI_PASSWORD) {
    return 'SUCCESS' // Dev mock
  }

  const token = await getToken()
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
