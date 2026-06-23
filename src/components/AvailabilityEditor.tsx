import { WORK_DAYS, ALL_DAYS, DAY_LABELS } from '../types'
import type { Day, TimeSlot, WeeklyAvailability } from '../types'
import { Plus, X } from 'lucide-react'

interface Props {
  value: WeeklyAvailability
  onChange: (v: WeeklyAvailability) => void
}

function TimeSlotRow({ slot, onChange, onRemove }: { slot: TimeSlot; onChange: (s: TimeSlot) => void; onRemove: () => void }) {
  return (
    <div className="flex items-center gap-2">
      <input
        type="time"
        value={slot.start}
        onChange={e => onChange({ ...slot, start: e.target.value })}
        className="bg-gray-700 border border-gray-600 rounded px-2 py-1 text-xs focus:outline-none focus:border-indigo-500"
      />
      <span className="text-gray-500 text-xs">–</span>
      <input
        type="time"
        value={slot.end}
        onChange={e => onChange({ ...slot, end: e.target.value })}
        className="bg-gray-700 border border-gray-600 rounded px-2 py-1 text-xs focus:outline-none focus:border-indigo-500"
      />
      <button onClick={onRemove} className="text-gray-500 hover:text-red-400">
        <X size={12} />
      </button>
    </div>
  )
}

export default function AvailabilityEditor({ value: rawValue, onChange }: Props) {
  const value: WeeklyAvailability = rawValue ?? (() => {
    const r = {} as WeeklyAvailability
    for (const d of ALL_DAYS) r[d] = { available: false, slots: [] }
    return r
  })()
  function toggleDay(day: Day) {
    const dayAvail = value[day]
    onChange({
      ...value,
      [day]: {
        available: !dayAvail.available,
        slots: !dayAvail.available && dayAvail.slots.length === 0
          ? [{ start: '09:00', end: '22:00' }]
          : dayAvail.slots,
      },
    })
  }

  function addSlot(day: Day) {
    const slots = [...value[day].slots, { start: '09:00', end: '22:00' }]
    onChange({ ...value, [day]: { ...value[day], slots } })
  }

  function updateSlot(day: Day, idx: number, slot: TimeSlot) {
    const slots = value[day].slots.map((s, i) => i === idx ? slot : s)
    onChange({ ...value, [day]: { ...value[day], slots } })
  }

  function removeSlot(day: Day, idx: number) {
    const slots = value[day].slots.filter((_, i) => i !== idx)
    onChange({ ...value, [day]: { available: slots.length > 0, slots } })
  }

  return (
    <div className="space-y-2">
      {WORK_DAYS.map(day => {
        const dayAvail = value[day]
        return (
          <div key={day} className="bg-gray-800/50 rounded-lg p-3">
            <div className="flex items-center gap-3 mb-2">
              <input
                type="checkbox"
                id={`avail-${day}`}
                checked={dayAvail.available}
                onChange={() => toggleDay(day)}
                className="w-4 h-4 accent-indigo-500"
              />
              <label htmlFor={`avail-${day}`} className="text-sm font-medium">{DAY_LABELS[day]}</label>
            </div>
            {dayAvail.available && (
              <div className="ml-7 space-y-2">
                {dayAvail.slots.map((slot, idx) => (
                  <TimeSlotRow
                    key={idx}
                    slot={slot}
                    onChange={s => updateSlot(day, idx, s)}
                    onRemove={() => removeSlot(day, idx)}
                  />
                ))}
                <button
                  onClick={() => addSlot(day)}
                  className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                >
                  <Plus size={12} /> Añadir franja
                </button>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
