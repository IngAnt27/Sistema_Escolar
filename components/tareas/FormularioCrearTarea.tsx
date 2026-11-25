'use client'

import { useState } from 'react'
import {
  PlusCircle,
  CheckCircle2,
  AlertCircle,
  ClipboardList,
  BookOpen,
  GraduationCap,
  Calendar,
  Award,
  FileText,
  Loader2,
  RotateCcw,
} from 'lucide-react'
import { crearTarea } from '@/app/actions/tareas'

export function FormularioCrearTarea({ grados }: { grados: string[] }) {
  const [titulo, setTitulo] = useState('')
  const [materia, setMateria] = useState('')
  const [grado, setGrado] = useState(grados[0] ?? '')
  const [fechaEntrega, setFechaEntrega] = useState('')
  const [punteo, setPunteo] = useState('10')
  const [descripcion, setDescripcion] = useState('')
  const [cargando, setCargando] = useState(false)
  const [estado, setEstado] = useState<{
    tipo: 'ok' | 'error'
    texto: string
  } | null>(null)

  function limpiarFormulario() {
    setEstado(null)
    setTitulo('')
    setMateria('')
    setGrado(grados[0] ?? '')
    setFechaEntrega('')
    setPunteo('10')
    setDescripcion('')
  }

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
    <form onSubmit={manejarSubmit} className="space-y-5">
      {/* Alerta de estado */}
      {estado && (
        <div
          className={`flex items-center gap-2.5 rounded-2xl border px-4 py-3 text-sm font-medium ${
            estado.tipo === 'ok'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
              : 'border-red-200 bg-red-50 text-red-700'
          }`}
        >
          {estado.tipo === 'ok' ? (
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
          ) : (
            <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
          )}
          <span>{estado.texto}</span>
        </div>
      )}

      {/* Bloque 1: Datos principales */}
      <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-xs sm:p-6">
        <div className="mb-4 flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
            <ClipboardList className="h-4 w-4" />
          </div>
          <h3 className="text-sm font-bold text-slate-900">
            Información de la Tarea
          </h3>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label
              htmlFor="titulo-tarea"
              className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500"
            >
              Título de la tarea
            </label>
            <input
              id="titulo-tarea"
              required
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Ej. Hoja de trabajo #4"
              className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3.5 py-2.5 text-sm font-medium text-slate-900 outline-none transition placeholder:font-normal placeholder:text-slate-400 focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-600/10"
            />
          </div>

          <div>
            <label
              htmlFor="materia-tarea"
              className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500"
            >
              Materia
            </label>
            <div className="relative">
              <BookOpen className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                id="materia-tarea"
                required
                value={materia}
                onChange={(e) => setMateria(e.target.value)}
                placeholder="Ej. Computación"
                className="w-full rounded-xl border border-slate-200 bg-slate-50/70 py-2.5 pl-10 pr-3.5 text-sm font-medium text-slate-900 outline-none transition placeholder:font-normal placeholder:text-slate-400 focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-600/10"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="grado-tarea"
              className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500"
            >
              Grado
            </label>
            <div className="relative">
              <GraduationCap className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <select
                id="grado-tarea"
                required
                value={grado}
                onChange={(e) => setGrado(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/70 py-2.5 pl-10 pr-3.5 text-sm font-medium text-slate-900 outline-none transition focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-600/10"
              >
                <option value="">Seleccionar...</option>
                {grados.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Bloque 2: Entrega, punteo e instrucciones */}
      <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-xs sm:p-6">
        <div className="mb-4 flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
            <Award className="h-4 w-4" />
          </div>
          <h3 className="text-sm font-bold text-slate-900">
            Entrega y Calificación
          </h3>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label
              htmlFor="fecha-entrega"
              className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500"
            >
              Fecha de entrega
            </label>
            <div className="relative">
              <Calendar className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                id="fecha-entrega"
                required
                type="date"
                value={fechaEntrega}
                onChange={(e) => setFechaEntrega(e.target.value)}
                className="tabular-nums w-full rounded-xl border border-slate-200 bg-slate-50/70 py-2.5 pl-10 pr-3.5 text-sm font-medium text-slate-900 outline-none transition focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-600/10"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="punteo-tarea"
              className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500"
            >
              Punteo (pts)
            </label>
            <div className="relative">
              <Award className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-amber-500" />
              <input
                id="punteo-tarea"
                type="number"
                min="1"
                max="100"
                required
                value={punteo}
                onChange={(e) => setPunteo(e.target.value)}
                className="tabular-nums w-full rounded-xl border border-slate-200 bg-slate-50/70 py-2.5 pl-10 pr-3.5 text-sm font-bold text-slate-900 outline-none transition focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-600/10"
              />
            </div>
          </div>

          <div className="sm:col-span-2">
            <label
              htmlFor="descripcion-tarea"
              className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500"
            >
              Instrucciones (opcional)
            </label>
            <div className="relative">
              <FileText className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
              <textarea
                id="descripcion-tarea"
                rows={3}
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                placeholder="Detalles breves, materiales o criterios de entrega..."
                className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50/70 py-2.5 pl-10 pr-3.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-600/10"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Pie de acciones */}
      <div className="flex flex-col-reverse gap-2.5 border-t border-slate-200/80 pt-4 sm:flex-row sm:items-center sm:justify-end">
        <button
          type="button"
          onClick={limpiarFormulario}
          disabled={cargando}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 hover:text-slate-900 disabled:opacity-50"
        >
          <RotateCcw className="h-4 w-4" />
          <span>Limpiar</span>
        </button>

        <button
          type="submit"
          disabled={cargando}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/25 transition hover:from-blue-700 hover:to-blue-800 active:scale-[0.99] disabled:opacity-60"
        >
          {cargando ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Guardando...</span>
            </>
          ) : (
            <>
              <PlusCircle className="h-4 w-4" />
              <span>Crear tarea</span>
            </>
          )}
        </button>
      </div>
    </form>
  )
}