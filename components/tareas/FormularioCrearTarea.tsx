'use client'

import { useState } from 'react'
import { PlusCircle, CheckCircle2, AlertCircle } from 'lucide-react'
import { crearTarea } from '@/app/actions/tareas'

export function FormularioCrearTarea({ grados }: { grados: string[] }) {
  const [titulo, setTitulo] = useState('')
  const [materia, setMateria] = useState('')
  const [grado, setGrado] = useState(grados[0] ?? '')
  const [fechaEntrega, setFechaEntrega] = useState('')
  const [punteo, setPunteo] = useState('10')
  const [descripcion, setDescripcion] = useState('')
  const [cargando, setCargando] = useState(false)
  const [estado, setEstado] = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(null)

  async function manejarSubmit(e: React.FormEvent) {
    e.preventDefault()
    setCargando(true)
    setEstado(null)

    const res = await crearTarea({
      titulo,
      materia,
      grado,
      descripcion,
      fecha_entrega: fechaEntrega,
      punteo: Number(punteo),
    })

    setCargando(false)

    if (res.error) {
      setEstado({ tipo: 'error', texto: res.error })
      return
    }

    setEstado({ tipo: 'ok', texto: 'Tarea creada correctamente.' })
    setTitulo('')
    setMateria('')
    setDescripcion('')
  }

  return (
    <form
      onSubmit={manejarSubmit}
      className="space-y-4 rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-xs"
    >
      <div>
        <h2 className="text-base font-semibold text-slate-900">Nueva Tarea</h2>
        <p className="text-xs text-slate-500">
          Asigna una tarea a un grado para controlar entregas y alertas
        </p>
      </div>

      {estado && (
        <div
          className={`flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-xs font-medium ${
            estado.tipo === 'ok'
              ? 'bg-emerald-50 text-emerald-800'
              : 'bg-red-50 text-red-800'
          }`}
        >
          {estado.tipo === 'ok' ? (
            <CheckCircle2 className="h-4 w-4 shrink-0" />
          ) : (
            <AlertCircle className="h-4 w-4 shrink-0" />
          )}
          <span>{estado.texto}</span>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <label className="mb-1 block text-xs font-semibold text-slate-700">
            Título de la tarea
          </label>
          <input
            required
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            placeholder="Ej. Hoja de trabajo #4"
            className="w-full rounded-lg border border-[#E2E8F0] px-3 py-2 text-sm outline-none focus:border-[#2563EB]"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-700">
            Materia
          </label>
          <input
            required
            value={materia}
            onChange={(e) => setMateria(e.target.value)}
            placeholder="Ej. Computación"
            className="w-full rounded-lg border border-[#E2E8F0] px-3 py-2 text-sm outline-none focus:border-[#2563EB]"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-700">
            Grado
          </label>
          <select
            required
            value={grado}
            onChange={(e) => setGrado(e.target.value)}
            className="w-full rounded-lg border border-[#E2E8F0] bg-white px-3 py-2 text-sm outline-none focus:border-[#2563EB]"
          >
            <option value="">Seleccionar...</option>
            {grados.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-700">
            Fecha de entrega
          </label>
          <input
            required
            type="date"
            value={fechaEntrega}
            onChange={(e) => setFechaEntrega(e.target.value)}
            className="tabular-nums w-full rounded-lg border border-[#E2E8F0] px-3 py-2 text-sm outline-none focus:border-[#2563EB]"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <div className="sm:col-span-3">
          <label className="mb-1 block text-xs font-semibold text-slate-700">
            Instrucciones (opcional)
          </label>
          <input
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            placeholder="Detalles breves de la tarea..."
            className="w-full rounded-lg border border-[#E2E8F0] px-3 py-2 text-sm outline-none focus:border-[#2563EB]"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-700">
            Punteo
          </label>
          <input
            type="number"
            min="1"
            max="100"
            value={punteo}
            onChange={(e) => setPunteo(e.target.value)}
            className="tabular-nums w-full rounded-lg border border-[#E2E8F0] px-3 py-2 text-sm outline-none focus:border-[#2563EB]"
          />
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={cargando}
          className="inline-flex items-center gap-2 rounded-lg bg-[#2563EB] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#1D4ED8] disabled:opacity-50"
        >
          <PlusCircle className="h-4 w-4" />
          {cargando ? 'Guardando...' : 'Crear tarea'}
        </button>
      </div>
    </form>
  )
}