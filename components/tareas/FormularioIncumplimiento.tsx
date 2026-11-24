'use client'

import { useState } from 'react'
import { Send, ExternalLink, CheckCircle2, AlertCircle } from 'lucide-react'
import { registrarIncumplimientoTarea } from '@/app/actions/tareas'

interface EstudianteOpcion {
  id: string
  nombres: string
  apellidos: string
  grado: string
}

export function FormularioIncumplimiento({
  estudiantes,
}: {
  estudiantes: EstudianteOpcion[]
}) {
  const [estudianteId, setEstudianteId] = useState('')
  const [materia, setMateria] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [cargando, setCargando] = useState(false)
  const [respuesta, setRespuesta] = useState<{
    tipo: 'ok' | 'error'
    texto: string
    enlaceWaMe?: string
  } | null>(null)

  async function manejarEnvio(e: React.FormEvent) {
    e.preventDefault()
    setCargando(true)
    setRespuesta(null)

    const res = await registrarIncumplimientoTarea({
      estudiante_id: estudianteId,
      materia,
      descripcion_tarea: descripcion,
    })

    setCargando(false)

    if (res.error) {
      setRespuesta({ tipo: 'error', texto: res.error })
      return
    }

    setRespuesta({
      tipo: 'ok',
      texto: `Reporte guardado para ${res.estudiante}. Alerta: ${
        res.estado === 'enviado' ? 'Enviada automáticamente' : 'Lista para WhatsApp'
      }.`,
      enlaceWaMe: res.enlaceWaMe,
    })
    setEstudianteId('')
    setMateria('')
    setDescripcion('')
  }

  return (
    <form
      onSubmit={manejarEnvio}
      className="space-y-4 rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-xs"
    >
      <div>
        <h2 className="text-base font-semibold text-slate-900">
          Reportar tarea no entregada
        </h2>
        <p className="text-xs text-slate-500">
          Envía una notificación inmediata por WhatsApp al encargado
        </p>
      </div>

      {respuesta && (
        <div
          className={`flex flex-col gap-2 rounded-xl p-3.5 text-xs font-medium ${
            respuesta.tipo === 'ok'
              ? 'bg-emerald-50 text-emerald-800'
              : 'bg-red-50 text-red-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {respuesta.tipo === 'ok' ? (
              <CheckCircle2 className="h-4 w-4 shrink-0" />
            ) : (
              <AlertCircle className="h-4 w-4 shrink-0" />
            )}
            <span>{respuesta.texto}</span>
          </div>
          {respuesta.enlaceWaMe && (
            <a
              href={respuesta.enlaceWaMe}
              target="_blank"
              rel="noreferrer"
              className="inline-flex w-fit items-center gap-1 font-semibold text-emerald-700 underline"
            >
              Abrir mensaje en WhatsApp <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-700">
            Estudiante
          </label>
          <select
            required
            value={estudianteId}
            onChange={(e) => setEstudianteId(e.target.value)}
            className="w-full rounded-lg border border-[#E2E8F0] bg-white px-3 py-2 text-sm outline-none focus:border-[#2563EB]"
          >
            <option value="">Selecciona un estudiante...</option>
            {estudiantes.map((est) => (
              <option key={est.id} value={est.id}>
                {est.apellidos}, {est.nombres} ({est.grado})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-700">
            Materia / Curso
          </label>
          <input
            required
            value={materia}
            onChange={(e) => setMateria(e.target.value)}
            placeholder="Ej. Computación, Matemática..."
            className="w-full rounded-lg border border-[#E2E8F0] px-3 py-2 text-sm outline-none focus:border-[#2563EB]"
          />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-xs font-semibold text-slate-700">
          Descripción de la tarea incumplida
        </label>
        <textarea
          required
          rows={2}
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
          placeholder="Ej. Hoja de trabajo #4 sobre bases de datos"
          className="w-full rounded-lg border border-[#E2E8F0] px-3 py-2 text-sm outline-none focus:border-[#2563EB]"
        />
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={cargando}
          className="inline-flex items-center gap-2 rounded-lg bg-[#2563EB] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#1D4ED8] disabled:opacity-50"
        >
          <Send className="h-3.5 w-3.5" />
          {cargando ? 'Enviando...' : 'Registrar y notificar'}
        </button>
      </div>
    </form>
  )
}