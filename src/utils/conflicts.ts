import type { Coach, Day, Pavilion, Session, TimeSlot } from '../types'

export function timesOverlap(a: TimeSlot, b: TimeSlot): boolean {
  return a.start < b.end && b.start < a.end
}

export function sessionOverlaps(a: Session, b: Session): boolean {
  if (a.day !== b.day) return false
  return timesOverlap(
    { start: a.startTime, end: a.endTime },
    { start: b.startTime, end: b.endTime }
  )
}

export function isCoachAvailable(coach: Coach, day: Day, start: string, end: string): boolean {
  const dayAvail = coach.availability[day]
  if (!dayAvail.available || dayAvail.slots.length === 0) return false
  const needed = { start, end }
  return dayAvail.slots.some(slot => slot.start <= needed.start && slot.end >= needed.end)
}

export function isPavilionAvailable(pavilion: Pavilion, day: Day, start: string, end: string): boolean {
  if (!pavilion.availability) return true // no availability configured = always open
  const dayAvail = pavilion.availability[day]
  if (!dayAvail || !dayAvail.available || dayAvail.slots.length === 0) return false
  const needed = { start, end }
  return dayAvail.slots.some(slot => slot.start <= needed.start && slot.end >= needed.end)
}

export function courtIsOccupied(
  sessions: Session[],
  pavilionId: string,
  courtNumber: number,
  day: Day,
  start: string,
  end: string,
  excludeId?: string
): boolean {
  return sessions.some(
    s =>
      s.id !== excludeId &&
      s.pavilionId === pavilionId &&
      s.courtNumber === courtNumber &&
      s.day === day &&
      timesOverlap({ start, end }, { start: s.startTime, end: s.endTime })
  )
}

export interface ConflictReport {
  coachDoubleBooked: boolean
  courtOccupied: boolean
  coachUnavailable: boolean
  pavilionUnavailable: boolean
  coachPlayerConflict: boolean
}

export function checkConflicts(
  session: Omit<Session, 'id'>,
  sessions: Session[],
  coach: Coach,
  pavilion: Pavilion | undefined,
  excludeId?: string
): ConflictReport {
  const coachSessions = sessions.filter(s => s.id !== excludeId && s.coachId === coach.id)
  const coachAtSameTime = coachSessions.filter(s =>
    s.day === session.day &&
    timesOverlap(
      { start: session.startTime, end: session.endTime },
      { start: s.startTime, end: s.endTime }
    )
  )

  // Coach playing as player: check if their player-team has a session at same time
  const playerConflict = coach.playerTeamId
    ? sessions.some(
        s =>
          s.id !== excludeId &&
          s.teamId === coach.playerTeamId &&
          s.day === session.day &&
          timesOverlap(
            { start: session.startTime, end: session.endTime },
            { start: s.startTime, end: s.endTime }
          )
      )
    : false

  const pavilionUnavailable = pavilion
    ? !isPavilionAvailable(pavilion, session.day, session.startTime, session.endTime)
    : false

  return {
    coachDoubleBooked: coachAtSameTime.length >= (coach.canDoubleCoach ? 2 : 1),
    courtOccupied: courtIsOccupied(
      sessions,
      session.pavilionId,
      session.courtNumber,
      session.day,
      session.startTime,
      session.endTime,
      excludeId
    ),
    coachUnavailable: !isCoachAvailable(coach, session.day, session.startTime, session.endTime),
    pavilionUnavailable,
    coachPlayerConflict: playerConflict,
  }
}
