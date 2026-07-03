import crypto from 'crypto'
import { Signer } from '@mancho.devs/authorizer'

const BASE = process.env.FINIK_API_URL ?? 'https://api.acquiring.averspay.kg'
const FINIK_HOST = new URL(BASE).host
const PAYMENT_PATH = '/v1/payment'

// ─── Keypair generation (we generate it so the owner doesn't need OpenSSL) ──

export interface KeyPair {
  publicKey: string
  privateKey: string
}

export function generateFinikKeyPair(): KeyPair {
  const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
  })
  return { publicKey, privateKey }
}

// ─── Encryption at rest for the private key ─────────────────────────────────
// The private key signs real payment requests on the business's behalf, so it's
// materially more sensitive than a plain API credential — encrypt it with a
// server-only key (ENCRYPTION_KEY, 32 bytes base64) rather than storing it raw.

function getEncryptionKey(): Buffer {
  const raw = process.env.ENCRYPTION_KEY
  if (!raw) throw new Error('ENCRYPTION_KEY env var is required to store Finik private keys')
  const key = Buffer.from(raw, 'base64')
  if (key.length !== 32) throw new Error('ENCRYPTION_KEY must decode to exactly 32 bytes (base64-encoded)')
  return key
}

export function encryptPrivateKey(pem: string): string {
  const key = getEncryptionKey()
  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv)
  const ciphertext = Buffer.concat([cipher.update(pem, 'utf8'), cipher.final()])
  const authTag = cipher.getAuthTag()
  return [iv.toString('base64'), authTag.toString('base64'), ciphertext.toString('base64')].join('.')
}

export function decryptPrivateKey(encrypted: string): string {
  const key = getEncryptionKey()
  const [ivB64, tagB64, dataB64] = encrypted.split('.')
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(ivB64, 'base64'))
  decipher.setAuthTag(Buffer.from(tagB64, 'base64'))
  const plaintext = Buffer.concat([decipher.update(Buffer.from(dataB64, 'base64')), decipher.final()])
  return plaintext.toString('utf8')
}

// ─── Payment creation ────────────────────────────────────────────────────────

export interface CreateFinikPaymentParams {
  amount: number
  paymentId: string // our own UUID, echoed back in the webhook's fields.paymentId
  redirectUrl: string
  webhookUrl: string
  accountId: string
  nameEn?: string
  apiKey: string
  privateKeyPem: string
}

export interface PayLinkResult {
  payUrl: string
}

export async function createFinikPayment(params: CreateFinikPaymentParams): Promise<PayLinkResult> {
  const timestamp = String(Date.now())
  const body = {
    CardType: 'FINIK_QR',
    PaymentId: params.paymentId,
    RedirectUrl: params.redirectUrl,
    Amount: params.amount,
    Data: {
      accountId: params.accountId,
      name_en: params.nameEn ?? 'Bronly',
      webhookUrl: params.webhookUrl,
    },
  }

  const requestData = {
    body,
    headers: {
      Host: FINIK_HOST,
      'x-api-key': params.apiKey,
      'x-api-timestamp': timestamp,
    },
    httpMethod: 'POST',
    path: PAYMENT_PATH,
    queryStringParameters: null,
  }

  const signature = await new Signer(requestData).sign(params.privateKeyPem)

  const res = await fetch(`${BASE}${PAYMENT_PATH}`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': params.apiKey,
      'x-api-timestamp': timestamp,
      signature,
    },
    body: JSON.stringify(body),
    redirect: 'manual',
  })

  const payUrl = res.headers.get('location')
  if (!payUrl) {
    const text = await res.text().catch(() => '')
    throw new Error(`Finik createPayment failed: ${res.status} ${text}`)
  }
  return { payUrl }
}

// ─── Webhook verification ───────────────────────────────────────────────────
// Finik signs webhook requests with their own private key; we verify with
// their public key, which they publish (not per-business — set once via env).

export interface FinikWebhookRequest {
  body: Record<string, unknown>
  headers: Record<string, string | undefined>
  httpMethod: string
  path: string
  queryStringParameters?: Record<string, string | undefined> | null
}

export async function verifyFinikWebhook(request: FinikWebhookRequest, signature: string): Promise<boolean> {
  const publicKey = process.env.FINIK_WEBHOOK_PUBLIC_KEY
  if (!publicKey) {
    console.warn('[finik] FINIK_WEBHOOK_PUBLIC_KEY not set — cannot verify webhook signature')
    return false
  }
  const requestData = {
    body: request.body,
    headers: request.headers,
    httpMethod: request.httpMethod,
    path: request.path,
    queryStringParameters: request.queryStringParameters ?? null,
  }
  return new Signer(requestData).verify(publicKey, signature)
}
