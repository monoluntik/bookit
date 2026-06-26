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
import DurationStep from './DurationStep'

type AnyStep = 'service' | 'resource' | 'guests' | 'date' | 'dateRange' | 'slot' | 'duration' | 'form' | 'done'

interface FlowDef {
  steps: AnyStep[]
  labels: string[]
}

function getFlow(type: string, hasServices: boolean): FlowDef {
  switch (type) {
    case 'HOTEL':
      return { steps: ['resource', 'dateRange', 'guests', 'form', 'done'], labels: ['Номер', 'Даты', 'Гости', 'Данные', 'Готово'] }
    case 'RESTAURANT':
      return { steps: ['guests', 'resource', 'date', 'slot', 'form', 'done'], labels: ['Гости', 'Стол', 'Дата', 'Время', 'Данные', 'Готово'] }
    case 'SALON':
      if (hasServices) return { steps: ['service', 'resource', 'date', 'slot', 'form', 'done'], labels: ['Услуга', 'Мастер', 'Дата', 'Время', 'Данные', 'Готово'] }
      return { steps: ['resource', 'date', 'slot', 'form', 'done'], labels: ['Мастер', 'Дата', 'Время', 'Данные', 'Готово'] }
    case 'MEDICAL':
      if (hasServices) return { steps: ['resource', 'service', 'date', 'slot', 'form', 'done'], labels: ['Врач', 'Приём', 'Дата', 'Время', 'Данные', 'Готово'] }
      return { steps: ['resource', 'date', 'slot', 'form', 'done'], labels: ['Врач', 'Дата', 'Время', 'Данные', 'Готово'] }
    case 'SPORT':
      return { steps: ['resource', 'date', 'duration', 'slot', 'form', 'done'], labels: ['Корт', 'Дата', 'Длит.', 'Время', 'Данные', 'Готово'] }
    case 'COWORKING':
      return { steps: ['resource', 'date', 'duration', 'slot', 'guests', 'form', 'done'], labels: ['Место', 'Дата', 'Длит.', 'Время', 'Гости', 'Данные', 'Готово'] }
    default:
      if (hasServices) return { steps: ['resource', 'service', 'date', 'slot', 'form', 'done'], labels: ['Выбор', 'Услуга', 'Дата', 'Время', 'Данные', 'Готово'] }
      return { steps: ['resource', 'date', 'slot', 'form', 'done'], labels: ['Выбор', 'Дата', 'Время', 'Данные', 'Готово'] }
  }
}

const SPORT_DURATIONS = [60, 90, 120]
const COWORKING_DURATIONS = [60, 120, 240, 480]

interface Props { business: any }

export default function BookingFlowAdaptive({ business }: Props) {
  const { token } = useAuth()
  const meta = getMeta(business.type)
  const [services, setServices] = useState<any[]>([])

  const [selectedResource, setSelectedResource] = useState<any>(null)
  const [selectedService, setSelectedService] = useState<any>(null)
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedSlot, setSelectedSlot] = useState<{ start: string; end: string } | null>(null)
  const [selectedDuration, setSelectedDuration] = useState<number | null>(null)
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

  const activeResource = selectedResource

  const hotelSlot = checkIn && checkOut ? {
    start: `${checkIn}T14:00:00`,
    end: `${checkOut}T12:00:00`,
  } : null

  const currentSlot = business.type === 'HOTEL' ? hotelSlot : selectedSlot

  const slotDuration = selectedDuration ?? selectedService?.durationMinutes

  return (
    <div className="bg-white rounded-2xl shadow-sm p-6">
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

      {step === 'guests' && (
        <GuestCountStep
          max={selectedResource?.capacity ?? 20}
          label={business.type === 'HOTEL' ? 'Количество гостей' : business.type === 'RESTAURANT' ? 'Сколько вас будет?' : 'Количество человек'}
          businessType={business.type}
          onSelect={c => { setGuestCount(c); next() }}
          onBack={back}
        />
      )}

      {step === 'resource' && (
        <ResourceSelector
          resources={business.resources}
          onSelect={r => { setSelectedResource(r); next() }}
          onBack={back}
          label={meta.resourceLabel}
          resourceIcon={meta.resourceIcon}
          businessType={business.type}
          minCapacity={business.type === 'RESTAURANT' ? guestCount : undefined}
        />
      )}

      {step === 'service' && (
        <ServiceSelector
          services={services}
          onSelect={s => { setSelectedService(s); next() }}
          onSkip={() => { setSelectedService(null); next() }}
          onBack={back}
          required={business.type !== 'MEDICAL'}
        />
      )}

      {step === 'date' && (
        <DatePicker onSelect={d => { setSelectedDate(d); next() }} onBack={back} />
      )}

      {step === 'dateRange' && (
        <HotelDateRange
          onSelect={(ci, co, n) => { setCheckIn(ci); setCheckOut(co); setNights(n); next() }}
          onBack={back}
        />
      )}

      {step === 'duration' && (
        <DurationStep
          options={business.type === 'COWORKING' ? COWORKING_DURATIONS : SPORT_DURATIONS}
          onSelect={d => { setSelectedDuration(d); next() }}
          onBack={back}
        />
      )}

      {step === 'slot' && activeResource && (
        <SlotPicker
          resourceId={activeResource.id}
          date={selectedDate}
          slotDuration={slotDuration}
          onSelect={s => { setSelectedSlot(s); next() }}
          onBack={back}
          onChangeDate={(d) => setSelectedDate(d)}
        />
      )}

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

      {step === 'done' && booking && (
        <BookingConfirmation
          booking={booking}
          business={business}
          token={token}
          servicePrice={selectedService ? Number(selectedService.price) : null}
          resourcePrice={selectedResource?.basePrice ? Number(selectedResource.basePrice) : null}
          nights={nights}
          guestCount={guestCount}
        />
      )}
    </div>
  )
}
