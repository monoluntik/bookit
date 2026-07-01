'use client'

import { useEffect, useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import { useAuth } from '@/context/AuthContext'
import { api } from '@/lib/api'

const RESEND_COOLDOWN_S = 60

interface Props {
  onAuthenticated: () => void
}

export default function PhoneAuthFlow({ onAuthenticated }: Props) {
  const t = useTranslations('Auth')
  const { refreshUser } = useAuth()

  const [step, setStep] = useState<'start' | 'confirm'>('start')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [challengeId, setChallengeId] = useState('')
  const [telegramDeepLink, setTelegramDeepLink] = useState<string | null>(null)
  const [canPushTelegram, setCanPushTelegram] = useState(false)
  const [method, setMethod] = useState<'TELEGRAM' | 'SMS'>('TELEGRAM')
  const [code, setCode] = useState('')
  const [cooldown, setCooldown] = useState(0)
  const [confirming, setConfirming] = useState(false)

  const finalizing = useRef(false)

  const handleStart = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await api.startAuth(name, phone)
      setChallengeId(res.challengeId)
      setTelegramDeepLink(res.telegramDeepLink)
      setCanPushTelegram(res.canPushTelegram)
      setMethod('TELEGRAM')
      setStep('confirm')
    } catch (err: any) {
      setError(err.message ?? t('step1.errorGeneric'))
    } finally {
      setLoading(false)
    }
  }

  const finalize = async (typedCode?: string) => {
    if (finalizing.current) return
    finalizing.current = true
    setConfirming(true)
    setError('')
    try {
      await api.verifyChallenge(challengeId, typedCode)
      await refreshUser()
      onAuthenticated()
    } catch (err: any) {
      setError(err.message ?? t('step2.errorCode'))
      finalizing.current = false
    } finally {
      setConfirming(false)
    }
  }

  // Poll for the deep-link auto-confirm flow while a Telegram challenge is pending
  useEffect(() => {
    if (step !== 'confirm' || method !== 'TELEGRAM') return
    const interval = setInterval(async () => {
      try {
        const res = await api.getChallengeStatus(challengeId)
        if (res.status === 'CONFIRMED') {
          clearInterval(interval)
          finalize()
        } else if (res.status === 'EXPIRED') {
          clearInterval(interval)
          setError(t('step2.errorExpired'))
        }
      } catch { /* keep polling */ }
    }, 2000)
    return () => clearInterval(interval)
  }, [step, method, challengeId])

  useEffect(() => {
    if (cooldown <= 0) return
    const timer = setTimeout(() => setCooldown(c => c - 1), 1000)
    return () => clearTimeout(timer)
  }, [cooldown])

  const selectMethod = async (next: 'TELEGRAM' | 'SMS') => {
    setMethod(next)
    setCode('')
    setError('')
    if (next === 'SMS') {
      try {
        await api.sendChallengeCode(challengeId, 'SMS')
        setCooldown(RESEND_COOLDOWN_S)
      } catch (err: any) {
        setError(err.message ?? t('step1.errorGeneric'))
      }
    }
  }

  const handleResend = async () => {
    if (cooldown > 0) return
    try {
      await api.sendChallengeCode(challengeId, method)
      setCooldown(RESEND_COOLDOWN_S)
    } catch (err: any) {
      setError(err.message ?? t('step1.errorGeneric'))
    }
  }

  const handleVerifySubmit = (e: React.FormEvent) => {
    e.preventDefault()
    finalize(code)
  }

  if (step === 'start') {
    return (
      <form onSubmit={handleStart} className="space-y-3">
        <input required placeholder={t('step1.namePlaceholder')} value={name}
          onChange={e => setName(e.target.value)} autoComplete="name"
          className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
        <input required type="tel" placeholder={t('step1.phonePlaceholder')} value={phone}
          onChange={e => setPhone(e.target.value)} autoComplete="tel"
          className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
        {error && <p className="text-sm text-red-500">{error}</p>}
        <button type="submit" disabled={loading}
          className="w-full py-2.5 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-60 text-sm">
          {loading ? t('step1.submitting') : t('step1.continue')}
        </button>
      </form>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex rounded-xl bg-gray-100 p-1">
        <button type="button" onClick={() => selectMethod('TELEGRAM')}
          className={`flex-1 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            method === 'TELEGRAM' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}>
          {t('step2.methodTelegram')} <span className="text-xs text-blue-500">({t('step2.recommended')})</span>
        </button>
        <button type="button" onClick={() => selectMethod('SMS')}
          className={`flex-1 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            method === 'SMS' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}>
          {t('step2.methodSms')}
        </button>
      </div>

      {method === 'TELEGRAM' && telegramDeepLink && (
        <div className="space-y-2">
          <a href={telegramDeepLink} target="_blank" rel="noopener noreferrer"
            className="block w-full text-center py-2.5 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 text-sm">
            {t('step2.openBot')}
          </a>
          <p className="text-xs text-gray-400">{t('step2.telegramHint')}</p>
          <p className="text-xs text-blue-500 flex items-center gap-1.5">
            <span className="inline-block w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
            {t('step2.waitingTelegram')}
          </p>
        </div>
      )}

      {method === 'TELEGRAM' && canPushTelegram && (
        <p className="text-xs text-gray-400">{t('step2.telegramHint')}</p>
      )}

      <form onSubmit={handleVerifySubmit} className="space-y-3">
        {method === 'SMS' && <p className="text-xs text-gray-400">{t('step2.smsHint', { phone })}</p>}
        <input inputMode="numeric" placeholder={t('step2.codePlaceholder')} value={code}
          onChange={e => setCode(e.target.value)} maxLength={6}
          className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm text-center tracking-widest focus:outline-none focus:ring-2 focus:ring-blue-300" />
        {error && <p className="text-sm text-red-500">{error}</p>}
        <button type="submit" disabled={confirming || code.length < 6}
          className="w-full py-2.5 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-60 text-sm">
          {confirming ? t('step2.confirming') : t('step2.confirm')}
        </button>
        <button type="button" onClick={handleResend} disabled={cooldown > 0}
          className="w-full text-center text-xs text-gray-400 hover:text-gray-600 disabled:opacity-60">
          {cooldown > 0 ? t('step2.resendIn', { seconds: cooldown }) : t('step2.resend')}
        </button>
      </form>

      <button type="button" onClick={() => { setStep('start'); setError('') }}
        className="w-full text-center text-xs text-gray-400 hover:text-gray-600">
        ← {t('back')}
      </button>
    </div>
  )
}
