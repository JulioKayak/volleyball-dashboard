import { useEffect, useRef, useState } from 'react'
import { ChevronDown, X } from 'lucide-react'

interface Option { value: string; label: string }

interface Props {
  options: Option[]
  selected: string[]
  onChange: (selected: string[]) => void
  placeholder?: string
}

export default function MultiSelect({ options, selected, onChange, placeholder = 'Selecciona...' }: Props) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  function toggle(value: string) {
    onChange(selected.includes(value) ? selected.filter(v => v !== value) : [...selected, value])
  }

  const selectedLabels = options.filter(o => selected.includes(o.value))

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-left flex items-center gap-2 focus:outline-none focus:border-indigo-500 min-h-[38px]"
      >
        <div className="flex-1 flex flex-wrap gap-1 min-w-0">
          {selectedLabels.length === 0 ? (
            <span className="text-gray-500">{placeholder}</span>
          ) : (
            selectedLabels.map(o => (
              <span
                key={o.value}
                className="inline-flex items-center gap-1 bg-indigo-600/30 border border-indigo-600/50 text-indigo-200 text-xs px-2 py-0.5 rounded-full"
              >
                {o.label}
                <button
                  type="button"
                  onClick={e => { e.stopPropagation(); toggle(o.value) }}
                  className="hover:text-white"
                >
                  <X size={10} />
                </button>
              </span>
            ))
          )}
        </div>
        <ChevronDown size={14} className={`shrink-0 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full bg-gray-800 border border-gray-700 rounded-lg shadow-xl max-h-52 overflow-y-auto">
          {options.length === 0 && (
            <p className="px-3 py-2 text-xs text-gray-500">Sin opciones disponibles</p>
          )}
          {options.map(o => (
            <button
              key={o.value}
              type="button"
              onClick={() => toggle(o.value)}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-sm hover:bg-gray-700 text-left"
            >
              <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${selected.includes(o.value) ? 'bg-indigo-600 border-indigo-500' : 'border-gray-600'}`}>
                {selected.includes(o.value) && (
                  <svg viewBox="0 0 10 8" className="w-2.5 h-2.5 text-white fill-current">
                    <path d="M1 4l3 3 5-6" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </div>
              <span className={selected.includes(o.value) ? 'text-white' : 'text-gray-300'}>{o.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
