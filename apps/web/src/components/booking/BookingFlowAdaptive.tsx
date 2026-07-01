'use client'

import { useState, useEffect, useMemo } from 'react'
import { useTranslations } from 'next-intl'
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

function getFlow(type: string, hasServices: boolean, s: ReturnType<typeof useTranslations>): FlowDef {
  switch (type) {
    case 'HOTEL':
      return { steps: ['resource', 'dateRange', 'guests', 'form', 'done'], labels: [s('room'), s('dates'), s('guests'), s('details'), s('done')] }
    case 'RESTAURANT':
      return { steps: ['guests', 'resource', 'date', 'slot', 'form', 'done'], labels: [s('guests'), s('table'), s('date'), s('time'), s('details'), s('done')] }
    case 'SALON':
      if (hasServices) return { steps: ['service', 'resource', 'date', 'slot', 'form', 'done'], labels: [s('service'), s('master'), s('date'), s('time'), s('details'), s('done')] }
      return { steps: ['resource', 'date', 'slot', 'form', 'done'], labels: [s('master'), s('date'), s('time'), s('details'), s('done')] }
    case 'MEDICAL':
      if (hasServices) return { steps: ['resource', 'service', 'date', 'slot', 'form', 'done'], labels: [s('doctor'), s('appointment'), s('date'), s('time'), s('details'), s('done')] }
      return { steps: ['resource', 'date', 'slot', 'form', 'done'], labels: [s('doctor'), s('date'), s('time'), s('details'), s('done')] }
    case 'SPORT':
      return { steps: ['resource', 'date', 'duration', 'slot', 'form', 'done'], labels: [s('court'), s('date'), s('durationShort'), s('time'), s('details'), s('done')] }
    case 'COWORKING':
      return { steps: ['resource', 'date', 'duration', 'slot', 'guests', 'form', 'done'], labels: [s('place'), s('date'), s('durationShort'), s('time'), s('guests'), s('details'), s('done')] }
    default:
      if (hasServices) return { steps: ['resource', 'service', 'date', 'slot', 'form', 'done'], labels: [s('choice'), s('service'), s('date'), s('time'), s('details'), s('done')] }
      return { steps: ['resource', 'date', 'slot', 'form', 'done'], labels: [s('choice'), s('date'), s('time'), s('details'), s('done')] }
  }
}

const SPORT_DURATIONS = [60, 90, 120]
const COWORKING_DURATIONS = [60, 120, 240, 480]

function buildFreeStartDurations(slotGranularity: number): number[] {
  return [1, 2, 3, 4, 6, 8].map(x => x * slotGranularity).filter(d => d <= 480)
}

function insertDurationStep(base: FlowDef, durationLabel: string): FlowDef {
  const slotPos = base.steps.indexOf('slot')
  if (slotPos === -1) return base
  const steps = [...base.steps] as AnyStep[]
  const labels = [...base.labels]
  steps.splice(slotPos, 0, 'duration')
  labels.splice(slotPos, 0, durationLabel)
  return { steps, labels }
}

interface Props { business: any }

export default function BookingFlowAdaptive({ business }: Props) {
  const t = useTranslations('Booking')
  const s = useTranslations('Booking.flow.steps')
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
  const [extraDurationStep, setExtraDurationStep] = useState(false)

  useEffect(() => {
    api.getServices(business.id).then(setServices).catch(() => setServices([]))
  }, [business.id])

  const baseFlow = useMemo(() => getFlow(business.type, services.length > 0, s), [business.type, services.length, s])

  const flow = useMemo(() => {
    if (!extraDurationStep) return baseFlow
    return insertDurationStep(baseFlow, s('durationShort'))
  }, [baseFlow, extraDurationStep, s])

  const [stepIdx, setStepIdx] = useState(0)
  const step = flow.steps[stepIdx]
  const next = () => setStepIdx(i => i + 1)
  const back = () => setStepIdx(i => i - 1)

  const handleSelectResource = (r: any) => {
    setSelectedResource(r)
    setSelectedService(null)
    setSelectedDuration(null)
    setSelectedSlot(null)

    const needsDuration =
      r.bookingMode === 'FREE_START' &&
      !baseFlow.steps.slice(0, baseFlow.steps.indexOf('slot')).some(
        (st: AnyStep) => st === 'duration' || st === 'service'
      )

    setExtraDurationStep(needsDuration)

    if (needsDuration) {
      // After state batch: flow will have extra 'duration' step
      // resource position in new flow = same as in base flow; advance past it
      const resourcePos = baseFlow.steps.indexOf('resource')
      setStepIdx(resourcePos + 1)
    } else {
      setStepIdx(i => i + 1)
    }
  }

  const durationOptions = useMemo(() => {
    if (selectedResource?.bookingMode === 'FREE_START') {
      const gran = selectedResource.schedules?.[0]?.slotDurationMinutes ?? 60
      return buildFreeStartDurations(gran)
    }
    return business.type === 'COWORKING' ? COWORKING_DURATIONS : SPORT_DURATIONS
  }, [selectedResource, business.type])

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
          label={business.type === 'HOTEL' ? t('flow.guestCountLabel.hotel') : business.type === 'RESTAURANT' ? t('flow.guestCountLabel.restaurant') : t('flow.guestCountLabel.default')}
          businessType={business.type}
          onSelect={c => { setGuestCount(c); next() }}
          onBack={back}
        />
      )}

      {step === 'resource' && (
        <ResourceSelector
          resources={business.resources}
          onSelect={handleSelectResource}
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
          options={durationOptions}
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
          servicePrice={selectedService ? Number(selectedService.price) : null}
          resourcePrice={selectedResource?.basePrice ? Number(selectedResource.basePrice) : null}
          depositAmount={
            selectedService?.depositAmount ? Number(selectedService.depositAmount)
              : selectedResource?.depositAmount ? Number(selectedResource.depositAmount)
              : null
          }
          nights={nights}
          guestCount={guestCount}
        />
      )}
    </div>
  )
}
