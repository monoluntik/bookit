import { Resend } from 'resend'

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null
const FROM = process.env.EMAIL_FROM ?? 'Bronly <noreply@bronly.app>'

function fmt(iso: string, opts: Intl.DateTimeFormatOptions) {
  return new Date(iso).toLocaleString('ru', { timeZone: 'Asia/Bishkek', ...opts })
}

function bookingHtml(booking: any, business: any): string {
  const date = fmt(booking.startAt, { day: 'numeric', month: 'long', year: 'numeric' })
  const start = fmt(booking.startAt, { hour: '2-digit', minute: '2-digit' })
  const end = fmt(booking.endAt, { hour: '2-digit', minute: '2-digit' })

  return `<!DOCTYPE html>
<html lang="ru">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <div style="max-width:480px;margin:40px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.08)">
    <div style="background:#2563eb;padding:28px 32px">
      <div style="color:#fff;font-size:22px;font-weight:700">${business.name}</div>
      <div style="color:#93c5fd;font-size:13px;margin-top:4px">Подтверждение бронирования</div>
    </div>
    <div style="padding:28px 32px">
      <div style="background:#eff6ff;border-radius:12px;padding:16px 20px;margin-bottom:24px">
        <table style="width:100%;border-collapse:collapse">
          <tr><td style="padding:5px 0;color:#6b7280;font-size:13px">Ресурс</td><td style="padding:5px 0;color:#111827;font-size:13px;font-weight:600;text-align:right">${booking.resource?.name ?? '—'}</td></tr>
          ${booking.service ? `<tr><td style="padding:5px 0;color:#6b7280;font-size:13px">Услуга</td><td style="padding:5px 0;color:#111827;font-size:13px;font-weight:600;text-align:right">${booking.service.name}</td></tr>` : ''}
          <tr><td style="padding:5px 0;color:#6b7280;font-size:13px">Дата</td><td style="padding:5px 0;color:#111827;font-size:13px;font-weight:600;text-align:right">${date}</td></tr>
          <tr><td style="padding:5px 0;color:#6b7280;font-size:13px">Время</td><td style="padding:5px 0;color:#111827;font-size:13px;font-weight:600;text-align:right">${start} — ${end}</td></tr>
          <tr><td style="padding:5px 0;color:#6b7280;font-size:13px">Номер брони</td><td style="padding:5px 0;color:#2563eb;font-size:13px;font-weight:700;text-align:right">#${booking.id.slice(0,8).toUpperCase()}</td></tr>
        </table>
      </div>
      ${business.address ? `<div style="color:#6b7280;font-size:13px;margin-bottom:8px">📍 ${business.address}</div>` : ''}
      ${business.phone ? `<div style="color:#6b7280;font-size:13px">📞 ${business.phone}</div>` : ''}
    </div>
    <div style="padding:16px 32px;border-top:1px solid #f3f4f6;color:#9ca3af;font-size:12px;text-align:center">
      Для отмены обратитесь напрямую в заведение
    </div>
  </div>
</body>
</html>`
}

function cancelHtml(booking: any, business: any): string {
  const date = fmt(booking.startAt, { day: 'numeric', month: 'long', year: 'numeric' })
  const start = fmt(booking.startAt, { hour: '2-digit', minute: '2-digit' })
  return `<!DOCTYPE html>
<html lang="ru">
<body style="margin:0;padding:0;background:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <div style="max-width:480px;margin:40px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.08)">
    <div style="background:#dc2626;padding:28px 32px">
      <div style="color:#fff;font-size:22px;font-weight:700">${business.name}</div>
      <div style="color:#fca5a5;font-size:13px;margin-top:4px">Бронирование отменено</div>
    </div>
    <div style="padding:28px 32px;color:#374151;font-size:14px">
      Ваше бронирование <b>#${booking.id.slice(0,8).toUpperCase()}</b> на <b>${date}</b> в <b>${start}</b> было отменено.
      <br><br>Если это ошибка — свяжитесь с заведением: ${business.phone ?? business.email ?? ''}
    </div>
  </div>
</body>
</html>`
}

export async function sendBookingConfirmation(booking: any, business: any, customerEmail: string) {
  if (!resend) {
    console.log('[email] RESEND_API_KEY not set — skipping email to', customerEmail)
    return
  }
  await resend.emails.send({
    from: FROM,
    to: customerEmail,
    subject: `Бронь подтверждена — ${business.name}`,
    html: bookingHtml(booking, business),
  })
}

export async function sendBookingCancellation(booking: any, business: any, customerEmail: string) {
  if (!resend) {
    console.log('[email] RESEND_API_KEY not set — skipping cancellation email to', customerEmail)
    return
  }
  await resend.emails.send({
    from: FROM,
    to: customerEmail,
    subject: `Бронь отменена — ${business.name}`,
    html: cancelHtml(booking, business),
  })
}

export async function sendNewBookingAlert(booking: any, ownerEmail: string) {
  if (!resend) {
    console.log('[email] New booking alert skipped for', ownerEmail)
    return
  }
  const date = fmt(booking.startAt, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
  await resend.emails.send({
    from: FROM,
    to: ownerEmail,
    subject: `Новая бронь от ${booking.customer?.name ?? 'клиента'}`,
    html: `<p>Новая бронь на <b>${date}</b>.<br>Клиент: ${booking.customer?.name}, ${booking.customer?.phone ?? ''}<br>Ресурс: ${booking.resource?.name}</p>`,
  })
}
