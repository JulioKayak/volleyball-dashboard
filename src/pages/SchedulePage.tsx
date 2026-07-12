import { useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useStore } from '../store'
import type { Day, Pavilion, Session } from '../types'
import { WORK_DAYS, DAY_LABELS } from '../types'

const DAY_SLUGS: Record<Day, string> = {
  mon: 'monday', tue: 'tuesday', wed: 'wednesday', thu: 'thursday',
  fri: 'friday', sat: 'saturday', sun: 'sunday',
}
const SLUG_TO_DAY: Record<string, Day> = Object.fromEntries(
  Object.entries(DAY_SLUGS).map(([d, s]) => [s, d as Day])
) as Record<string, Day>
import { Plus, Pencil, Trash2, Copy, AlertTriangle, ZoomOut, ZoomIn, ChevronRight, GripVertical, X, ChevronDown, ChevronUp } from 'lucide-react'
import SessionWizard from '../components/SessionWizard'
import Tooltip from '../components/Tooltip'
import { checkConflicts } from '../utils/conflicts'
import { nanoid } from '../utils/id'
import { useEscape } from '../utils/useEscape'

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
  const navigate = useNavigate()
  const { day: daySlug } = useParams()
  const selectedDay: Day = (daySlug && SLUG_TO_DAY[daySlug]) || 'mon'
  const setSelectedDay = (d: Day) => navigate(`/schedule/${DAY_SLUGS[d]}`)
  const [wizardOpen, setWizardOpen] = useState(false)
  const [editSession, setEditSession] = useState<Session | null>(null)
  const [zoomIdx, setZoomIdx] = useState(1)

  const pxPerHour = ZOOM_LEVELS[zoomIdx]

  const dragSessionId = useRef<string | null>(null)
  const dragNewTeamId = useRef<string | null>(null)
  const [dragOverTarget, setDragOverTarget] = useState<{ pavilionId: string; court: number } | null>(null)
  const [remainingOpen, setRemainingOpen] = useState(false)
  const [collapsedPavs, setCollapsedPavs] = useState<Set<string>>(new Set())
  const [errorPopup, setErrorPopup] = useState<{ session: Session; messages: string[] } | null>(null)

  useEscape(() => setErrorPopup(null))

  function pavKey(pavId: string, day: Day) { return `${pavId}-${day}` }
  function togglePavCollapse(pavId: string) {
    const key = pavKey(pavId, selectedDay)
    setCollapsedPavs(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const daySessions = sessions.filter(s => s.day === selectedDay)

  const remainingByTeam = useMemo(() => {
    const counts = new Map<string, number>()
    for (const s of sessions) counts.set(s.teamId, (counts.get(s.teamId) ?? 0) + 1)
    return teams.map(t => {
      const target = t.sessionsPerWeek ?? 3
      const placed = counts.get(t.id) ?? 0
      return { team: t, remaining: Math.max(0, target - placed), target }
    })
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
            <Tooltip label="Vista más compacta">
              <button
                onClick={() => setZoomIdx(i => Math.max(0, i - 1))}
                disabled={zoomIdx === 0}
                className="p-2 text-gray-400 hover:text-white disabled:opacity-30 hover:bg-gray-800 transition-colors"
              >
                <ZoomOut size={15} />
              </button>
            </Tooltip>
            <span className="text-xs text-gray-400 px-2 min-w-[64px] text-center">{ZOOM_LABELS[zoomIdx]}</span>
            <Tooltip label="Vista más grande">
              <button
                onClick={() => setZoomIdx(i => Math.min(ZOOM_LEVELS.length - 1, i + 1))}
                disabled={zoomIdx === ZOOM_LEVELS.length - 1}
                className="p-2 text-gray-400 hover:text-white disabled:opacity-30 hover:bg-gray-800 transition-colors"
              >
                <ZoomIn size={15} />
              </button>
            </Tooltip>
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
                Crea equipos con "sesiones por semana" para usar esta función.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {remainingByTeam.map(({ team, remaining, target }) => {
                  const coach = coaches.find(c => c.teamIds.includes(team.id))
                  const noCoach = !coach
                  const allPlaced = remaining === 0
                  const disabled = noCoach || allPlaced
                  const tip = noCoach
                    ? 'Asigna un entrenador al equipo para poder arrastrar'
                    : allPlaced
                      ? 'Todas las sesiones ya están asignadas'
                      : null
                  const card = (
                    <div
                      draggable={!disabled}
                      onDragStart={e => {
                        if (disabled) { e.preventDefault(); return }
                        dragNewTeamId.current = team.id
                        e.dataTransfer.effectAllowed = 'copy'
                      }}
                      onDragEnd={() => { dragNewTeamId.current = null; setDragOverTarget(null) }}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm select-none transition-colors ${
                        disabled
                          ? 'border-gray-800 bg-gray-900 text-gray-600 cursor-not-allowed opacity-60'
                          : 'border-gray-700 bg-gray-800/60 hover:border-indigo-500 hover:bg-indigo-900/20 text-gray-100 cursor-grab active:cursor-grabbing'
                      }`}
                    >
                      <GripVertical size={12} className={`shrink-0 ${disabled ? 'text-gray-700' : 'text-gray-500'}`} />
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0 ${TEAM_GENDER_BADGE[team.gender ?? 'M']} ${disabled ? 'opacity-60' : ''}`}>
                        {team.gender ?? 'M'}
                      </span>
                      <span className="font-medium truncate max-w-[160px]">{team.name}</span>
                      <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded shrink-0 tabular-nums ${
                        allPlaced
                          ? 'bg-emerald-900/40 text-emerald-400'
                          : remaining === target
                            ? 'bg-amber-900/40 text-amber-300'
                            : 'bg-indigo-900/40 text-indigo-300'
                      }`}>
                        {remaining}/{target}
                      </span>
                    </div>
                  )
                  return tip
                    ? <Tooltip key={team.id} label={tip}>{card}</Tooltip>
                    : <span key={team.id}>{card}</span>
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

      {pavilions.length > 0 && (() => {
        const visiblePavilions = pavilions.filter(pav => pav.availability?.[selectedDay]?.available !== false)
        if (visiblePavilions.length === 0) {
          return (
            <div className="border border-dashed border-gray-700 rounded-xl p-10 text-center text-gray-500">
              Ningún pabellón está disponible {DAY_LABELS[selectedDay].toLowerCase()}.
            </div>
          )
        }
        return (
        <div className={zoomIdx === 0 ? 'flex gap-3 items-start' : 'space-y-5'}>
          {visiblePavilions.map(pav => {
            const pavSessions = daySessions.filter(s => s.pavilionId === pav.id)
            const { start: hourStart, end: hourEnd } = getPavilionHourRange(pav, selectedDay)
            const totalHours = hourEnd - hourStart
            const gridHeight = totalHours * pxPerHour + HEADER_PX + 8
            const hours = Array.from({ length: totalHours + 1 }, (_, i) => hourStart + i)
            const collapsed = collapsedPavs.has(pavKey(pav.id, selectedDay))

            function sessionTop(s: Session) {
              return timeToFraction(s.startTime, hourStart, totalHours) * totalHours * pxPerHour + HEADER_PX
            }
            function sessionHeight(s: Session) {
              return (timeToFraction(s.endTime, hourStart, totalHours) - timeToFraction(s.startTime, hourStart, totalHours)) * totalHours * pxPerHour
            }

            return (
              <div key={pav.id} className={`bg-gray-900 border border-gray-800 rounded-xl overflow-hidden${zoomIdx === 0 ? ' flex-1 min-w-0' : ''}`}>
                <div
                  className="px-4 py-3 flex items-center gap-3 border-b border-gray-800 cursor-pointer hover:bg-gray-800/40 transition-colors select-none"
                  style={{ borderLeftWidth: 4, borderLeftColor: pav.color }}
                  onClick={() => togglePavCollapse(pav.id)}
                  title={collapsed ? 'Expandir pabellón' : 'Colapsar pabellón'}
                >
                  {collapsed ? <ChevronDown size={14} className="text-gray-400" /> : <ChevronUp size={14} className="text-gray-400" />}
                  <span className="font-semibold">{pav.name}</span>
                  <span className="text-xs text-gray-400">{pav.maxCourts} {pav.maxCourts === 1 ? 'pista' : 'pistas'}</span>
                  <span className="text-xs text-gray-500">{hourStart}:00 – {hourEnd}:00</span>
                  <span className="text-xs text-gray-500 ml-auto">{pavSessions.length} sesiones</span>
                  {!collapsed && <span className="text-xs text-gray-600 italic">Arrastra para mover</span>}
                </div>

                {!collapsed && (
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
                                  <div className="flex gap-1 shrink-0 items-start">
                                    {hasConflict && (
                                      <Tooltip label="Ver error">
                                        <button
                                          onClick={e => { e.stopPropagation(); setErrorPopup({ session: s, messages: conflictMsgs }) }}
                                          className="p-1 text-red-300 hover:text-red-100 hover:bg-red-900/50 rounded"
                                        >
                                          <AlertTriangle size={16} strokeWidth={2.5} />
                                        </button>
                                      </Tooltip>
                                    )}
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                      <Tooltip label="Duplicar">
                                        <button
                                          onClick={e => { e.stopPropagation(); addSession({ ...s, id: nanoid() }) }}
                                          className="p-1 text-indigo-200 hover:text-white hover:bg-indigo-800/60 rounded"
                                        >
                                          <Copy size={15} />
                                        </button>
                                      </Tooltip>
                                      <Tooltip label="Editar">
                                        <button
                                          onClick={e => { e.stopPropagation(); setEditSession(s); setWizardOpen(true) }}
                                          className="p-1 text-indigo-200 hover:text-white hover:bg-indigo-800/60 rounded"
                                        >
                                          <Pencil size={15} />
                                        </button>
                                      </Tooltip>
                                      <Tooltip label="Eliminar">
                                        <button
                                          onClick={e => { e.stopPropagation(); deleteSession(s.id) }}
                                          className="p-1 text-indigo-200 hover:text-red-300 hover:bg-red-900/40 rounded"
                                        >
                                          <Trash2 size={15} />
                                        </button>
                                      </Tooltip>
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
                )}
              </div>
            )
          })}
        </div>
        )
      })()}

      {wizardOpen && (
        <SessionWizard
          initial={editSession ?? undefined}
          editId={editSession?.id}
          onClose={() => { setWizardOpen(false); setEditSession(null) }}
        />
      )}

      {errorPopup && (() => {
        const team = getTeam(errorPopup.session.teamId)
        const coach = getCoach(errorPopup.session.coachId)
        const pav = pavilions.find(p => p.id === errorPopup.session.pavilionId)
        return (
          <div
            className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
            onClick={e => { if (e.target === e.currentTarget) setErrorPopup(null) }}
          >
            <div className="bg-gray-900 border border-red-800/60 rounded-2xl w-full max-w-md shadow-2xl">
              <div className="p-5 border-b border-red-900/40 flex items-center justify-between">
                <h3 className="font-bold text-lg flex items-center gap-2 text-red-300">
                  <AlertTriangle size={18} /> Conflicto en la sesión
                </h3>
                <button onClick={() => setErrorPopup(null)} className="text-gray-400 hover:text-white"><X size={18} /></button>
              </div>
              <div className="p-5 space-y-3">
                <div className="text-sm text-gray-300 space-y-0.5">
                  <p><span className="text-gray-500">Equipo:</span> {team?.name ?? '—'}</p>
                  <p><span className="text-gray-500">Entrenador:</span> {coach?.name ?? '—'}</p>
                  <p><span className="text-gray-500">Pabellón:</span> {pav?.name ?? '—'} · Pista {errorPopup.session.courtNumber}</p>
                  <p><span className="text-gray-500">Horario:</span> {DAY_LABELS[errorPopup.session.day]} {errorPopup.session.startTime}–{errorPopup.session.endTime}</p>
                </div>
                <div className="bg-red-950/40 border border-red-800/60 rounded-lg p-3 space-y-1.5">
                  {errorPopup.messages.map((m, i) => (
                    <p key={i} className="text-sm text-red-200 flex items-start gap-2">
                      <AlertTriangle size={14} className="text-red-400 mt-0.5 shrink-0" /> {m}
                    </p>
                  ))}
                </div>
              </div>
              <div className="p-4 border-t border-gray-800 flex justify-end gap-2">
                <button onClick={() => setErrorPopup(null)} className="px-4 py-2 text-sm bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg">
                  Cerrar
                </button>
                <button
                  onClick={() => { setEditSession(errorPopup.session); setWizardOpen(true); setErrorPopup(null) }}
                  className="px-4 py-2 text-sm bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg"
                >
                  Editar sesión
                </button>
              </div>
            </div>
          </div>
        )
      })()}
    </div>
  )
}
