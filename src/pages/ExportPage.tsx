import { useRef, useState } from 'react'
import { useStore } from '../store'
import { Download, Upload, AlertTriangle, Trash2, DatabaseBackup } from 'lucide-react'
import { checkConflicts } from '../utils/conflicts'
import { DEFAULT_COACHES, DEFAULT_PAVILIONS, DEFAULT_SESSIONS, DEFAULT_TEAMS } from '../data/defaults'

export default function ExportPage() {
  const store = useStore()
  const fileRef = useRef<HTMLInputElement>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)

  function deleteAll() {
    store.importData({ pavilions: [], teams: [], coaches: [], sessions: [] })
    setConfirmDelete(false)
  }

  function exportData() {
    const data = {
      pavilions: store.pavilions,
      teams: store.teams,
      coaches: store.coaches,
      sessions: store.sessions,
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `volleyball-horarios-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  function importData(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string)
        store.importData({
          pavilions: data.pavilions ?? [],
          teams: data.teams ?? [],
          coaches: data.coaches ?? [],
          sessions: data.sessions ?? [],
        })
        alert('Datos importados correctamente.')
      } catch {
        alert('Error al leer el archivo. Comprueba que es un JSON válido.')
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  const total = store.sessions.length
  const conflicts = store.sessions.filter(s => {
    const coach = store.coaches.find(c => c.id === s.coachId)
    if (!coach) return false
    const pavilion = store.pavilions.find(p => p.id === s.pavilionId)
    const r = checkConflicts(
      { day: s.day, startTime: s.startTime, endTime: s.endTime, pavilionId: s.pavilionId, courtNumber: s.courtNumber, teamId: s.teamId, coachId: s.coachId },
      store.sessions, coach, pavilion, s.id
    )
    return r.coachDoubleBooked || r.courtOccupied || r.coachUnavailable || r.pavilionUnavailable || r.coachPlayerConflict
  }).length

  return (
    <div className="max-w-lg">
      <h2 className="text-xl font-bold mb-2">Exportar / Importar</h2>
      <p className="text-sm text-gray-400 mb-6">Guarda o carga toda la configuración en un archivo JSON.</p>

      <div className="grid gap-4">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h3 className="font-semibold mb-1">Resumen actual</h3>
          <div className="grid grid-cols-2 gap-3 mt-3 text-sm">
            <div className="bg-gray-800 rounded-lg p-3">
              <p className="text-2xl font-bold">{store.pavilions.length}</p>
              <p className="text-gray-400 text-xs mt-0.5">Pabellones</p>
            </div>
            <div className="bg-gray-800 rounded-lg p-3">
              <p className="text-2xl font-bold">{store.teams.length}</p>
              <p className="text-gray-400 text-xs mt-0.5">Equipos</p>
            </div>
            <div className="bg-gray-800 rounded-lg p-3">
              <p className="text-2xl font-bold">{store.coaches.length}</p>
              <p className="text-gray-400 text-xs mt-0.5">Entrenadores</p>
            </div>
            <div className="bg-gray-800 rounded-lg p-3">
              <p className="text-2xl font-bold">{total}</p>
              <p className="text-gray-400 text-xs mt-0.5">Sesiones</p>
            </div>
          </div>
          {conflicts > 0 && (
            <div className="mt-3 flex items-center gap-2 bg-red-950/40 border border-red-800 rounded-lg px-3 py-2 text-xs text-red-300">
              <AlertTriangle size={13} />
              {conflicts} sesión{conflicts > 1 ? 'es' : ''} con conflictos
            </div>
          )}
        </div>

        <button
          onClick={exportData}
          className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-3 rounded-xl font-medium transition-colors"
        >
          <Download size={18} /> Descargar JSON
        </button>

        <div className="relative">
          <button
            onClick={() => fileRef.current?.click()}
            className="w-full flex items-center justify-center gap-2 bg-gray-800 hover:bg-gray-700 text-white px-5 py-3 rounded-xl font-medium transition-colors border border-gray-700 border-dashed"
          >
            <Upload size={18} /> Cargar JSON
          </button>
          <input ref={fileRef} type="file" accept=".json" onChange={importData} className="hidden" />
        </div>

        <p className="text-xs text-gray-500 text-center">
          Al importar se reemplazarán todos los datos actuales.
        </p>

        <div className="border-t border-gray-800 pt-4">
          {!confirmDelete ? (
            <button
              onClick={() => setConfirmDelete(true)}
              className="w-full flex items-center justify-center gap-2 bg-gray-900 hover:bg-red-950/40 text-red-400 hover:text-red-300 px-5 py-3 rounded-xl font-medium transition-colors border border-gray-800 hover:border-red-800"
            >
              <Trash2 size={16} /> Eliminar todos los datos
            </button>
          ) : (
            <div className="bg-red-950/40 border border-red-800 rounded-xl p-4 space-y-3">
              <p className="text-sm text-red-300 font-medium">¿Seguro? Se borrarán pabellones, equipos, entrenadores y sesiones.</p>
              <div className="flex gap-2">
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="flex-1 px-4 py-2 text-sm bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  onClick={deleteAll}
                  className="flex-1 px-4 py-2 text-sm bg-red-700 hover:bg-red-600 text-white rounded-lg font-medium"
                >
                  Sí, eliminar todo
                </button>
              </div>
            </div>
          )}
        </div>
        <button
          onClick={() => store.importData({ pavilions: DEFAULT_PAVILIONS, teams: DEFAULT_TEAMS, coaches: DEFAULT_COACHES, sessions: DEFAULT_SESSIONS })}
          className="w-full flex items-center justify-center gap-2 bg-gray-900 hover:bg-gray-800 text-gray-300 hover:text-white px-5 py-3 rounded-xl font-medium border border-gray-700 transition-colors"
        >
          <DatabaseBackup size={16} /> Cargar datos por defecto
        </button>
      </div>
    </div>
  )
}
