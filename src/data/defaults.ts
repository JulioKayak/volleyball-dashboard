import type { Coach, Pavilion, Session, Team, WeeklyAvailability, Day } from '../types'
import { ALL_DAYS } from '../types'

function someDays(days: Day[], start: string, end: string): WeeklyAvailability {
  const result = {} as WeeklyAvailability
  for (const d of ALL_DAYS)
    result[d] = days.includes(d)
      ? { available: true, slots: [{ start, end }] }
      : { available: false, slots: [] }
  return result
}

const WEEKDAYS: Day[] = ['mon', 'tue', 'wed', 'thu', 'fri']
const DEFAULT_COACH_AVAIL = someDays(WEEKDAYS, '18:00', '23:30')

export const DEFAULT_PAVILIONS: Pavilion[] = [
  {
    id: 'pav-multiusos', name: 'Multiusos', maxCourts: 3, color: '#6366f1',
    availability: someDays(WEEKDAYS, '18:30', '23:00'),
  },
  {
    id: 'pav-xunqueira2', name: 'Xunqueira 2', maxCourts: 2, color: '#10b981',
    availability: someDays(['mon', 'tue', 'wed', 'fri'], '18:30', '23:00'),
  },
  {
    id: 'pav-cgtd', name: 'CGTD', maxCourts: 2, color: '#f59e0b',
    availability: someDays(['mon', 'wed', 'thu', 'fri'], '22:00', '23:30'),
  },
]

export const DEFAULT_TEAMS: Team[] = [
  { id: 't-sen-m1',   name: 'Senior Masculino 1',   category: 'Senior',   gender: 'M', sessionsPerWeek: 3 },
  { id: 't-sen-m2',   name: 'Senior Masculino 2',   category: 'Senior',   gender: 'M', sessionsPerWeek: 3 },
  { id: 't-sen-f1',   name: 'Senior Femenino 1',    category: 'Senior',   gender: 'F', sessionsPerWeek: 3 },
  { id: 't-sen-f2',   name: 'Senior Femenino 2',    category: 'Senior',   gender: 'F', sessionsPerWeek: 3 },
  { id: 't-jun-m',    name: 'Junior Masculino',     category: 'Junior',   gender: 'M', sessionsPerWeek: 3 },
  { id: 't-juv-m',    name: 'Juvenil Masculino',    category: 'Juvenil',  gender: 'M', sessionsPerWeek: 3 },
  { id: 't-juv-f1',   name: 'Juvenil Femenino 1',   category: 'Juvenil',  gender: 'F', sessionsPerWeek: 3 },
  { id: 't-juv-f2',   name: 'Juvenil Femenino 2',   category: 'Juvenil',  gender: 'F', sessionsPerWeek: 3 },
  { id: 't-cad-m',    name: 'Cadete Masculino',     category: 'Cadete',   gender: 'M', sessionsPerWeek: 3 },
  { id: 't-cad-f1',   name: 'Cadete Femenino 1',    category: 'Cadete',   gender: 'F', sessionsPerWeek: 3 },
  { id: 't-cad-f2',   name: 'Cadete Femenino 2',    category: 'Cadete',   gender: 'F', sessionsPerWeek: 3 },
  { id: 't-cad-f3',   name: 'Cadete Femenino 3',    category: 'Cadete',   gender: 'F', sessionsPerWeek: 3 },
  { id: 't-inf-m',    name: 'Infantil Masculino',   category: 'Infantil', gender: 'M', sessionsPerWeek: 3 },
  { id: 't-inf-f1',   name: 'Infantil Femenino 1',  category: 'Infantil', gender: 'F', sessionsPerWeek: 3 },
  { id: 't-inf-f2',   name: 'Infantil Femenino 2',  category: 'Infantil', gender: 'F', sessionsPerWeek: 3 },
  { id: 't-inf-f3',   name: 'Infantil Femenino 3',  category: 'Infantil', gender: 'F', sessionsPerWeek: 3 },
  { id: 't-ale-m',    name: 'Alevín Masculino',     category: 'Alevín',   gender: 'M', sessionsPerWeek: 3 },
  { id: 't-ale-f',    name: 'Alevín Femenino',      category: 'Alevín',   gender: 'F', sessionsPerWeek: 3 },
  { id: 't-esc-sub14', name: 'Escuelas Sub14',      category: 'Escuelas', gender: 'M', sessionsPerWeek: 2 },
  { id: 't-esc-amateur', name: 'Escuelas Amateur',  category: 'Escuelas', gender: 'F', sessionsPerWeek: 2 },
]

export const DEFAULT_COACHES: Coach[] = [
  {
    id: 'c-patri', name: 'Patri',
    canDoubleCoach: false, playerTeamId: undefined,
    teamIds: ['t-sen-m1', 't-juv-f1', 't-cad-f1'],
    availability: DEFAULT_COACH_AVAIL,
  },
  {
    id: 'c-solla', name: 'Solla',
    canDoubleCoach: false, playerTeamId: undefined,
    teamIds: ['t-sen-f1'],
    availability: DEFAULT_COACH_AVAIL,
  },
  {
    id: 'c-julio', name: 'Julio',
    canDoubleCoach: false, playerTeamId: 't-sen-m1',
    teamIds: ['t-sen-f2', 't-cad-f2'],
    availability: DEFAULT_COACH_AVAIL,
  },
  {
    id: 'c-gonzalo', name: 'Gonzalo',
    canDoubleCoach: true, playerTeamId: 't-sen-m1',
    teamIds: ['t-jun-m', 't-juv-m', 't-cad-m'],
    availability: DEFAULT_COACH_AVAIL,
  },
  {
    id: 'c-borja', name: 'Borja',
    canDoubleCoach: false, playerTeamId: 't-sen-m1',
    teamIds: ['t-inf-f1', 't-ale-f'],
    availability: DEFAULT_COACH_AVAIL,
  },
  {
    id: 'c-carol', name: 'Carol',
    canDoubleCoach: false, playerTeamId: undefined,
    teamIds: ['t-esc-sub14'],
    availability: DEFAULT_COACH_AVAIL,
  },
  {
    id: 'c-raquel', name: 'Raquel',
    canDoubleCoach: false, playerTeamId: 't-sen-f2',
    teamIds: ['t-cad-f3'],
    availability: DEFAULT_COACH_AVAIL,
  },
  {
    id: 'c-carmen-g', name: 'Carmen G',
    canDoubleCoach: false, playerTeamId: 't-sen-f2',
    teamIds: ['t-esc-amateur'],
    availability: DEFAULT_COACH_AVAIL,
  },
  {
    id: 'c-carmen-b', name: 'Carmen B',
    canDoubleCoach: false, playerTeamId: 't-sen-f2',
    teamIds: ['t-inf-f2'],
    availability: DEFAULT_COACH_AVAIL,
  },
  {
    id: 'c-iago', name: 'Iago',
    canDoubleCoach: false, playerTeamId: 't-sen-m2',
    teamIds: ['t-inf-m', 't-ale-m'],
    availability: DEFAULT_COACH_AVAIL,
  },
  {
    id: 'c-krystia', name: 'Krystia',
    canDoubleCoach: false, playerTeamId: undefined,
    teamIds: ['t-sen-m2', 't-inf-f3'],
    availability: DEFAULT_COACH_AVAIL,
  },
]

export const DEFAULT_SESSIONS: Session[] = []
