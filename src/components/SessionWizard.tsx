import { useState } from 'react'
import { useStore } from '../store'
import type { Day, Session } from '../types'
import { WORK_DAYS, DAY_LABELS } from '../types'
import { checkConflicts } from '../utils/conflicts'
import { nanoid } from '../utils/id'
import { useEscape } from '../utils/useEscape'
import { X, AlertTriangle, CheckCircle2 } from 'lucide-react'

interface Props {
  initial?: Partial<Session>
  onClose: () => void
  editId?: string
}

export default function SessionWizard({ initial, onClose, editId }: Props) {
  useEscape(onClose)
  const { pavilions, teams, coaches, sessions, addSession, updateSession } = useStore()

  const [day, setDay] = useState<Day>(initial?.day ?? 'mon')
  const [startTime, setStartTime] = useState(initial?.startTime ?? '17:00')
  const [endTime, setEndTime] = useState(initial?.endTime ?? '19:00')

  function handleStartChange(val: string) {
    setStartTime(val)
    if (val >= endTime) {
      const [h, m] = val.split(':').map(Number)
      const endH = h + 1 < 24 ? h + 1 : h
      setEndTime(`${String(endH).padStart(2, '0')}:${String(m).padStart(2, '0')}`)
    }
  }
  const [pavilionId, setPavilionId] = useState(initial?.pavilionId ?? '')
  const [courtNumber, setCourtNumber] = useState(initial?.courtNumber ?? 1)
  const [coachId, setCoachId] = useState(initial?.coachId ?? '')
  const [teamId, setTeamId] = useState(initial?.teamId ?? '')

  const pavilion = pavilions.find(p => p.id === pavilionId)
  const coach = coaches.find(c => c.id === coachId)
  const availableTeams = coach && coach.teamIds.length > 0
    ? teams.filter(t => coach.teamIds.includes(t.id))
    : teams

  const conflicts = coach && pavilionId && teamId
    ? checkConflicts(
        { day, startTime, endTime, pavilionId, courtNumber, teamId, coachId },
        sessions,
        coach,
        pavilion,
        editId
      )
    : null

  const hasConflict = conflicts
    ? conflicts.coachDoubleBooked || conflicts.courtOccupied || conflicts.coachUnavailable || conflicts.pavilionUnavailable || conflicts.coachPlayerConflict
    : false

  const canSave = pavilionId && teamId && coachId && startTime < endTime

  function save() {
    if (!canSave) return
    const session: Session = {
      id: editId ?? nanoid(),
      day, startTime, endTime, pavilionId, courtNumber, teamId, coachId,
    }
    if (editId) updateSession(session)
    else addSession(session)
    onClose()
  }

  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-lg shadow-2xl max-h-[92vh] flex flex-col">
        <div className="p-5 border-b border-gray-800 flex items-center justify-between shrink-0">
          <h3 className="font-bold text-lg">{editId ? 'Editar sesión' : 'Nueva sesión de entrenamiento'}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white"><X size={18} /></button>
        </div>

        <div className="p-5 space-y-4 overflow-y-auto flex-1">
          {/* Day */}
          <div>
            <label className="text-xs text-gray-400 block mb-2">Día</label>
            <div className="flex flex-wrap gap-1.5">
              {WORK_DAYS.map(d => (
                <button
                  key={d}
                  onClick={() => setDay(d)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    day === d ? 'bg-indigo-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'
                  }`}
                >
                  {DAY_LABELS[d].slice(0, 3)}
                </button>
              ))}
            </div>
          </div>

          {/* Time */}
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-xs text-gray-400 block mb-1">Inicio</label>
              <input
                type="time"
                value={startTime}
                onChange={e => handleStartChange(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div className="flex-1">
              <label className="text-xs text-gray-400 block mb-1">Fin</label>
              <input
                type="time"
                value={endTime}
                onChange={e => setEndTime(e.target.value)}
                min={startTime}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Pavilion */}
          <div>
            <label className="text-xs text-gray-400 block mb-1">Pabellón</label>
            {pavilions.length === 0 ? (
              <p className="text-xs text-amber-400">Primero crea pabellones.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {pavilions.map(p => (
                  <button
                    key={p.id}
                    onClick={() => {
                      setPavilionId(p.id); setCourtNumber(1)
                      const slot = p.availability?.[day]?.slots?.[0]
                      if (slot) {
                        setStartTime(slot.start)
                        const [h, m] = slot.start.split(':').map(Number)
                        const endH = h + 1 < 24 ? h + 1 : h
                        setEndTime(`${String(endH).padStart(2, '0')}:${String(m).padStart(2, '0')}`)
                      }
                    }}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm border transition-colors ${
                      pavilionId === p.id ? 'border-indigo-500 bg-indigo-600/20 text-white' : 'border-gray-700 text-gray-400 hover:border-gray-500'
                    }`}
                  >
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.color }} />
                    {p.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Court */}
          {pavilion && (
            <div>
              <label className="text-xs text-gray-400 block mb-1">Pista</label>
              <div className="flex gap-2">
                {Array.from({ length: pavilion.maxCourts }, (_, i) => i + 1).map(n => (
                  <button
                    key={n}
                    onClick={() => setCourtNumber(n)}
                    className={`w-10 h-10 rounded-lg text-sm font-semibold border transition-colors ${
                      courtNumber === n ? 'bg-indigo-600 border-indigo-500 text-white' : 'border-gray-700 text-gray-400 hover:border-gray-500'
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Coach */}
          <div>
            <label className="text-xs text-gray-400 block mb-1">Entrenador</label>
            {coaches.length === 0 ? (
              <p className="text-xs text-amber-400">Primero crea entrenadores.</p>
            ) : (
              <div className="space-y-1">
                {coaches.map(c => {
                  const report = checkConflicts(
                    { day, startTime, endTime, pavilionId: pavilionId || 'x', courtNumber, teamId: teamId || 'x', coachId: c.id },
                    sessions,
                    c,
                    pavilions.find(p => p.id === pavilionId),
                    editId
                  )
                  const hasIssue = report.coachDoubleBooked || report.coachUnavailable || report.coachPlayerConflict
                  return (
                    <button
                      key={c.id}
                      onClick={() => {
                        setCoachId(c.id)
                        if (teamId && c.teamIds.length > 0 && !c.teamIds.includes(teamId)) setTeamId('')
                      }}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm border transition-colors ${
                        coachId === c.id ? 'border-indigo-500 bg-indigo-600/20 text-white' : 'border-gray-700 text-gray-400 hover:border-gray-500'
                      } ${hasIssue && coachId !== c.id ? 'opacity-50' : ''}`}
                    >
                      <span className="flex-1 text-left">{c.name}</span>
                      {c.canDoubleCoach && (
                        <span className="text-xs bg-amber-900/50 text-amber-300 px-1.5 rounded">Doble</span>
                      )}
                      {report.coachPlayerConflict && (
                        <span className="text-xs text-orange-400 flex items-center gap-1">
                          <AlertTriangle size={10} /> Jugando
                        </span>
                      )}
                      {!report.coachPlayerConflict && report.coachUnavailable && (
                        <span className="text-xs text-red-400 flex items-center gap-1">
                          <AlertTriangle size={10} /> No disponible
                        </span>
                      )}
                      {!report.coachPlayerConflict && !report.coachUnavailable && report.coachDoubleBooked && (
                        <span className="text-xs text-red-400 flex items-center gap-1">
                          <AlertTriangle size={10} /> Saturado
                        </span>
                      )}
                      {!report.coachPlayerConflict && !report.coachUnavailable && !report.coachDoubleBooked && (
                        <span className="text-xs text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 size={10} /> Libre
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {/* Team */}
          <div>
            <label className="text-xs text-gray-400 block mb-1">
              Equipo
              {coach && coach.teamIds.length > 0 && (
                <span className="ml-1.5 text-gray-500">(equipos de {coach.name})</span>
              )}
            </label>
            {teams.length === 0 ? (
              <p className="text-xs text-amber-400">Primero crea equipos.</p>
            ) : (
              <select
                value={teamId}
                onChange={e => setTeamId(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
              >
                <option value="">— Selecciona equipo —</option>
                {availableTeams.map(t => <option key={t.id} value={t.id}>{t.name} ({t.category})</option>)}
              </select>
            )}
          </div>

          {/* Conflict summary */}
          {conflicts && hasConflict && (
            <div className="bg-red-950/40 border border-red-800 rounded-lg p-3 space-y-1">
              {conflicts.pavilionUnavailable && (
                <p className="text-xs text-red-300 flex items-center gap-1.5"><AlertTriangle size={12} /> El pabellón no está disponible en este horario</p>
              )}
              {conflicts.coachUnavailable && (
                <p className="text-xs text-red-300 flex items-center gap-1.5"><AlertTriangle size={12} /> El entrenador no está disponible en este horario</p>
              )}
              {conflicts.coachPlayerConflict && (
                <p className="text-xs text-orange-300 flex items-center gap-1.5"><AlertTriangle size={12} /> El entrenador tiene entrenamiento como jugador en este horario</p>
              )}
              {conflicts.coachDoubleBooked && (
                <p className="text-xs text-red-300 flex items-center gap-1.5"><AlertTriangle size={12} /> El entrenador ya tiene demasiados equipos en este horario</p>
              )}
              {conflicts.courtOccupied && (
                <p className="text-xs text-red-300 flex items-center gap-1.5"><AlertTriangle size={12} /> La pista ya está ocupada en este horario</p>
              )}
            </div>
          )}
        </div>

        <div className="p-5 border-t border-gray-800 flex justify-end gap-2 shrink-0">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 rounded-lg">
            Cancelar
          </button>
          <button
            onClick={save}
            disabled={!canSave}
            className={`px-4 py-2 text-sm disabled:opacity-40 text-white rounded-lg font-medium ${hasConflict ? 'bg-red-700 hover:bg-red-600' : 'bg-indigo-600 hover:bg-indigo-500'}`}
          >
            {editId ? 'Guardar cambios' : 'Crear sesión'}
          </button>
        </div>
      </div>
    </div>
  )
}
