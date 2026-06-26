import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/context/AuthContext'
import { ToastProvider } from '@/context/ToastContext'

const geist = Geist({ variable: '--font-geist-sans', subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Booking — онлайн-бронирование для любого бизнеса',
  description: 'Забронируйте место в отеле, ресторане, салоне красоты, коворкинге или спортзале онлайн.',
  openGraph: {
    title: 'Booking',
    description: 'Онлайн-бронирование для любого бизнеса',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" className={`${geist.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <AuthProvider><ToastProvider>{children}</ToastProvider></AuthProvider>
      </body>
    </html>
  )
}
