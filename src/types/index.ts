export type Day = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun'
export type Gender = 'M' | 'F'

export const DAY_LABELS: Record<Day, string> = {
  mon: 'Lunes',
  tue: 'Martes',
  wed: 'Miércoles',
  thu: 'Jueves',
  fri: 'Viernes',
  sat: 'Sábado',
  sun: 'Domingo',
}

export const ALL_DAYS: Day[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']
export const WORK_DAYS: Day[] = ['mon', 'tue', 'wed', 'thu', 'fri']

export interface TimeSlot {
  start: string
  end: string
}

export interface DayAvailability {
  available: boolean
  slots: TimeSlot[]
}

export type WeeklyAvailability = Record<Day, DayAvailability>

export interface Pavilion {
  id: string
  name: string
  maxCourts: number
  color: string
  availability: WeeklyAvailability
}

export interface Team {
  id: string
  name: string
  category: string
  gender: Gender
}

export interface Coach {
  id: string
  name: string
  teamIds: string[]
  canDoubleCoach: boolean
  availability: WeeklyAvailability
  playerTeamId?: string
}

export interface Session {
  id: string
  pavilionId: string
  courtNumber: number
  teamId: string
  coachId: string
  day: Day
  startTime: string
  endTime: string
}

export type Page = 'schedule' | 'pavilions' | 'teams' | 'coaches' | 'export'

export function defaultAvailability(): WeeklyAvailability {
  const result = {} as WeeklyAvailability
  for (const d of ALL_DAYS) result[d] = { available: false, slots: [] }
  return result
}
