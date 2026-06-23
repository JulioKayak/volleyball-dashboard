import type { Coach, Pavilion, Session, Team, WeeklyAvailability } from '../types'
import { ALL_DAYS } from '../types'

const WEEKDAYS = ['mon', 'tue', 'wed', 'thu', 'fri'] as const

function weekdays(start: string, end: string): WeeklyAvailability {
  const result = {} as WeeklyAvailability
  for (const d of ALL_DAYS)
    result[d] = WEEKDAYS.includes(d as typeof WEEKDAYS[number])
      ? { available: true, slots: [{ start, end }] }
      : { available: false, slots: [] }
  return result
}

function someDays(days: typeof ALL_DAYS[number][], start: string, end: string): WeeklyAvailability {
  const result = {} as WeeklyAvailability
  for (const d of ALL_DAYS)
    result[d] = days.includes(d)
      ? { available: true, slots: [{ start, end }] }
      : { available: false, slots: [] }
  return result
}

const PAV_AVAIL = weekdays('18:00', '23:00')

export const DEFAULT_PAVILIONS: Pavilion[] = [
  { id: 'pav1', name: 'Pabellón A', maxCourts: 2, color: '#6366f1', availability: PAV_AVAIL },
  { id: 'pav2', name: 'Pabellón B', maxCourts: 2, color: '#10b981', availability: PAV_AVAIL },
  { id: 'pav3', name: 'Pabellón C', maxCourts: 3, color: '#f59e0b', availability: PAV_AVAIL },
]

export const DEFAULT_TEAMS: Team[] = [
  { id: 't_esc_m',  name: 'Escuelas Masculino',  category: 'Escuelas', gender: 'M' },
  { id: 't_esc_f',  name: 'Escuelas Femenino',   category: 'Escuelas', gender: 'F' },
  { id: 't_ben_m',  name: 'Benjamín Masculino',  category: 'Benjamín', gender: 'M' },
  { id: 't_ben_f',  name: 'Benjamín Femenino',   category: 'Benjamín', gender: 'F' },
  { id: 't_ale_m1', name: 'Alevín M1',           category: 'Alevín',  gender: 'M' },
  { id: 't_ale_m2', name: 'Alevín M2',           category: 'Alevín',  gender: 'M' },
  { id: 't_ale_f',  name: 'Alevín Femenino',     category: 'Alevín',  gender: 'F' },
  { id: 't_inf_m1', name: 'Infantil M1',         category: 'Infantil', gender: 'M' },
  { id: 't_inf_m2', name: 'Infantil M2',         category: 'Infantil', gender: 'M' },
  { id: 't_inf_f1', name: 'Infantil F1',         category: 'Infantil', gender: 'F' },
  { id: 't_inf_f2', name: 'Infantil F2',         category: 'Infantil', gender: 'F' },
  { id: 't_cad_m1', name: 'Cadete M1',           category: 'Cadete',  gender: 'M' },
  { id: 't_cad_m2', name: 'Cadete M2',           category: 'Cadete',  gender: 'M' },
  { id: 't_cad_f1', name: 'Cadete F1',           category: 'Cadete',  gender: 'F' },
  { id: 't_cad_f2', name: 'Cadete F2',           category: 'Cadete',  gender: 'F' },
  { id: 't_juv_m',  name: 'Juvenil Masculino',   category: 'Juvenil', gender: 'M' },
  { id: 't_juv_f',  name: 'Juvenil Femenino',    category: 'Juvenil', gender: 'F' },
  { id: 't_jun_m',  name: 'Junior Masculino',    category: 'Junior',  gender: 'M' },
  { id: 't_jun_f',  name: 'Junior Femenino',     category: 'Junior',  gender: 'F' },
  { id: 't_sen_m1', name: 'Senior M1',           category: 'Senior',  gender: 'M' },
  { id: 't_sen_m2', name: 'Senior M2',           category: 'Senior',  gender: 'M' },
  { id: 't_sen_f1', name: 'Senior Femenino',     category: 'Senior',  gender: 'F' },
  { id: 't_sen_f2', name: 'Senior Femenino 2',   category: 'Senior',  gender: 'F' },
]

export const DEFAULT_COACHES: Coach[] = [
  {
    id: 'c1', name: 'Carlos R.',
    canDoubleCoach: true,
    playerTeamId: 't_sen_m1',
    teamIds: ['t_esc_m', 't_ben_m', 't_ale_m1'],
    availability: weekdays('18:00', '23:00'),
  },
  {
    id: 'c2', name: 'María S.',
    canDoubleCoach: true,
    playerTeamId: 't_sen_f1',
    teamIds: ['t_esc_f', 't_ben_f', 't_ale_f'],
    availability: weekdays('18:00', '23:00'),
  },
  {
    id: 'c3', name: 'Ana L.',
    canDoubleCoach: true,
    playerTeamId: 't_sen_f2',
    teamIds: ['t_inf_f1', 't_inf_f2', 't_cad_f1'],
    availability: weekdays('20:00', '23:00'),
  },
  {
    id: 'c4', name: 'Pedro G.',
    canDoubleCoach: false,
    playerTeamId: undefined,
    teamIds: ['t_ale_m2', 't_cad_m1', 't_cad_m2'],
    availability: weekdays('20:00', '23:00'),
  },
  {
    id: 'c5', name: 'Laura M.',
    canDoubleCoach: false,
    playerTeamId: undefined,
    teamIds: ['t_inf_m1', 't_inf_m2', 't_cad_f2'],
    availability: weekdays('18:00', '22:00'),
  },
  {
    id: 'c6', name: 'Javier T.',
    canDoubleCoach: false,
    playerTeamId: undefined,
    teamIds: ['t_juv_m', 't_jun_m', 't_sen_m2'],
    availability: someDays(['mon', 'wed', 'fri'], '18:00', '23:00'),
  },
  {
    id: 'c7', name: 'Sofía R.',
    canDoubleCoach: false,
    playerTeamId: undefined,
    teamIds: ['t_juv_f', 't_jun_f', 't_sen_f1', 't_sen_f2'],
    availability: someDays(['tue', 'wed', 'thu'], '18:00', '23:00'),
  },
]

export const DEFAULT_SESSIONS: Session[] = []
