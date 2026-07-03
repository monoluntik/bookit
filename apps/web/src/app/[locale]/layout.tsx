import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import { notFound } from 'next/navigation'
import { NextIntlClientProvider, hasLocale } from 'next-intl'
import { setRequestLocale } from 'next-intl/server'
import { Suspense } from 'react'
import '../globals.css'
import { AuthProvider } from '@/context/AuthContext'
import { ToastProvider } from '@/context/ToastContext'
import { routing, type Locale } from '@/i18n/routing'
import FloatingLanguageSwitcher from '@/components/FloatingLanguageSwitcher'

const geist = Geist({ variable: '--font-geist-sans', subsets: ['latin'] })

export function generateStaticParams() {
  return routing.locales.map(locale => ({ locale }))
}

export const metadata: Metadata = {
  title: 'Bronly — онлайн-бронирование для любого бизнеса',
  description: 'Забронируйте место в отеле, ресторане, салоне красоты, коворкинге или спортзале онлайн.',
  openGraph: {
    title: 'Bronly',
    description: 'Онлайн-бронирование для любого бизнеса',
    type: 'website',
  },
}

export default async function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  if (!hasLocale(routing.locales, locale)) notFound()
  setRequestLocale(locale as Locale)

  return (
    <html lang={locale} className={`${geist.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <NextIntlClientProvider>
          <AuthProvider><ToastProvider>{children}</ToastProvider></AuthProvider>
          <Suspense>
            <FloatingLanguageSwitcher />
          </Suspense>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
