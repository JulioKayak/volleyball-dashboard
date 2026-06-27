import { useState } from 'react'
import { useStore } from '../store'
import type { Coach, Gender, Team } from '../types'
import { Plus, Pencil, Trash2, X, Check, Copy } from 'lucide-react'
import { nanoid } from '../utils/id'
import MultiSelect from '../components/MultiSelect'

const CATEGORIES = [
  'Escuelas', 'Benjamín', 'Alevín', 'Infantil', 'Cadete', 'Juvenil', 'Junior', 'Senior',
]

function empty(): Team {
  return { id: '', name: '', category: 'Infantil', gender: 'M', sessionsPerWeek: 3 }
}

const GENDER_STYLES: Record<Gender, { bg: string; border: string; text: string; badge: string }> = {
  M: { bg: 'bg-blue-950/40', border: 'border-blue-800/50', text: 'text-blue-200', badge: 'bg-blue-800/60 text-blue-200' },
  F: { bg: 'bg-rose-950/40', border: 'border-rose-800/50', text: 'text-rose-200', badge: 'bg-rose-800/60 text-rose-200' },
}

export default function TeamsPage() {
  const { teams, coaches, addTeam, updateTeam, deleteTeam, updateCoach } = useStore()
  const [form, setForm] = useState<Team | null>(null)
  const [formCoachIds, setFormCoachIds] = useState<string[]>([])
  const [isNew, setIsNew] = useState(false)
  const [filterGender, setFilterGender] = useState<Gender | 'all'>('all')

  function openNew() { setForm(empty()); setFormCoachIds([]); setIsNew(true) }
  function openEdit(t: Team) {
    setForm({ ...t })
    setFormCoachIds(coaches.filter(c => c.teamIds.includes(t.id)).map(c => c.id))
    setIsNew(false)
  }

  function save() {
    if (!form || !form.name.trim()) return
    const teamId = isNew ? nanoid() : form.id
    const savedTeam = { ...form, id: teamId }
    if (isNew) addTeam(savedTeam)
    else updateTeam(savedTeam)
    coaches.forEach(coach => {
      const shouldHave = formCoachIds.includes(coach.id)
      const hasNow = coach.teamIds.includes(teamId)
      if (shouldHave && !hasNow) updateCoach({ ...coach, teamIds: [...coach.teamIds, teamId] })
      else if (!shouldHave && hasNow) updateCoach({ ...coach, teamIds: coach.teamIds.filter(id => id !== teamId) })
    })
    setForm(null)
  }

  const coachOptions = coaches.map(c => ({ value: c.id, label: c.name }))
  const visibleTeams = filterGender === 'all' ? teams : teams.filter(t => t.gender === filterGender)

  const grouped = CATEGORIES.reduce<Record<string, Team[]>>((acc, cat) => {
    acc[cat] = visibleTeams.filter(t => t.category === cat)
    return acc
  }, {})

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-xl font-bold">Equipos</h2>
          <p className="text-sm text-gray-400 mt-0.5">{teams.length} equipos</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Gender filter */}
          <div className="flex bg-gray-900 border border-gray-800 rounded-lg overflow-hidden text-xs font-medium">
            {(['all', 'M', 'F'] as const).map(g => (
              <button
                key={g}
                onClick={() => setFilterGender(g)}
                className={`px-3 py-1.5 transition-colors ${
                  filterGender === g
                    ? g === 'M' ? 'bg-blue-700 text-white' : g === 'F' ? 'bg-rose-700 text-white' : 'bg-gray-700 text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {g === 'all' ? 'Todos' : g === 'M' ? 'Masculino' : 'Femenino'}
              </button>
            ))}
          </div>
          <button
            onClick={openNew}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <Plus size={15} /> Añadir
          </button>
        </div>
      </div>

      {teams.length === 0 && (
        <div className="border border-dashed border-gray-700 rounded-xl p-10 text-center text-gray-500">
          Sin equipos. Añade el primero.
        </div>
      )}

      <div className="space-y-4">
        {CATEGORIES.map(cat => {
          const catTeams = grouped[cat]
          if (!catTeams || catTeams.length === 0) return null
          const mTeams = catTeams.filter(t => (t.gender ?? 'M') === 'M')
          const fTeams = catTeams.filter(t => t.gender === 'F')
          return (
            <div key={cat}>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">{cat}</p>
              <div className="grid grid-cols-3 gap-x-3 gap-y-2">
                {/* Masculinos */}
                {mTeams.map(t => <TeamCard key={t.id} team={t} coaches={coaches} onEdit={openEdit} onDelete={deleteTeam} onDuplicate={() => addTeam({ ...t, id: nanoid(), name: `${t.name} (copia)` })} />)}
                {/* Femeninos */}
                {fTeams.map(t => <TeamCard key={t.id} team={t} coaches={coaches} onEdit={openEdit} onDelete={deleteTeam} onDuplicate={() => addTeam({ ...t, id: nanoid(), name: `${t.name} (copia)` })} />)}
              </div>
            </div>
          )
        })}
      </div>

      {form && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="font-bold text-lg mb-4">{isNew ? 'Nuevo equipo' : 'Editar equipo'}</h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-400 block mb-1">Nombre</label>
                <input
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  placeholder="Ej: Infantil M1"
                  autoFocus
                />
              </div>
              <div>
                <label className="text-sm text-gray-400 block mb-1">Categoría</label>
                <select
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
                  value={form.category}
                  onChange={e => setForm({ ...form, category: e.target.value })}
                >
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm text-gray-400 block mb-1">Género</label>
                <div className="flex gap-2">
                  {(['M', 'F'] as Gender[]).map(g => (
                    <button
                      key={g}
                      onClick={() => setForm({ ...form, gender: g })}
                      className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${
                        form.gender === g
                          ? g === 'M' ? 'bg-blue-700 border-blue-600 text-white' : 'bg-rose-700 border-rose-600 text-white'
                          : 'border-gray-700 text-gray-400 hover:border-gray-500'
                      }`}
                    >
                      {g === 'M' ? 'Masculino' : 'Femenino'}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-sm text-gray-400 block mb-1">Sesiones por semana</label>
                <input
                  type="number"
                  min={0}
                  max={14}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
                  value={form.sessionsPerWeek ?? 3}
                  onChange={e => {
                    const n = Math.max(0, Math.min(14, parseInt(e.target.value || '0', 10)))
                    setForm({ ...form, sessionsPerWeek: Number.isNaN(n) ? 0 : n })
                  }}
                />
              </div>
              {coaches.length > 0 && (
                <div>
                  <label className="text-sm text-gray-400 block mb-1">Entrenadores</label>
                  <MultiSelect
                    options={coachOptions}
                    selected={formCoachIds}
                    onChange={setFormCoachIds}
                    placeholder="Selecciona entrenadores..."
                  />
                </div>
              )}
            </div>
            <div className="flex justify-end gap-2 mt-6">
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

function TeamCard({ team, coaches, onEdit, onDelete, onDuplicate }: {
  team: Team
  coaches: Coach[]
  onEdit: (t: Team) => void
  onDelete: (id: string) => void
  onDuplicate: () => void
}) {
  const s = GENDER_STYLES[team.gender ?? 'M']
  const assignedCoaches = coaches.filter(c => c.teamIds.includes(team.id))
  return (
    <div className={`${s.bg} border ${s.border} rounded-lg px-3 py-2 flex items-center gap-2 group`}>
      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${s.badge} shrink-0`}>
        {team.gender ?? 'M'}
      </span>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium truncate ${s.text}`}>{team.name}</p>
        {assignedCoaches.length > 0 && (
          <p className="text-xs text-gray-500 truncate">{assignedCoaches.map(c => c.name).join(', ')}</p>
        )}
      </div>
      <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
        <button onClick={() => onEdit(team)} className="p-1 text-gray-500 hover:text-white" title="Editar"><Pencil size={12} /></button>
        <button onClick={onDuplicate} className="p-1 text-gray-500 hover:text-white" title="Duplicar"><Copy size={12} /></button>
        <button onClick={() => onDelete(team.id)} className="p-1 text-gray-500 hover:text-red-400" title="Eliminar"><Trash2 size={12} /></button>
      </div>
    </div>
  )
}
