'use client'

import { useEffect, useState, useCallback, useRef, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { useTranslations, useLocale } from 'next-intl'
import { Link } from '@/i18n/navigation'
import BusinessCard from '@/components/marketplace/BusinessCard'
import { api } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import CustomerBottomNav from '@/components/CustomerBottomNav'

const TYPE_KEYS = ['HOTEL', 'RESTAURANT', 'SALON', 'COWORKING', 'SPORT', 'MEDICAL', 'CUSTOM'] as const
const TYPE_ICONS: Record<string, string> = {
  HOTEL: '🏨', RESTAURANT: '🍽️', SALON: '💇', COWORKING: '💼',
  SPORT: '⚽', MEDICAL: '🏥', CUSTOM: '🏢',
}

const RATING_VALUES = [0, 3, 4, 4.5] as const

const SORT_VALUES = ['newest', 'rating', 'az', 'za'] as const

function ExploreContent() {
  const t = useTranslations('Explore')
  const locale = useLocale()
  const searchParams = useSearchParams()
  const { user } = useAuth()
  const TYPE_LABELS: Record<string, string> = Object.fromEntries(TYPE_KEYS.map(k => [k, t(`types.${k}`)]))
  const RATING_OPTIONS = RATING_VALUES.map(value => ({ value, label: value === 0 ? t('filters.ratingAny') : t('filters.ratingValue', { value }) }))
  const SORT_OPTIONS = SORT_VALUES.map(value => ({ value, label: t(`filters.sort.${value}`) }))

  const [businesses, setBusinesses] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [apiError, setApiError] = useState(false)

  // Filters
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [type, setType] = useState(searchParams.get('type') ?? '')
  const [minRating, setMinRating] = useState(0)
  const [hasPhoto, setHasPhoto] = useState(false)
  const [onlineOnly, setOnlineOnly] = useState(false)
  const [sort, setSort] = useState<'newest' | 'az' | 'za' | 'rating'>('newest')
  const [page, setPage] = useState(1)
  const [showFilters, setShowFilters] = useState(false)

  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(() => { setDebouncedSearch(search); setPage(1) }, 350)
  }, [search])

  const load = useCallback(async () => {
    setLoading(true)
    setApiError(false)
    try {
      const data = await api.searchBusinesses({
        ...(type ? { type } : {}),
        ...(debouncedSearch ? { query: debouncedSearch } : {}),
        ...(minRating > 0 ? { minRating } : {}),
        ...(hasPhoto ? { hasPhoto: true } : {}),
        ...(onlineOnly ? { onlineOnly: true } : {}),
        sort,
        page,
        limit: 12,
        locale,
      })
      setBusinesses(data.businesses ?? [])
      setTotal(data.total ?? 0)
      setTotalPages(data.totalPages ?? 1)
    } catch {
      setApiError(true)
      setBusinesses([])
    } finally {
      setLoading(false)
    }
  }, [type, page, debouncedSearch, minRating, hasPhoto, onlineOnly, sort])

  useEffect(() => { load() }, [load])

  const activeFilterCount = [
    minRating > 0, hasPhoto, onlineOnly, sort !== 'newest',
  ].filter(Boolean).length

  const resetAllFilters = () => {
    setType('')
    setSearch('')
    setMinRating(0)
    setHasPhoto(false)
    setOnlineOnly(false)
    setSort('newest')
    setPage(1)
  }

  const hasAnyFilter = Boolean(type || debouncedSearch || minRating > 0 || hasPhoto || onlineOnly || sort !== 'newest')

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Sticky header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/" className="text-blue-600 font-bold text-lg shrink-0">Booking</Link>

          {/* Search */}
          <div className="flex-1 relative">
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder={t('searchPlaceholder')}
              className="w-full pl-9 pr-9 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
            />
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
            </svg>
            {search && (
              <button onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-lg leading-none">×</button>
            )}
          </div>

          {/* Filter toggle button */}
          <button
            onClick={() => setShowFilters(v => !v)}
            className={`relative shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl border text-sm font-medium transition-colors
              ${showFilters || activeFilterCount > 0
                ? 'bg-blue-600 text-white border-blue-600'
                : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z"/>
            </svg>
            <span className="hidden sm:inline">{t('filters.title')}</span>
            {activeFilterCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold">
                {activeFilterCount}
              </span>
            )}
          </button>

          {user ? (
            <Link href="/profile" className="text-sm text-gray-600 hover:text-gray-900 shrink-0 font-medium hidden sm:block">
              {user.name.split(' ')[0]}
            </Link>
          ) : (
            <Link href="/login" className="text-sm text-gray-500 hover:text-gray-800 shrink-0 hidden sm:block">{t('login')}</Link>
          )}
        </div>

        {/* Expandable filter panel */}
        {showFilters && (
          <div className="border-t border-gray-100 bg-white">
            <div className="max-w-5xl mx-auto px-4 py-4 space-y-4">

              {/* Rating */}
              <div>
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">{t('filters.ratingHeading')}</div>
                <div className="flex flex-wrap gap-2">
                  {RATING_OPTIONS.map(opt => (
                    <button key={opt.value}
                      onClick={() => { setMinRating(opt.value); setPage(1) }}
                      className={`px-3.5 py-1.5 rounded-full text-sm font-medium border transition-colors
                        ${minRating === opt.value
                          ? 'bg-amber-500 text-white border-amber-500'
                          : 'bg-white text-gray-600 border-gray-200 hover:border-amber-300 hover:text-amber-700'}`}>
                      {opt.value > 0 && <span className="mr-0.5">★</span>}{opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap gap-4">
                {/* Sort */}
                <div>
                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">{t('filters.sortHeading')}</div>
                  <div className="flex flex-wrap gap-2">
                    {SORT_OPTIONS.map(opt => (
                      <button key={opt.value}
                        onClick={() => { setSort(opt.value as typeof sort); setPage(1) }}
                        className={`px-3.5 py-1.5 rounded-full text-sm font-medium border transition-colors
                          ${sort === opt.value
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'}`}>
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Toggles */}
                <div>
                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">{t('filters.extraHeading')}</div>
                  <div className="flex flex-wrap gap-2">
                    <ToggleChip
                      active={onlineOnly}
                      onClick={() => { setOnlineOnly(v => !v); setPage(1) }}
                      icon="📅"
                      label={t('filters.onlineBooking')}
                    />
                    <ToggleChip
                      active={hasPhoto}
                      onClick={() => { setHasPhoto(v => !v); setPage(1) }}
                      icon="📷"
                      label={t('filters.hasPhoto')}
                    />
                  </div>
                </div>
              </div>

              {/* Active filters summary + reset */}
              {hasAnyFilter && (
                <div className="flex items-center gap-3 pt-1 border-t border-gray-100">
                  <div className="flex flex-wrap gap-1.5 flex-1">
                    {type && <ActiveTag label={TYPE_LABELS[type]} onRemove={() => { setType(''); setPage(1) }} />}
                    {debouncedSearch && <ActiveTag label={t('filters.searchTag', { query: debouncedSearch })} onRemove={() => { setSearch(''); setPage(1) }} />}
                    {minRating > 0 && <ActiveTag label={t('filters.ratingValue', { value: minRating })} onRemove={() => { setMinRating(0); setPage(1) }} />}
                    {sort !== 'newest' && <ActiveTag label={SORT_OPTIONS.find(s => s.value === sort)?.label ?? sort} onRemove={() => { setSort('newest'); setPage(1) }} />}
                    {onlineOnly && <ActiveTag label={t('filters.onlineBooking')} onRemove={() => { setOnlineOnly(false); setPage(1) }} />}
                    {hasPhoto && <ActiveTag label={t('filters.hasPhoto')} onRemove={() => { setHasPhoto(false); setPage(1) }} />}
                  </div>
                  <button onClick={resetAllFilters}
                    className="text-xs text-red-400 hover:text-red-600 shrink-0 font-medium">
                    {t('filters.resetAll')}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Category chips row */}
        <div className="max-w-5xl mx-auto px-4 py-2.5 flex gap-2 overflow-x-auto pb-2.5 scrollbar-hide border-t border-gray-50">
          <button onClick={() => { setType(''); setPage(1) }}
            className={`px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors shrink-0
              ${!type ? 'bg-blue-600 text-white shadow-sm' : 'bg-white text-gray-600 border border-gray-200 hover:border-blue-300'}`}>
            {t('filters.all')}
          </button>
          {Object.entries(TYPE_LABELS).map(([typeKey, label]) => (
            <button key={typeKey} onClick={() => { setType(typeKey === type ? '' : typeKey); setPage(1) }}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors shrink-0 flex items-center gap-1
                ${type === typeKey ? 'bg-blue-600 text-white shadow-sm' : 'bg-white text-gray-600 border border-gray-200 hover:border-blue-300'}`}>
              {TYPE_ICONS[typeKey]} {label}
            </button>
          ))}
        </div>
      </header>

      {/* Main content */}
      <div className="max-w-5xl mx-auto px-4 py-6">

        {/* Loading skeleton */}
        {loading ? (
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {Array(6).fill(0).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl overflow-hidden shadow-sm">
                <div className="h-40 bg-gray-100 animate-pulse" />
                <div className="p-4 space-y-2">
                  <div className="h-4 bg-gray-100 animate-pulse rounded-lg w-3/4" />
                  <div className="h-3 bg-gray-100 animate-pulse rounded-lg w-full" />
                  <div className="h-3 bg-gray-100 animate-pulse rounded-lg w-1/2" />
                </div>
              </div>
            ))}
          </div>

        /* Error state */
        ) : apiError ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">😵</div>
            <p className="text-gray-700 font-medium mb-2">{t('errorState.title')}</p>
            <p className="text-sm text-gray-400 mb-6">{t('errorState.subtitle')}</p>
            <button onClick={load}
              className="px-6 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700">
              {t('errorState.retry')}
            </button>
          </div>

        /* Empty state */
        ) : businesses.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">🔍</div>
            <p className="text-gray-700 font-medium mb-2">{t('emptyState.title')}</p>
            {hasAnyFilter ? (
              <>
                <p className="text-sm text-gray-400 mb-5">
                  {t('emptyState.withFiltersSubtitle')}
                </p>
                <button onClick={resetAllFilters}
                  className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700">
                  {t('emptyState.resetFilters')}
                </button>
              </>
            ) : (
              <p className="text-sm text-gray-400">{t('emptyState.noBusinessesYet')}</p>
            )}
          </div>

        /* Results */
        ) : (
          <>
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-gray-400">
                {t('results.count', { count: total })}
                {sort === 'rating' && <span className="ml-1 text-amber-500">{t('results.byRating')}</span>}
              </span>
            </div>

            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {businesses.map(b => <BusinessCard key={b.id} business={b} />)}
            </div>

            {totalPages > 1 && (
              <div className="flex justify-center gap-3 mt-8">
                <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
                  className="px-4 py-2 rounded-xl border border-gray-200 text-sm disabled:opacity-40 hover:bg-gray-50">
                  ← {t('pagination.back')}
                </button>
                <span className="self-center text-sm text-gray-500">{t('pagination.pageOf', { page, totalPages })}</span>
                <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}
                  className="px-4 py-2 rounded-xl border border-gray-200 text-sm disabled:opacity-40 hover:bg-gray-50">
                  {t('pagination.next')} →
                </button>
              </div>
            )}
          </>
        )}
      </div>
      <CustomerBottomNav />
    </div>
  )
}

function ToggleChip({ active, onClick, icon, label }: {
  active: boolean; onClick: () => void; icon: string; label: string
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm font-medium border transition-colors
        ${active
          ? 'bg-green-600 text-white border-green-600'
          : 'bg-white text-gray-600 border-gray-200 hover:border-green-300 hover:text-green-700'}`}
    >
      <span>{icon}</span>{label}
      {active && <span className="ml-0.5">✓</span>}
    </button>
  )
}

function ActiveTag({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 border border-blue-100 px-2.5 py-0.5 rounded-full text-xs font-medium">
      {label}
      <button onClick={onRemove} className="text-blue-400 hover:text-blue-700 ml-0.5 leading-none font-bold">×</button>
    </span>
  )
}

export default function ExplorePage() {
  return <Suspense><ExploreContent /></Suspense>
}
