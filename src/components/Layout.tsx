import { NavLink } from 'react-router-dom'
import { Building2, Users, UserCheck, Calendar, Download } from 'lucide-react'

const navItems = [
  { to: '/schedule', label: 'Horario', icon: <Calendar size={18} /> },
  { to: '/pavillions', label: 'Pabellones', icon: <Building2 size={18} /> },
  { to: '/teams', label: 'Equipos', icon: <Users size={18} /> },
  { to: '/trainers', label: 'Entrenadores', icon: <UserCheck size={18} /> },
  { to: '/config', label: 'Configuración', icon: <Download size={18} /> },
]

interface Props { children: React.ReactNode }

export default function Layout({ children }: Props) {
  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex">
      <aside className="w-52 bg-gray-900 border-r border-gray-800 flex flex-col py-6 gap-1 px-3 shrink-0 sticky top-0 h-screen">
        <div className="px-2 mb-6">
          <h1 className="text-lg font-bold text-white">Voleibol</h1>
          <p className="text-xs text-gray-400">Gestión de horarios</p>
        </div>
        {navItems.map(n => (
          <NavLink
            key={n.to}
            to={n.to}
            className={({ isActive }) =>
              `flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`
            }
          >
            {n.icon}
            {n.label}
          </NavLink>
        ))}
      </aside>
      <main className="flex-1 min-w-0 p-6">{children}</main>
    </div>
  )
}
