import { useState } from 'react'
import { useStore } from '../store'
import type { Coach, Team } from '../types'
import { WORK_DAYS, DAY_LABELS, defaultAvailability } from '../types'
import { Plus, Pencil, Trash2, X, Check, Volleyball, Eye } from 'lucide-react'
import { nanoid } from '../utils/id'
import { useEscape } from '../utils/useEscape'
import AvailabilityEditor from '../components/AvailabilityEditor'
import MultiSelect from '../components/MultiSelect'

function emptyCoach(): Coach {
  return { id: '', name: '', teamIds: [], canDoubleCoach: false, availability: defaultAvailability(), playerTeamId: undefined }
}

function dayLabel(day: typeof WORK_DAYS[number]) { return DAY_LABELS[day].slice(0, 3) }

export default function CoachesPage() {
  const { coaches, teams, addCoach, updateCoach, deleteCoach } = useStore()
  const [form, setForm] = useState<Coach | null>(null)
  const [isNew, setIsNew] = useState(false)
  const [detailCoach, setDetailCoach] = useState<Coach | null>(null)

  useEscape(() => { setForm(null); setDetailCoach(null) })

  function openNew() { setForm(emptyCoach()); setIsNew(true) }
  function openEdit(c: Coach) { setForm(JSON.parse(JSON.stringify(c))); setIsNew(false) }

  function save() {
    if (!form || !form.name.trim()) return
    if (isNew) addCoach({ ...form, id: nanoid() })
    else updateCoach(form)
    setForm(null)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold">Entrenadores</h2>
          <p className="text-sm text-gray-400 mt-0.5">{coaches.length} entrenadores</p>
        </div>
        <button
          onClick={openNew}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <Plus size={16} /> Añadir entrenador
        </button>
      </div>

      {coaches.length === 0 && !form && (
        <div className="border border-dashed border-gray-700 rounded-xl p-10 text-center text-gray-500">
          Sin entrenadores. Añade el primero.
        </div>
      )}

      <div className="grid grid-cols-2 gap-2">
        {coaches.map(c => {
          const myTeams = teams.filter(t => c.teamIds.includes(t.id))
          const playerTeam = teams.find(t => t.id === c.playerTeamId)
          const availDays = WORK_DAYS.filter(d => c.availability[d]?.available)

          return (
            <div key={c.id} className="bg-gray-900 border border-gray-800 rounded-xl p-3 flex items-start gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold text-sm">{c.name}</p>
                  {c.canDoubleCoach && (
                    <span className="text-[10px] bg-amber-900/60 text-amber-300 px-1.5 py-0.5 rounded-full">Doble</span>
                  )}
                  {playerTeam && (
                    <span className="text-[10px] bg-emerald-900/60 text-emerald-300 px-1.5 py-0.5 rounded-full flex items-center gap-1">
                      <Volleyball size={9} /> {playerTeam.name}
                    </span>
                  )}
                </div>
                {myTeams.length > 0 && (
                  <p className="text-xs text-gray-400 mt-0.5 truncate">{myTeams.map(t => t.name).join(' · ')}</p>
                )}
                {/* Day + time pills */}
                {availDays.length > 0 && (
                  <div className="flex gap-1 mt-1.5 flex-wrap">
                    {availDays.map(d => {
                      const slots = c.availability[d].slots
                      const range = slots[0] ? `${slots[0].start}–${slots[0].end}` : ''
                      return (
                        <span key={d} className="text-[10px] bg-gray-800 px-1.5 py-0.5 rounded text-gray-300 leading-tight">
                          {dayLabel(d)}{range ? ` ${range}` : ''}
                        </span>
                      )
                    })}
                  </div>
                )}
              </div>
              <div className="flex gap-2 shrink-0">
                <button onClick={() => setDetailCoach(c)} className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg" title="Ver detalle">
                  <Eye size={15} />
                </button>
                <button onClick={() => openEdit(c)} className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg" title="Editar">
                  <Pencil size={15} />
                </button>
                <button onClick={() => deleteCoach(c.id)} className="p-2 text-gray-400 hover:text-red-400 hover:bg-gray-800 rounded-lg" title="Eliminar">
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {/* Detail modal */}
      {detailCoach && (
        <DetailModal coach={detailCoach} teams={teams} onClose={() => setDetailCoach(null)} />
      )}

      {/* Edit / create modal */}
      {form && (
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
          onClick={e => { if (e.target === e.currentTarget) setForm(null) }}
        >
          <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-2xl shadow-2xl max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-gray-800 flex items-center justify-between">
              <h3 className="font-bold text-lg">{isNew ? 'Nuevo entrenador' : 'Editar entrenador'}</h3>
              <button onClick={() => setForm(null)} className="text-gray-400 hover:text-white"><X size={18} /></button>
            </div>

            <div className="overflow-y-auto flex-1 p-6 space-y-5">
              <div>
                <label className="text-sm text-gray-400 block mb-1">Nombre</label>
                <input
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  placeholder="Nombre del entrenador"
                  autoFocus
                />
              </div>

              <div className="flex items-center gap-3">
                <input type="checkbox" id="doubleCoach" checked={form.canDoubleCoach}
                  onChange={e => setForm({ ...form, canDoubleCoach: e.target.checked })}
                  className="w-4 h-4 accent-indigo-500" />
                <label htmlFor="doubleCoach" className="text-sm text-gray-300">Puede entrenar 2 equipos a la vez</label>
              </div>

              {/* Player section */}
              <div className="bg-gray-800/40 rounded-xl p-4 space-y-3 border border-gray-700/50">
                <div className="flex items-center gap-3">
                  <input type="checkbox" id="isPlayer" checked={!!form.playerTeamId}
                    onChange={e => setForm({ ...form, playerTeamId: e.target.checked ? (teams[0]?.id ?? '') : undefined })}
                    className="w-4 h-4 accent-emerald-500" />
                  <label htmlFor="isPlayer" className="text-sm text-gray-300 font-medium flex items-center gap-1.5">
                    <Volleyball size={14} className="text-emerald-400" /> También es jugador/a
                  </label>
                </div>
                {form.playerTeamId !== undefined && teams.length > 0 && (
                  <div>
                    <label className="text-xs text-gray-400 block mb-1">Equipo en el que juega</label>
                    <select
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
                      value={form.playerTeamId}
                      onChange={e => setForm({ ...form, playerTeamId: e.target.value })}
                    >
                      {teams.map(t => <option key={t.id} value={t.id}>{t.name} ({t.category})</option>)}
                    </select>
                  </div>
                )}
              </div>

              {teams.length > 0 && (
                <div>
                  <label className="text-sm text-gray-400 block mb-1">Equipos que entrena</label>
                  <MultiSelect
                    options={teams.map(t => ({ value: t.id, label: `${t.name} (${t.category})` }))}
                    selected={form.teamIds}
                    onChange={teamIds => setForm({ ...form, teamIds })}
                    placeholder="Selecciona equipos..."
                  />
                </div>
              )}

              <div>
                <label className="text-sm text-gray-400 block mb-2">Disponibilidad semanal</label>
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
              <button onClick={save} disabled={!form.name.trim()} className="flex items-center gap-1 px-4 py-2 text-sm bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white rounded-lg">
                <Check size={14} /> Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function DetailModal({ coach, teams, onClose }: { coach: Coach; teams: Team[]; onClose: () => void }) {
  const myTeams = teams.filter(t => coach.teamIds.includes(t.id))
  const playerTeam = teams.find(t => t.id === coach.playerTeamId)
  const availDays = WORK_DAYS.filter(d => coach.availability[d]?.available)

  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-md shadow-2xl">
        <div className="p-5 border-b border-gray-800 flex items-center justify-between">
          <h3 className="font-bold text-lg">{coach.name}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white"><X size={18} /></button>
        </div>
        <div className="p-5 space-y-4">
          {/* Tags */}
          <div className="flex flex-wrap gap-2">
            {coach.canDoubleCoach && (
              <span className="text-xs bg-amber-900/60 text-amber-300 px-2.5 py-1 rounded-full">Puede entrenar doble</span>
            )}
            {playerTeam && (
              <span className="text-xs bg-emerald-900/60 text-emerald-300 px-2.5 py-1 rounded-full flex items-center gap-1">
                <Volleyball size={11} /> Juega en {playerTeam.name}
              </span>
            )}
            {!coach.canDoubleCoach && !playerTeam && (
              <span className="text-xs text-gray-500">Sin características especiales</span>
            )}
          </div>

          {/* Teams */}
          {myTeams.length > 0 && (
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Equipos que entrena</p>
              <div className="flex flex-wrap gap-1.5">
                {myTeams.map(t => (
                  <span key={t.id} className="text-xs bg-gray-800 px-2.5 py-1 rounded-lg text-gray-200">{t.name}</span>
                ))}
              </div>
            </div>
          )}

          {/* Availability */}
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Disponibilidad semanal</p>
            {availDays.length === 0 ? (
              <p className="text-sm text-gray-500">Sin disponibilidad configurada</p>
            ) : (
              <div className="space-y-1.5">
                {WORK_DAYS.map(d => {
                  const dayAvail = coach.availability[d]
                  if (!dayAvail?.available) return (
                    <div key={d} className="flex items-center gap-3 py-1">
                      <span className="text-xs w-16 text-gray-600">{DAY_LABELS[d]}</span>
                      <span className="text-xs text-gray-600">No disponible</span>
                    </div>
                  )
                  return (
                    <div key={d} className="flex items-center gap-3 bg-gray-800/50 rounded-lg px-3 py-1.5">
                      <span className="text-xs font-medium w-20 text-gray-300">{DAY_LABELS[d]}</span>
                      <div className="flex gap-2 flex-wrap">
                        {dayAvail.slots.map((s, i) => (
                          <span key={i} className="text-xs text-indigo-300 font-mono">{s.start} – {s.end}</span>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
        <div className="p-5 border-t border-gray-800 flex justify-end">
          <button onClick={onClose} className="px-4 py-2 text-sm bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg">
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}
