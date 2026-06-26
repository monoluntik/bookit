import { notFound } from 'next/navigation'
import BusinessHero from '@/components/business/BusinessHero'
import ServicesList from '@/components/business/ServicesList'
import StaffList from '@/components/business/StaffList'
import RoomsList from '@/components/business/RoomsList'
import BookingFlowAdaptive from '@/components/booking/BookingFlowAdaptive'
import ReviewsList from '@/components/reviews/ReviewsList'
import GallerySection from '@/components/business/GallerySection'
import { getMeta } from '@/lib/businessTypes'
import BusinessPageNav from '@/components/business/BusinessPageNav'
import StickyBookingCTA from '@/components/business/StickyBookingCTA'

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'

interface Props {
  params: Promise<{ slug: string }>
}

async function getBusiness(slug: string) {
  const res = await fetch(`${API}/api/businesses/${slug}`, { cache: 'no-store' })
  if (!res.ok) return null
  return res.json()
}

async function getServices(businessId: string) {
  const res = await fetch(`${API}/api/services/business/${businessId}`, { cache: 'no-store' })
  if (!res.ok) return []
  return res.json()
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params
  const business = await getBusiness(slug)
  if (!business) return { title: 'Не найдено' }
  const title = `${business.name} — онлайн запись`
  const description = business.description
    ?? `Запишитесь онлайн в ${business.name}. Быстро, удобно, без звонков.`
  return {
    title,
    description,
    openGraph: {
      title: business.name,
      description,
      ...(business.logoUrl ? { images: [{ url: business.logoUrl }] } : {}),
    },
  }
}

export default async function BusinessPage({ params }: Props) {
  const { slug } = await params
  const business = await getBusiness(slug)
  if (!business) notFound()

  const services = await getServices(business.id)
  const meta = getMeta(business.type)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top nav — client component for auth-aware display */}
      <BusinessPageNav />

      <div className="max-w-3xl mx-auto px-4 py-6">
        {/* Hero */}
        <BusinessHero business={business} />

        {/* Photo gallery */}
        {business.images?.length > 0 && (
          <GallerySection images={business.images} />
        )}

        {/* Type-specific info blocks */}
        <StaffList resources={business.resources} businessType={business.type} />
        <RoomsList resources={business.resources} businessType={business.type} />
        <ServicesList services={services} businessType={business.type} />

        {/* Reviews */}
        <div className="mt-6">
          <h2 className="text-lg font-bold text-gray-900 mb-3">Отзывы</h2>
          <ReviewsList businessId={business.id} />
        </div>

        {/* Booking section */}
        <div id="booking" className="scroll-mt-4 mt-6">
          <h2 className="text-lg font-bold text-gray-900 mb-3">{meta.bookingVerb}</h2>
          {business.resources?.length > 0 ? (
            <BookingFlowAdaptive business={{ ...business, services }} />
          ) : (
            <div className="bg-white rounded-2xl p-8 text-center text-gray-400">
              <div className="text-4xl mb-3">{meta.icon}</div>
              <p>Онлайн-бронирование ещё не настроено</p>
            </div>
          )}
        </div>
      </div>
      <StickyBookingCTA label={meta.bookingVerb} />
    </div>
  )
}
