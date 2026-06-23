import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Coach, Pavilion, Session, Team } from '../types'

interface AppState {
  pavilions: Pavilion[]
  teams: Team[]
  coaches: Coach[]
  sessions: Session[]

  addPavilion: (p: Pavilion) => void
  updatePavilion: (p: Pavilion) => void
  deletePavilion: (id: string) => void

  addTeam: (t: Team) => void
  updateTeam: (t: Team) => void
  deleteTeam: (id: string) => void

  addCoach: (c: Coach) => void
  updateCoach: (c: Coach) => void
  deleteCoach: (id: string) => void

  addSession: (s: Session) => void
  updateSession: (s: Session) => void
  deleteSession: (id: string) => void

  importData: (data: Omit<AppState, keyof Actions>) => void
}

type Actions = {
  [K in keyof AppState as AppState[K] extends Function ? K : never]: AppState[K]
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      pavilions: [],
      teams: [],
      coaches: [],
      sessions: [],

      addPavilion: (p) => set(s => ({ pavilions: [...s.pavilions, p] })),
      updatePavilion: (p) => set(s => ({ pavilions: s.pavilions.map(x => x.id === p.id ? p : x) })),
      deletePavilion: (id) => set(s => ({ pavilions: s.pavilions.filter(x => x.id !== id) })),

      addTeam: (t) => set(s => ({ teams: [...s.teams, t] })),
      updateTeam: (t) => set(s => ({ teams: s.teams.map(x => x.id === t.id ? t : x) })),
      deleteTeam: (id) => set(s => ({ teams: s.teams.filter(x => x.id !== id) })),

      addCoach: (c) => set(s => ({ coaches: [...s.coaches, c] })),
      updateCoach: (c) => set(s => ({ coaches: s.coaches.map(x => x.id === c.id ? c : x) })),
      deleteCoach: (id) => set(s => ({ coaches: s.coaches.filter(x => x.id !== id) })),

      addSession: (s) => set(st => ({ sessions: [...st.sessions, s] })),
      updateSession: (s) => set(st => ({ sessions: st.sessions.map(x => x.id === s.id ? s : x) })),
      deleteSession: (id) => set(st => ({ sessions: st.sessions.filter(x => x.id !== id) })),

      importData: (data) => set(data),
    }),
    { name: 'volleyball-dashboard' }
  )
)
