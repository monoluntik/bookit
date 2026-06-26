'use client'

import { useState } from 'react'

interface Props {
  max?: number
  label?: string
  onSelect: (count: number) => void
  onBack: () => void
}

export default function GuestCountStep({ max = 20, label = 'Количество гостей', onSelect, onBack }: Props) {
  const [count, setCount] = useState(1)

  return (
    <div>
      <h3 className="font-semibold text-gray-900 mb-1">{label}</h3>
      <p className="text-sm text-gray-400 mb-6">Выберите количество</p>

      <div className="flex items-center justify-center gap-6 py-4">
        <button onClick={() => setCount(c => Math.max(1, c - 1))}
          className="w-12 h-12 rounded-full bg-gray-100 text-xl font-bold hover:bg-gray-200 flex items-center justify-center">
          −
        </button>
        <div className="text-4xl font-bold text-gray-900 w-16 text-center">{count}</div>
        <button onClick={() => setCount(c => Math.min(max, c + 1))}
          className="w-12 h-12 rounded-full bg-gray-100 text-xl font-bold hover:bg-gray-200 flex items-center justify-center">
          +
        </button>
      </div>

      <div className="flex gap-3 mt-6">
        <button onClick={onBack} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50">
          ← Назад
        </button>
        <button onClick={() => onSelect(count)}
          className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700">
          Далее →
        </button>
      </div>
    </div>
  )
}
