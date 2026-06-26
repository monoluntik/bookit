'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { api } from '@/lib/api'
import { getMeta } from '@/lib/businessTypes'
import ResourceSelector from './ResourceSelector'
import ServiceSelector from './ServiceSelector'
import DatePicker from './DatePicker'
import SlotPicker from './SlotPicker'
import BookingForm from './BookingForm'
import BookingConfirmation from './BookingConfirmation'
import HotelDateRange from './HotelDateRange'
import GuestCountStep from './GuestCountStep'

type AnyStep = 'service' | 'resource' | 'guests' | 'date' | 'dateRange' | 'slot' | 'form' | 'done'

interface FlowDef {
  steps: AnyStep[]
  labels: string[]
}

function getFlow(type: string, hasServices: boolean): FlowDef {
  switch (type) {
    case 'HOTEL':
      return { steps: ['resource', 'dateRange', 'guests', 'form', 'done'], labels: ['Номер', 'Даты', 'Гости', 'Данные', 'Готово'] }
    case 'RESTAURANT':
      return { steps: ['date', 'slot', 'guests', 'form', 'done'], labels: ['Дата', 'Время', 'Гости', 'Данные', 'Готово'] }
    case 'SALON':
      if (hasServices) return { steps: ['service', 'resource', 'date', 'slot', 'form', 'done'], labels: ['Услуга', 'Мастер', 'Дата', 'Время', 'Данные', 'Готово'] }
      return { steps: ['resource', 'date', 'slot', 'form', 'done'], labels: ['Мастер', 'Дата', 'Время', 'Данные', 'Готово'] }
    case 'MEDICAL':
      if (hasServices) return { steps: ['resource', 'service', 'date', 'slot', 'form', 'done'], labels: ['Врач', 'Приём', 'Дата', 'Время', 'Данные', 'Готово'] }
      return { steps: ['resource', 'date', 'slot', 'form', 'done'], labels: ['Врач', 'Дата', 'Время', 'Данные', 'Готово'] }
    default:
      if (hasServices) return { steps: ['resource', 'service', 'date', 'slot', 'form', 'done'], labels: ['Выбор', 'Услуга', 'Дата', 'Время', 'Данные', 'Готово'] }
      return { steps: ['resource', 'date', 'slot', 'form', 'done'], labels: ['Выбор', 'Дата', 'Время', 'Данные', 'Готово'] }
  }
}

interface Props { business: any }

export default function BookingFlowAdaptive({ business }: Props) {
  const { token } = useAuth()
  const meta = getMeta(business.type)
  const [services, setServices] = useState<any[]>([])

  const [selectedResource, setSelectedResource] = useState<any>(null)
  const [selectedService, setSelectedService] = useState<any>(null)
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedSlot, setSelectedSlot] = useState<{ start: string; end: string } | null>(null)
  const [checkIn, setCheckIn] = useState('')
  const [checkOut, setCheckOut] = useState('')
  const [nights, setNights] = useState(0)
  const [guestCount, setGuestCount] = useState(1)
  const [booking, setBooking] = useState<any>(null)

  useEffect(() => {
    api.getServices(business.id).then(setServices).catch(() => setServices([]))
  }, [business.id])

  const flow = getFlow(business.type, services.length > 0)
  const [stepIdx, setStepIdx] = useState(0)
  const step = flow.steps[stepIdx]
  const next = () => setStepIdx(i => i + 1)
  const back = () => setStepIdx(i => i - 1)

  // For restaurant — no resource selection, use first available resource
  const activeResource = selectedResource ?? (business.type === 'RESTAURANT' ? business.resources?.[0] : null)

  // Build slot start/end from hotel date range (14:00 check-in, 12:00 check-out)
  const hotelSlot = checkIn && checkOut ? {
    start: `${checkIn}T14:00:00`,
    end: `${checkOut}T12:00:00`,
  } : null

  const currentSlot = business.type === 'HOTEL' ? hotelSlot : selectedSlot

  return (
    <div className="bg-white rounded-2xl shadow-sm p-6">
      {/* Progress */}
      <div className="flex items-center mb-8 overflow-x-auto">
        {flow.labels.map((label, i) => (
          <div key={i} className="flex items-center shrink-0">
            <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium transition-colors
              ${i < stepIdx ? 'bg-blue-600 text-white' :
                i === stepIdx ? 'bg-blue-600 text-white ring-2 ring-blue-200' :
                'bg-gray-100 text-gray-400'}`}>
              {i < stepIdx ? '✓' : i + 1}
            </div>
            <span className={`ml-1.5 text-xs hidden sm:block whitespace-nowrap
              ${i === stepIdx ? 'text-blue-600 font-medium' : 'text-gray-400'}`}>
              {label}
            </span>
            {i < flow.labels.length - 1 && (
              <div className={`mx-2 h-px w-4 sm:w-6 shrink-0 ${i < stepIdx ? 'bg-blue-600' : 'bg-gray-200'}`} />
            )}
          </div>
        ))}
      </div>

      {/* Step: service */}
      {step === 'service' && (
        <ServiceSelector
          services={services}
          onSelect={s => { setSelectedService(s); next() }}
          onSkip={() => { setSelectedService(null); next() }}
          onBack={back}
        />
      )}

      {/* Step: resource */}
      {step === 'resource' && (
        <ResourceSelector
          resources={business.resources}
          onSelect={r => { setSelectedResource(r); next() }}
          label={meta.resourceLabel}
          resourceIcon={meta.resourceIcon}
        />
      )}

      {/* Step: date */}
      {step === 'date' && (
        <DatePicker onSelect={d => { setSelectedDate(d); next() }} onBack={back} />
      )}

      {/* Step: dateRange (hotel) */}
      {step === 'dateRange' && (
        <HotelDateRange
          onSelect={(ci, co, n) => { setCheckIn(ci); setCheckOut(co); setNights(n); next() }}
          onBack={back}
        />
      )}

      {/* Step: slot */}
      {step === 'slot' && activeResource && (
        <SlotPicker
          resourceId={activeResource.id}
          date={selectedDate}
          slotDuration={selectedService?.durationMinutes}
          onSelect={s => { setSelectedSlot(s); next() }}
          onBack={back}
        />
      )}

      {/* Step: guests */}
      {step === 'guests' && (
        <GuestCountStep
          max={selectedResource?.capacity ?? 20}
          label={business.type === 'HOTEL' ? 'Количество гостей' : 'Количество человек'}
          onSelect={c => { setGuestCount(c); next() }}
          onBack={back}
        />
      )}

      {/* Step: form */}
      {step === 'form' && currentSlot && activeResource && (
        <BookingForm
          resource={activeResource}
          service={selectedService}
          slot={currentSlot}
          guestCount={guestCount}
          nights={nights}
          onSuccess={b => { setBooking(b); next() }}
          onBack={back}
        />
      )}

      {/* Step: done */}
      {step === 'done' && booking && (
        <BookingConfirmation
          booking={booking}
          business={business}
          token={token}
          servicePrice={selectedService ? Number(selectedService.price) : null}
          nights={nights}
        />
      )}
    </div>
  )
}
