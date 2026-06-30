const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN
const API_BASE = BOT_TOKEN ? `https://api.telegram.org/bot${BOT_TOKEN}` : null

export function isTelegramConfigured(): boolean {
  return !!API_BASE
}

export async function sendTelegramMessage(chatId: string, text: string): Promise<void> {
  if (!API_BASE) {
    console.log('[telegram] TELEGRAM_BOT_TOKEN not set — skipping message to', chatId)
    return
  }
  const res = await fetch(`${API_BASE}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' }),
  })
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    console.error(`[telegram] sendMessage failed: ${res.status} ${body}`)
  }
}

export function getBotUsername(): string | null {
  return process.env.TELEGRAM_BOT_USERNAME ?? null
}

export function buildLinkUrl(token: string): string | null {
  const username = getBotUsername()
  if (!username) return null
  return `https://t.me/${username}?start=${token}`
}
