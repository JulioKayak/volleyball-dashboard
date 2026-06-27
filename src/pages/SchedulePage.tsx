import { useMemo, useRef, useState } from 'react'
import { useStore } from '../store'
import type { Day, Pavilion, Session } from '../types'
import { WORK_DAYS, DAY_LABELS } from '../types'
import { Plus, Pencil, Trash2, Copy, AlertTriangle, ZoomOut, ZoomIn, ChevronRight, GripVertical } from 'lucide-react'
import SessionWizard from '../components/SessionWizard'
import { checkConflicts } from '../utils/conflicts'
import { nanoid } from '../utils/id'

const DEFAULT_NEW_SESSION_MINUTES = 90
const TEAM_GENDER_BADGE: Record<'M' | 'F', string> = {
  M: 'bg-blue-800/60 text-blue-200',
  F: 'bg-rose-800/60 text-rose-200',
}

const HOUR_START_DEFAULT = 8
const HOUR_END_DEFAULT = 23
const HEADER_PX = 24

const ZOOM_LEVELS = [28, 48, 68] // compact, normal, large
const ZOOM_LABELS = ['Compacto', 'Normal', 'Grande']

function getPavilionHourRange(pav: Pavilion, day: Day): { start: number; end: number } {
  if (!pav.availability) return { start: HOUR_START_DEFAULT, end: HOUR_END_DEFAULT }
  const dayAvail = pav.availability[day]
  if (!dayAvail?.available || !dayAvail.slots.length) return { start: HOUR_START_DEFAULT, end: HOUR_END_DEFAULT }
  let minStart = 24, maxEnd = 0
  for (const slot of dayAvail.slots) {
    const [sh] = slot.start.split(':').map(Number)
    const [eh, em] = slot.end.split(':').map(Number)
    minStart = Math.min(minStart, sh)
    maxEnd = Math.max(maxEnd, em > 0 ? eh + 1 : eh)
  }
  return { start: minStart, end: Math.min(maxEnd, 24) }
}

function timeToFraction(t: string, hourStart: number, totalHours: number): number {
  const [h, m] = t.split(':').map(Number)
  return (h + m / 60 - hourStart) / totalHours
}

