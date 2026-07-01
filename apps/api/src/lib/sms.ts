interface SmsProvider {
  send(phone: string, text: string): Promise<void>
}

class TwilioSmsProvider implements SmsProvider {
  private client: import('twilio').Twilio
  private from: string

  constructor(accountSid: string, authToken: string, from: string) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const twilio = require('twilio')
    this.client = twilio(accountSid, authToken)
    this.from = from
  }

  async send(phone: string, text: string): Promise<void> {
    await this.client.messages.create({ to: phone, from: this.from, body: text })
  }
}

class WebhookSmsProvider implements SmsProvider {
  constructor(private url: string) {}

  async send(phone: string, text: string): Promise<void> {
    const res = await fetch(this.url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, text }),
    })
    if (!res.ok) {
      const body = await res.text().catch(() => '')
      throw new Error(`SMS webhook provider failed: ${res.status} ${body}`)
    }
  }
}

class ConsoleSmsProvider implements SmsProvider {
  async send(phone: string, text: string): Promise<void> {
    console.log(`[sms] (no provider configured) to ${phone}: ${text}`)
  }
}

let provider: SmsProvider | null = null

export function getSmsProvider(): SmsProvider {
  if (provider) return provider

  const kind = process.env.SMS_PROVIDER
  if (kind === 'twilio' && process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_FROM) {
    provider = new TwilioSmsProvider(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN, process.env.TWILIO_FROM)
  } else if (kind === 'webhook' && process.env.SMS_WEBHOOK_URL) {
    provider = new WebhookSmsProvider(process.env.SMS_WEBHOOK_URL)
  } else {
    provider = new ConsoleSmsProvider()
  }
  return provider
}

export async function sendSmsCode(phone: string, code: string): Promise<void> {
  await getSmsProvider().send(phone, `Ваш код подтверждения: ${code}`)
}
