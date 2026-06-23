import { Building2, Users, UserCheck, Calendar, Download } from 'lucide-react'
import type { Page } from '../types'

interface Props {
  page: Page
  onNav: (p: Page) => void
  children: React.ReactNode
}

const navItems: { id: Page; label: string; icon: React.ReactNode }[] = [
  { id: 'schedule', label: 'Horario', icon: <Calendar size={18} /> },
  { id: 'pavilions', label: 'Pabellones', icon: <Building2 size={18} /> },
  { id: 'teams', label: 'Equipos', icon: <Users size={18} /> },
  { id: 'coaches', label: 'Entrenadores', icon: <UserCheck size={18} /> },
  { id: 'export', label: 'Configuración', icon: <Download size={18} /> },
]

export default function Layout({ page, onNav, children }: Props) {
  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex">
      <aside className="w-52 bg-gray-900 border-r border-gray-800 flex flex-col py-6 gap-1 px-3 shrink-0 sticky top-0 h-screen">
        <div className="px-2 mb-6">
          <h1 className="text-lg font-bold text-white">Voleibol</h1>
          <p className="text-xs text-gray-400">Gestión de horarios</p>
        </div>
        {navItems.map(n => (
          <button
            key={n.id}
            onClick={() => onNav(n.id)}
            className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              page === n.id
                ? 'bg-indigo-600 text-white'
                : 'text-gray-400 hover:text-white hover:bg-gray-800'
            }`}
          >
            {n.icon}
            {n.label}
          </button>
        ))}
      </aside>
      <main className="flex-1 min-w-0 p-6">{children}</main>
    </div>
  )
}