export default function SchedulePage() {
  const { pavilions, teams, coaches, sessions, addSession, deleteSession, updateSession } = useStore()
  const [wizardOpen, setWizardOpen] = useState(false)
  const [editSession, setEditSession] = useState<Session | null>(null)
  const [selectedDay, setSelectedDay] = useState<Day>('mon')
  const [zoomIdx, setZoomIdx] = useState(1)

  const pxPerHour = ZOOM_LEVELS[zoomIdx]

  const dragSessionId = useRef<string | null>(null)
  const dragNewTeamId = useRef<string | null>(null)
  const [dragOverTarget, setDragOverTarget] = useState<{ pavilionId: string; court: number } | null>(null)
  const [remainingOpen, setRemainingOpen] = useState(false)

  const daySessions = sessions.filter(s => s.day === selectedDay)

  const remainingByTeam = useMemo(() => {
    const counts = new Map<string, number>()
    for (const s of sessions) counts.set(s.teamId, (counts.get(s.teamId) ?? 0) + 1)
    return teams
      .map(t => {
        const target = t.sessionsPerWeek ?? 3
        const placed = counts.get(t.id) ?? 0
        return { team: t, remaining: Math.max(0, target - placed) }
      })
      .filter(r => r.remaining > 0)
  }, [teams, sessions])

  const totalRemaining = remainingByTeam.reduce((sum, r) => sum + r.remaining, 0)

  function getTeam(id: string) { return teams.find(t => t.id === id) }
  function getCoach(id: string) { return coaches.find(c => c.id === id) }

  function getSessionConflictMessages(s: Session): string[] {
    const coach = getCoach(s.coachId)
    const pavilion = pavilions.find(p => p.id === s.pavilionId)
    if (!coach) return []
    const r = checkConflicts(
      { day: s.day, startTime: s.startTime, endTime: s.endTime, pavilionId: s.pavilionId, courtNumber: s.courtNumber, teamId: s.teamId, coachId: s.coachId },
      sessions, coach, pavilion, s.id
    )
    const msgs: string[] = []
    if (r.coachUnavailable) msgs.push('Entrenador no disponible en este horario')
    if (r.coachDoubleBooked) msgs.push('Entrenador con demasiados equipos a la vez')
    if (r.coachPlayerConflict) msgs.push('Entrenador tiene partido como jugador')
    if (r.courtOccupied) msgs.push('Pista ocupada por otro equipo')
    if (r.pavilionUnavailable) msgs.push('Pabellón no disponible en este horario')
    return msgs
  }

  function minsToTime(m: number) {
    return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`
  }

  function handleDrop(e: React.DragEvent, pavilionId: string, court: number, containerEl: HTMLDivElement, hourStart: number, totalHours: number) {
    e.preventDefault()
    setDragOverTarget(null)

    const rect = containerEl.getBoundingClientRect()
    const relativeY = e.clientY - rect.top
    const rawHour = (relativeY - HEADER_PX) / pxPerHour + hourStart
    const newStartHour = Math.max(hourStart, Math.min(hourStart + totalHours - 1, Math.round(rawHour)))
    const dayEndMins = (hourStart + totalHours) * 60

    const newTeamId = dragNewTeamId.current
    if (newTeamId) {
      const team = teams.find(t => t.id === newTeamId)
      const coach = team ? coaches.find(c => c.teamIds.includes(team.id)) : undefined
      dragNewTeamId.current = null
      if (!team || !coach) return
      const startMins = newStartHour * 60
      const endMins = Math.min(startMins + DEFAULT_NEW_SESSION_MINUTES, dayEndMins)
      addSession({
        id: nanoid(),
        pavilionId,
        courtNumber: court,
        teamId: team.id,
        coachId: coach.id,
        day: selectedDay,
        startTime: minsToTime(startMins),
        endTime: minsToTime(endMins),
      })
      return
    }

    const id = dragSessionId.current
    if (!id) return
    const session = sessions.find(s => s.id === id)
    if (!session) return

    const [startH, startM] = session.startTime.split(':').map(Number)
    const [endH, endM] = session.endTime.split(':').map(Number)
    const durationMins = (endH * 60 + endM) - (startH * 60 + startM)
    const newStartMins = newStartHour * 60
    const newEndMins = newStartMins + durationMins

    updateSession({
      ...session,
      pavilionId,
      courtNumber: court,
      startTime: minsToTime(newStartMins),
      endTime: minsToTime(Math.min(newEndMins, dayEndMins)),
    })
    dragSessionId.current = null
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-xl font-bold">Horario semanal</h2>
        <div className="flex items-center gap-2">
          {/* Zoom control */}
          <div className="flex items-center bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
            <button
              onClick={() => setZoomIdx(i => Math.max(0, i - 1))}
              disabled={zoomIdx === 0}
              className="p-2 text-gray-400 hover:text-white disabled:opacity-30 hover:bg-gray-800 transition-colors"
              title="Vista más compacta"
            >
              <ZoomOut size={15} />
            </button>
            <span className="text-xs text-gray-400 px-2 min-w-[64px] text-center">{ZOOM_LABELS[zoomIdx]}</span>
            <button
              onClick={() => setZoomIdx(i => Math.min(ZOOM_LEVELS.length - 1, i + 1))}
              disabled={zoomIdx === ZOOM_LEVELS.length - 1}
              className="p-2 text-gray-400 hover:text-white disabled:opacity-30 hover:bg-gray-800 transition-colors"
              title="Vista más grande"
            >
              <ZoomIn size={15} />
            </button>
          </div>
          <button
            onClick={() => { setEditSession(null); setWizardOpen(true) }}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <Plus size={16} /> Nueva sesión
          </button>
        </div>
      </div>

      {/* Day tabs */}
      <div className="flex gap-1 mb-5 bg-gray-900 p-1 rounded-xl w-fit">
        {WORK_DAYS.map(d => {
          const count = sessions.filter(s => s.day === d).length
          return (
            <button
              key={d}
              onClick={() => setSelectedDay(d)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                selectedDay === d ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              {DAY_LABELS[d].slice(0, 3)}
              {count > 0 && (
                <span className={`text-xs rounded-full w-5 h-5 flex items-center justify-center ${selectedDay === d ? 'bg-indigo-500' : 'bg-gray-700'}`}>
                  {count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Remaining sessions (collapsible) */}
      <div className="mb-5 bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <button
          onClick={() => setRemainingOpen(o => !o)}
          className="w-full flex items-center justify-between gap-2 px-4 py-3 hover:bg-gray-800/40 transition-colors text-left"
        >
          <div className="flex items-center gap-2">
            <ChevronRight
              size={16}
              className={`text-gray-400 transition-transform ${remainingOpen ? 'rotate-90' : ''}`}
            />
            <span className="font-semibold text-sm">Sesiones restantes</span>
            {totalRemaining > 0 && (
              <span className="text-[10px] font-semibold bg-amber-900/40 text-amber-300 px-2 py-0.5 rounded-full">
                {totalRemaining}
              </span>
            )}
          </div>
          <span className="text-xs text-gray-500 hidden sm:block">
            {totalRemaining > 0 ? 'Arrastra una tarjeta al horario' : 'Todo asignado'}
          </span>
        </button>
        {remainingOpen && (
          <div className="border-t border-gray-800 p-3">
            {remainingByTeam.length === 0 ? (
              <p className="text-sm text-gray-500 px-1 py-2">
                No hay sesiones pendientes esta semana. Ajusta las "sesiones por semana" en cada equipo para usar esta función.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {remainingByTeam.flatMap(({ team, remaining }) => {
                  const coach = coaches.find(c => c.teamIds.includes(team.id))
                  const disabled = !coach
                  return Array.from({ length: remaining }, (_, i) => (
                    <div
                      key={`${team.id}-${i}`}
                      draggable={!disabled}
                      onDragStart={e => {
                        if (disabled) { e.preventDefault(); return }
                        dragNewTeamId.current = team.id
                        e.dataTransfer.effectAllowed = 'copy'
                      }}
                      onDragEnd={() => { dragNewTeamId.current = null; setDragOverTarget(null) }}
                      title={disabled ? 'Asigna un entrenador al equipo para poder arrastrar' : `Arrastra para crear una sesión de ${team.name}`}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm select-none transition-colors ${
                        disabled
                          ? 'border-gray-800 bg-gray-900 text-gray-600 cursor-not-allowed opacity-60'
                          : 'border-gray-700 bg-gray-800/60 hover:border-indigo-500 hover:bg-indigo-900/20 text-gray-100 cursor-grab active:cursor-grabbing'
                      }`}
                    >
                      <GripVertical size={12} className="text-gray-500 shrink-0" />
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0 ${TEAM_GENDER_BADGE[team.gender ?? 'M']}`}>
                        {team.gender ?? 'M'}
                      </span>
                      <span className="font-medium truncate max-w-[160px]">{team.name}</span>
                      <span className="text-[10px] text-gray-500 shrink-0">{team.category}</span>
                    </div>
                  ))
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {pavilions.length === 0 && (
        <div className="border border-dashed border-gray-700 rounded-xl p-10 text-center text-gray-500">
          Configura pabellones primero para ver el horario.
        </div>
      )}

      {pavilions.length > 0 && (
        <div className={zoomIdx === 0 ? 'flex gap-3 items-start' : 'space-y-5'}>
          {pavilions.map(pav => {
            const pavSessions = daySessions.filter(s => s.pavilionId === pav.id)
            const { start: hourStart, end: hourEnd } = getPavilionHourRange(pav, selectedDay)
            const totalHours = hourEnd - hourStart
            const gridHeight = totalHours * pxPerHour + HEADER_PX + 8
            const hours = Array.from({ length: totalHours + 1 }, (_, i) => hourStart + i)

            function sessionTop(s: Session) {
              return timeToFraction(s.startTime, hourStart, totalHours) * totalHours * pxPerHour + HEADER_PX
            }
            function sessionHeight(s: Session) {
              return (timeToFraction(s.endTime, hourStart, totalHours) - timeToFraction(s.startTime, hourStart, totalHours)) * totalHours * pxPerHour
            }

            return (
              <div key={pav.id} className={`bg-gray-900 border border-gray-800 rounded-xl overflow-hidden${zoomIdx === 0 ? ' flex-1 min-w-0' : ''}`}>
                <div
                  className="px-4 py-3 flex items-center gap-3 border-b border-gray-800"
                  style={{ borderLeftWidth: 4, borderLeftColor: pav.color }}
                >
                  <span className="font-semibold">{pav.name}</span>
                  <span className="text-xs text-gray-400">{pav.maxCourts} {pav.maxCourts === 1 ? 'pista' : 'pistas'}</span>
                  <span className="text-xs text-gray-500">{hourStart}:00 – {hourEnd}:00</span>
                  <span className="text-xs text-gray-500 ml-auto">{pavSessions.length} sesiones</span>
                  <span className="text-xs text-gray-600 italic">Arrastra para mover</span>
                </div>

                <div>
                  <div className="flex">
                    {/* Hour axis */}
                    <div className="w-14 shrink-0 border-r border-gray-800 relative bg-gray-900/80" style={{ height: gridHeight }}>
                      <div style={{ height: HEADER_PX }} />
                      {hours.map(h => (
                        <div
                          key={h}
                          className="absolute left-0 right-0 text-right pr-2 text-xs text-gray-600 leading-none"
                          style={{ top: (h - hourStart) * pxPerHour + HEADER_PX - 6 }}
                        >
                          {`${String(h).padStart(2, '0')}:00`}
                        </div>
                      ))}
                    </div>

                    {/* Courts */}
                    {Array.from({ length: pav.maxCourts }, (_, i) => i + 1).map(court => {
                      const courtSessions = pavSessions.filter(s => s.courtNumber === court)
                      const isDropTarget = dragOverTarget?.pavilionId === pav.id && dragOverTarget.court === court
                      let dropRef: HTMLDivElement | null = null
                      return (
                        <div
                          key={court}
                          ref={el => { dropRef = el }}
                          className={`flex-1 border-r border-gray-800 last:border-r-0 relative transition-colors ${isDropTarget ? 'bg-indigo-950/30' : ''}`}
                          style={{ height: gridHeight }}
                          onDragOver={e => { e.preventDefault(); setDragOverTarget({ pavilionId: pav.id, court }) }}
                          onDragLeave={() => setDragOverTarget(null)}
                          onDrop={e => dropRef && handleDrop(e, pav.id, court, dropRef, hourStart, totalHours)}
                        >
                          <div className="text-xs text-gray-600 text-center py-1.5 border-b border-gray-800 bg-gray-900/50" style={{ height: HEADER_PX }}>
                            Pista {court}
                          </div>
                          {hours.map(h => (
                            <div
                              key={h}
                              className="absolute left-0 right-0 border-t border-gray-800/50"
                              style={{ top: (h - hourStart) * pxPerHour + HEADER_PX }}
                            />
                          ))}
                          {courtSessions.map(s => {
                            const top = sessionTop(s)
                            const height = sessionHeight(s)
                            const team = getTeam(s.teamId)
                            const coach = getCoach(s.coachId)
                            const conflictMsgs = getSessionConflictMessages(s)
                            const hasConflict = conflictMsgs.length > 0
                            const compact = zoomIdx === 0

                            return (
                              <div
                                key={s.id}
                                draggable
                                onDragStart={e => { dragSessionId.current = s.id; e.dataTransfer.effectAllowed = 'move' }}
                                onDragEnd={() => { dragSessionId.current = null; setDragOverTarget(null) }}
                                className={`absolute inset-x-1 rounded-lg px-2 overflow-hidden group border cursor-grab active:cursor-grabbing select-none ${
                                  hasConflict
                                    ? 'border-red-600 bg-red-950/70'
                                    : 'border-transparent bg-indigo-700/80 hover:bg-indigo-600/80'
                                } ${compact ? 'py-0.5' : 'py-1'}`}
                                style={{ top, height }}
                              >
                                <div className="flex items-start justify-between gap-1">
                                  <div className="flex-1 min-w-0">
                                    <p className={`font-semibold text-white truncate leading-tight ${compact ? 'text-[10px]' : 'text-xs'}`}>
                                      {team?.name ?? '—'}
                                    </p>
                                    {!compact && (
                                      <>
                                        <p className="text-xs text-indigo-200 truncate leading-tight">{coach?.name ?? '—'}</p>
                                        <p className="text-xs text-indigo-300 leading-tight">{s.startTime}–{s.endTime}</p>
                                      </>
                                    )}
                                    {compact && (
                                      <p className="text-[9px] text-indigo-300 leading-tight">{s.startTime}–{s.endTime}</p>
                                    )}
                                  </div>
                                  <div className="flex gap-0.5 shrink-0 items-start">
                                    {hasConflict && (
                                      <div className="relative group/alert">
                                        <AlertTriangle size={11} className="text-red-400 mt-0.5" />
                                        <div className="absolute bottom-full right-0 mb-1.5 w-52 bg-gray-950 border border-red-800/60 rounded-lg p-2 shadow-xl hidden group-hover/alert:block z-20 pointer-events-none">
                                          {conflictMsgs.map((m, i) => (
                                            <p key={i} className="text-[10px] text-red-300 leading-snug">{m}</p>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                    <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                      <button
                                        onClick={e => { e.stopPropagation(); addSession({ ...s, id: nanoid() }) }}
                                        className="p-0.5 text-indigo-200 hover:text-white"
                                        title="Duplicar"
                                      >
                                        <Copy size={10} />
                                      </button>
                                      <button
                                        onClick={e => { e.stopPropagation(); setEditSession(s); setWizardOpen(true) }}
                                        className="p-0.5 text-indigo-200 hover:text-white"
                                        title="Editar"
                                      >
                                        <Pencil size={10} />
                                      </button>
                                      <button
                                        onClick={e => { e.stopPropagation(); deleteSession(s.id) }}
                                        className="p-0.5 text-indigo-200 hover:text-red-300"
                                        title="Eliminar"
                                      >
                                        <Trash2 size={10} />
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {wizardOpen && (
        <SessionWizard
          initial={editSession ?? undefined}
          editId={editSession?.id}
          onClose={() => { setWizardOpen(false); setEditSession(null) }}
        />
      )}
    </div>
  )
}
