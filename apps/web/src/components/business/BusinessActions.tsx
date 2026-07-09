'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'

interface Props {
  phone?: string | null
  shareName: string
}

export default function BusinessActions({ phone, shareName }: Props) {
  const [copied, setCopied] = useState(false)
  const t = useTranslations('Business')

  const handleShare = async () => {
    const shareUrl = window.location.href
    if (navigator.share) {
      await navigator.share({ title: shareName, url: shareUrl }).catch(() => {})
    } else {
      await navigator.clipboard.writeText(shareUrl).catch(() => {})
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="flex gap-2 mb-6">
      {phone && (
        <a href={`tel:${phone}`}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
          📞 {t('actions.call')}
        </a>
      )}
      <button onClick={handleShare}
        className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-medium transition-colors
          ${copied
            ? 'border-green-400 text-green-600 bg-green-50'
            : 'border-gray-200 text-gray-700 hover:bg-gray-50'}`}>
        {copied ? `✓ ${t('actions.copied')}` : `🔗 ${t('actions.share')}`}
      </button>
    </div>
  )
}
