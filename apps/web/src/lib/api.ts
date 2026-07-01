const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'

let refreshInFlight: Promise<boolean> | null = null

async function tryRefresh(): Promise<boolean> {
  if (!refreshInFlight) {
    refreshInFlight = fetch(`${API_URL}/api/auth/refresh`, { method: 'POST', credentials: 'include' })
      .then(res => res.ok)
      .catch(() => false)
      .finally(() => { refreshInFlight = null })
  }
  return refreshInFlight
}

async function apiFetch<T>(path: string, options?: RequestInit, _isRetry = false): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...options?.headers },
  })

  if (res.status === 401 && typeof window !== 'undefined' && !_isRetry && !path.startsWith('/api/auth/')) {
    const refreshed = await tryRefresh()
    if (refreshed) return apiFetch<T>(path, options, true)
    window.dispatchEvent(new Event('auth:expired'))
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    const msg = typeof err.error === 'string'
      ? err.error
      : typeof err.message === 'string'
        ? err.message
        : `Ошибка ${res.status}`
    throw new Error(msg)
  }

  return res.json()
}

export const api = {
  getBusiness: (slug: string) => apiFetch<any>(`/api/businesses/${slug}`),
  getServices: (businessId: string) => apiFetch<any[]>(`/api/services/business/${businessId}`),
  getSlots: (resourceId: string, date: string, extra = '') =>
    apiFetch<{ date: string; slots: { start: string; end: string }[] }>(
      `/api/resources/${resourceId}/slots?date=${date}${extra}`,
    ),

  createBooking: (data: {
    resourceId: string; serviceId?: string; startAt: string; endAt: string
    guestCount?: number; notes?: string
  }) =>
    apiFetch<any>('/api/bookings', { method: 'POST', body: JSON.stringify(data) }),

  // Name + phone entry — begins a Telegram/SMS confirmation challenge
  startAuth: (name: string, phone: string) =>
    apiFetch<{ challengeId: string; telegramDeepLink: string | null; canPushTelegram: boolean }>(
      '/api/auth/start', { method: 'POST', body: JSON.stringify({ name, phone }) },
    ),

  sendChallengeCode: (challengeId: string, channel: 'TELEGRAM' | 'SMS') =>
    apiFetch<{ ok: true }>(`/api/auth/challenge/${challengeId}/send`, {
      method: 'POST', body: JSON.stringify({ channel }),
    }),

  getChallengeStatus: (challengeId: string) =>
    apiFetch<{ status: 'PENDING' | 'CONFIRMED' | 'EXPIRED' }>(`/api/auth/challenge/${challengeId}/status`),

  verifyChallenge: (challengeId: string, code?: string) =>
    apiFetch<{ user: any }>(`/api/auth/challenge/${challengeId}/verify`, {
      method: 'POST', body: JSON.stringify({ code }),
    }),

  logout: () => apiFetch<{ ok: true }>('/api/auth/logout', { method: 'POST' }),

  getMe: () => apiFetch<any>('/api/auth/me'),

  getMyBusinesses: () => apiFetch<any[]>('/api/businesses/my'),

  getBusinessBookings: (businessId: string, params?: { date?: string; status?: string }) => {
    const q = new URLSearchParams(params as Record<string, string>).toString()
    return apiFetch<any[]>(`/api/bookings/business/${businessId}${q ? `?${q}` : ''}`)
  },

  updateBookingStatus: (bookingId: string, status: string) =>
    apiFetch<any>(`/api/bookings/${bookingId}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),

  // Amount no longer sent from client — server derives it from service
  initiatePayment: (bookingId: string) =>
    apiFetch<{ payUrl: string; transactionId: string; amount: number }>('/api/payments/initiate', {
      method: 'POST', body: JSON.stringify({ bookingId }),
    }),

  getMyBookings: (page = 1) =>
    apiFetch<{ bookings: any[]; total: number; page: number; totalPages: number }>(
      `/api/bookings/my?page=${page}&limit=20`,
    ),

  getBooking: (id: string) => apiFetch<any>(`/api/bookings/${id}`),

  getPaymentStatus: (bookingId: string) =>
    apiFetch<{ status: string; amount: number; paidAt: string | null }>(`/api/payments/status/${bookingId}`),

  getStats: (businessId: string) => apiFetch<any>(`/api/stats/business/${businessId}`),

  getStaff: (businessId: string) => apiFetch<any[]>(`/api/staff/business/${businessId}`),

  addStaff: (data: { businessId: string; phone: string; position?: string }) =>
    apiFetch<any>('/api/staff', { method: 'POST', body: JSON.stringify(data) }),

  removeStaff: (id: string) => apiFetch<any>(`/api/staff/${id}`, { method: 'DELETE' }),

  updateBusiness: (id: string, data: any) =>
    apiFetch<any>(`/api/businesses/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),

  updateProfile: (data: { name?: string }) =>
    apiFetch<any>('/api/auth/me', { method: 'PATCH', body: JSON.stringify(data) }),

  getBusinessesByType: (type: string) =>
    apiFetch<{ businesses: any[]; total: number }>(`/api/businesses?type=${type}&limit=6`),

  getReviews: (businessId: string) =>
    apiFetch<{ reviews: any[]; total: number; avgRating: number | null; reviewCount: number; totalPages?: number }>(
      `/api/reviews/business/${businessId}`,
    ),

  submitReview: (data: { bookingId: string; rating: number; comment?: string }) =>
    apiFetch<any>('/api/reviews', { method: 'POST', body: JSON.stringify(data) }),

  searchBusinesses: (params: {
    query?: string; type?: string; page?: number; limit?: number
    minRating?: number; hasPhoto?: boolean; onlineOnly?: boolean
    sort?: 'newest' | 'az' | 'za' | 'rating'; locale?: string
  }) => {
    const q = new URLSearchParams(
      Object.fromEntries(
        Object.entries(params)
          .filter(([, v]) => v != null && v !== false && v !== '')
          .map(([k, v]) => [k, String(v)])
      ),
    ).toString()
    return apiFetch<{ businesses: any[]; total: number; page: number; totalPages: number }>(
      `/api/businesses?${q}`,
    )
  },
}
