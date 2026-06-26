const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options?.headers },
  })

  if (!res.ok) {
    // Auto-logout on expired token (only in browser)
    if (res.status === 401 && typeof window !== 'undefined') {
      window.dispatchEvent(new Event('auth:expired'))
    }
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
  }, token: string) =>
    apiFetch<any>('/api/bookings', {
      method: 'POST', body: JSON.stringify(data),
      headers: { Authorization: `Bearer ${token}` },
    }),

  login: (email: string, password: string) =>
    apiFetch<{ user: any; token: string }>('/api/auth/login', {
      method: 'POST', body: JSON.stringify({ email, password }),
    }),

  register: (data: { email: string; password: string; name: string; phone?: string }) =>
    apiFetch<{ user: any; token: string }>('/api/auth/register', {
      method: 'POST', body: JSON.stringify(data),
    }),

  getMe: (token: string) =>
    apiFetch<any>('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } }),

  getMyBusinesses: (token: string) =>
    apiFetch<any[]>('/api/businesses/my', { headers: { Authorization: `Bearer ${token}` } }),

  getBusinessBookings: (businessId: string, token: string, params?: { date?: string; status?: string }) => {
    const q = new URLSearchParams(params as Record<string, string>).toString()
    return apiFetch<any[]>(
      `/api/bookings/business/${businessId}${q ? `?${q}` : ''}`,
      { headers: { Authorization: `Bearer ${token}` } },
    )
  },

  updateBookingStatus: (bookingId: string, status: string, token: string) =>
    apiFetch<any>(`/api/bookings/${bookingId}/status`, {
      method: 'PATCH', body: JSON.stringify({ status }),
      headers: { Authorization: `Bearer ${token}` },
    }),

  // Amount no longer sent from client — server derives it from service
  initiatePayment: (bookingId: string, token: string) =>
    apiFetch<{ payUrl: string; transactionId: string; amount: number }>('/api/payments/initiate', {
      method: 'POST', body: JSON.stringify({ bookingId }),
      headers: { Authorization: `Bearer ${token}` },
    }),

  getMyBookings: (token: string, page = 1) =>
    apiFetch<{ bookings: any[]; total: number; page: number; totalPages: number }>(
      `/api/bookings/my?page=${page}&limit=20`,
      { headers: { Authorization: `Bearer ${token}` } },
    ),

  getBooking: (id: string, token: string) =>
    apiFetch<any>(`/api/bookings/${id}`, { headers: { Authorization: `Bearer ${token}` } }),

  getPaymentStatus: (bookingId: string, token: string) =>
    apiFetch<{ status: string; amount: number; paidAt: string | null }>(
      `/api/payments/status/${bookingId}`,
      { headers: { Authorization: `Bearer ${token}` } },
    ),

  getStats: (businessId: string, token: string) =>
    apiFetch<any>(`/api/stats/business/${businessId}`, { headers: { Authorization: `Bearer ${token}` } }),

  getStaff: (businessId: string, token: string) =>
    apiFetch<any[]>(`/api/staff/business/${businessId}`, { headers: { Authorization: `Bearer ${token}` } }),

  addStaff: (data: { businessId: string; email: string; position?: string }, token: string) =>
    apiFetch<any>('/api/staff', { method: 'POST', body: JSON.stringify(data), headers: { Authorization: `Bearer ${token}` } }),

  removeStaff: (id: string, token: string) =>
    apiFetch<any>(`/api/staff/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } }),

  updateBusiness: (id: string, data: any, token: string) =>
    apiFetch<any>(`/api/businesses/${id}`, {
      method: 'PATCH', body: JSON.stringify(data),
      headers: { Authorization: `Bearer ${token}` },
    }),

  updateProfile: (data: { name?: string; phone?: string; currentPassword?: string; newPassword?: string }, token: string) =>
    apiFetch<any>('/api/auth/me', {
      method: 'PATCH', body: JSON.stringify(data),
      headers: { Authorization: `Bearer ${token}` },
    }),

  getBusinessesByType: (type: string) =>
    apiFetch<{ businesses: any[]; total: number }>(`/api/businesses?type=${type}&limit=6`),

  getReviews: (businessId: string) =>
    apiFetch<{ reviews: any[]; total: number; avgRating: number | null; reviewCount: number; totalPages?: number }>(
      `/api/reviews/business/${businessId}`,
    ),

  submitReview: (data: { bookingId: string; rating: number; comment?: string }, token: string) =>
    apiFetch<any>('/api/reviews', {
      method: 'POST', body: JSON.stringify(data),
      headers: { Authorization: `Bearer ${token}` },
    }),

  forgotPassword: (email: string) =>
    apiFetch<{ ok: boolean }>('/api/auth/forgot-password', {
      method: 'POST', body: JSON.stringify({ email }),
    }),

  resetPassword: (token: string, password: string) =>
    apiFetch<{ ok: boolean }>('/api/auth/reset-password', {
      method: 'POST', body: JSON.stringify({ token, password }),
    }),

  searchBusinesses: (params: {
    query?: string; type?: string; page?: number; limit?: number
    minRating?: number; hasPhoto?: boolean; onlineOnly?: boolean
    sort?: 'newest' | 'az' | 'za' | 'rating'
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
