export default function GlobalNotFound() {
  return (
    <html lang="ru">
      <body>
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 48, fontWeight: 700, color: '#2563eb' }}>404</div>
            <p>Страница не найдена</p>
            <a href="/" style={{ color: '#2563eb' }}>На главную</a>
          </div>
        </div>
      </body>
    </html>
  )
}
