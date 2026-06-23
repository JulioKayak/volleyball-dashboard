import { useState } from 'react'
import { useStore } from '../store'
import type { Pavilion } from '../types'
import { defaultAvailability } from '../types'
import { Plus, Pencil, Trash2, X, Check, Copy } from 'lucide-react'
import { nanoid } from '../utils/id'
import AvailabilityEditor from '../components/AvailabilityEditor'

const COLORS = [
  '#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4',
]

const empty = (): Pavilion => ({
  id: '',
  name: '',
  maxCourts: 2,
  color: COLORS[0],
  availability: defaultAvailability(),
})

export default function PavilionsPage() {
  const { pavilions, addPavilion, updatePavilion, deletePavilion } = useStore()
  const [form, setForm] = useState<Pavilion | null>(null)
  const [isNew, setIsNew] = useState(false)

  function openNew() {
    setForm({ ...empty(), color: COLORS[pavilions.length % COLORS.length] })
    setIsNew(true)
  }

  function openEdit(p: Pavilion) {
    const copy: Pavilion = JSON.parse(JSON.stringify(p))
    if (!copy.availability) copy.availability = defaultAvailability()
    setForm(copy)
    setIsNew(false)
  }

  function save() {
    if (!form || !form.name.trim()) return
    if (isNew) addPavilion({ ...form, id: nanoid() })
    else updatePavilion(form)
    setForm(null)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold">Pabellones</h2>
          <p className="text-sm text-gray-400 mt-0.5">Configura pabellones, pistas y horario de disponibilidad</p>
        </div>
        <button
          onClick={openNew}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <Plus size={16} /> Añadir pabellón
        </button>
      </div>

      {pavilions.length === 0 && !form && (
        <div className="border border-dashed border-gray-700 rounded-xl p-10 text-center text-gray-500">
          Sin pabellones. Añade el primero.
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        {pavilions.map(p => {
          const availDays = (['mon','tue','wed','thu','fri','sat','sun'] as const)
            .filter(d => p.availability?.[d]?.available)
          return (
            <div key={p.id} className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex items-start gap-4">
              <div className="w-3 h-10 rounded-full shrink-0 mt-1" style={{ backgroundColor: p.color }} />
              <div className="flex-1">
                <p className="font-semibold">{p.name}</p>
                <p className="text-sm text-gray-400">{p.maxCourts} {p.maxCourts === 1 ? 'pista' : 'pistas'}</p>
                {availDays.length > 0 && (
                  <div className="flex gap-1 mt-1.5 flex-wrap">
                    {availDays.map(d => {
                      const slots = p.availability[d].slots
                      return (
                        <span key={d} className="text-xs bg-gray-800 px-2 py-0.5 rounded text-gray-300">
                          {['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'][['mon','tue','wed','thu','fri','sat','sun'].indexOf(d)]}
                          {slots[0] && ` ${slots[0].start}–${slots[0].end}`}
                        </span>
                      )
                    })}
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <button onClick={() => openEdit(p)} className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg" title="Editar">
                  <Pencil size={15} />
                </button>
                <button
                  onClick={() => addPavilion({ ...p, id: nanoid(), name: `${p.name} (copia)` })}
                  className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg"
                  title="Duplicar"
                >
                  <Copy size={15} />
                </button>
                <button onClick={() => deletePavilion(p.id)} className="p-2 text-gray-400 hover:text-red-400 hover:bg-gray-800 rounded-lg" title="Eliminar">
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {form && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-md shadow-2xl max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-gray-800 flex items-center justify-between">
              <h3 className="font-bold text-lg">{isNew ? 'Nuevo pabellón' : 'Editar pabellón'}</h3>
              <button onClick={() => setForm(null)} className="text-gray-400 hover:text-white"><X size={18} /></button>
            </div>
            <div className="overflow-y-auto flex-1 p-6 space-y-4">
              <div>
                <label className="text-sm text-gray-400 block mb-1">Nombre</label>
                <input
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  placeholder="Ej: Pabellón Municipal"
                  autoFocus
                />
              </div>
              <div>
                <label className="text-sm text-gray-400 block mb-1">Número máximo de pistas</label>
                <select
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
                  value={form.maxCourts}
                  onChange={e => setForm({ ...form, maxCourts: Number(e.target.value) })}
                >
                  <option value={1}>1 pista</option>
                  <option value={2}>2 pistas</option>
                  <option value={3}>3 pistas</option>
                </select>
              </div>
              <div>
                <label className="text-sm text-gray-400 block mb-2">Color</label>
                <div className="flex gap-2">
                  {COLORS.map(c => (
                    <button
                      key={c}
                      onClick={() => setForm({ ...form, color: c })}
                      className={`w-7 h-7 rounded-full transition-transform ${form.color === c ? 'scale-125 ring-2 ring-white' : ''}`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>
              <div>
                <label className="text-sm text-gray-400 block mb-2">Horario de disponibilidad</label>
                <AvailabilityEditor
                  value={form.availability}
                  onChange={availability => setForm({ ...form, availability })}
                />
              </div>
            </div>
            <div className="p-6 border-t border-gray-800 flex justify-end gap-2">
              <button onClick={() => setForm(null)} className="flex items-center gap-1 px-4 py-2 text-sm text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 rounded-lg">
                <X size={14} /> Cancelar
              </button>
              <button
                onClick={save}
                disabled={!form.name.trim()}
                className="flex items-center gap-1 px-4 py-2 text-sm bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white rounded-lg"
              >
                <Check size={14} /> Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
