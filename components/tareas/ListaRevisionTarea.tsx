'use client'

import { useState } from 'react'
import { CheckCircle2, Circle, BellRing, ExternalLink, Loader2 } from 'lucide-react'
import {
  toggleEntregaTarea,
  notificarNoEntregaron,
  type AlertaTarea,
} from '@/app/actions/tareas'

export interface FilaEstudianteEntrega {
  id: string
  codigo_personal: string
  nombres: string
  apellidos: string
  entregada: boolean
  alerta_enviada: boolean
}

export function ListaRevisionTarea({
  tareaId,
  filasIniciales,
}: {
  tareaId: string
  filasIniciales: FilaEstudianteEntrega[]
}) {
  const [filas, setFilas] = useState(filasIniciales)
  const [notificando, setNotificando] = useState(false)
  const [mensaje, setMensaje] = useState<string | null>(null)
  const [alertas, setAlertas] = useState<AlertaTarea[]>([])

  async function cambiarEstado(estId: string, actual: boolean) {
    const nuevoValor = !actual
    setFilas((prev) =>
      prev.map((f) => (f.id === estId ? { ...f, entregada: nuevoValor } : f))
    )
    await toggleEntregaTarea(tareaId, estId, nuevoValor)
  }

  async function manejarNotificacion() {
    setNotificando(true)
    setMensaje(null)
    const res = await notificarNoEntregaron(tareaId)
    setNotificando(false)

    if (res.error) {
      setMensaje(res.error)
      return
    }

    setMensaje(res.mensaje ?? 'Proceso finalizado.')
    setAlertas(res.alertas ?? [])
  }

  const entregaronCount = filas.filter((f) => f.entregada).length

  return (
    <div className="space-y-4">
      <div className="flex flex-col justify-between gap-3 rounded-2xl border border-[#E2E8F0] bg-white p-4 shadow-xs sm:flex-row sm:items-center">
        <p className="text-sm font-medium text-slate-700">
          Entregadas:{' '}
          <span className="tabular-nums font-bold text-emerald-700">
            {entregaronCount} / {filas.length}
          </span>
        </p>

        <button
          type="button"
          onClick={manejarNotificacion}
          disabled={notificando}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-amber-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-amber-700 disabled:opacity-50"
        >
          {notificando ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <BellRing className="h-4 w-4" />
          )}
          Notificar por WhatsApp a quienes no entregaron
        </button>
      </div>

      {mensaje && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900">
          <p className="font-semibold">{mensaje}</p>
          {alertas.length > 0 && (
            <ul className="mt-2 space-y-1.5">
              {alertas.map((a, i) => (
                <li key={i} className="flex items-center justify-between gap-2">
                  <span>
                    {a.estudiante} ({a.telefono}) —{' '}
                    <strong>{a.estado === 'enviado' ? 'Enviado' : 'Pendiente (API)'}</strong>
                  </span>
                  <a
                    href={a.enlaceWaMe}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 font-semibold text-emerald-700 underline"
                  >
                    Abrir WhatsApp <ExternalLink className="h-3 w-3" />
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white shadow-xs">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-[#E2E8F0] bg-[#F8FAFC] text-xs font-semibold uppercase tracking-wider text-slate-500">
            <tr>
              <th className="px-6 py-3">Estudiante</th>
              <th className="px-6 py-3">Estado</th>
              <th className="px-6 py-3 text-right">Acción</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E2E8F0]">
            {filas.map((f) => (
              <tr key={f.id} className="hover:bg-slate-50/70">
                <td className="px-6 py-3.5 font-medium text-slate-900">
                  {f.apellidos}, {f.nombres}
                  <span className="tabular-nums block font-mono text-xs font-normal text-slate-500">
                    {f.codigo_personal}
                  </span>
                </td>
                <td className="px-6 py-3.5">
                  {f.entregada ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Entregó
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-semibold text-red-800">
                      <Circle className="h-3.5 w-3.5" /> Pendiente
                      {f.alerta_enviada && ' (Notificado)'}
                    </span>
                  )}
                </td>
                <td className="px-6 py-3.5 text-right">
                  <button
                    type="button"
                    onClick={() => cambiarEstado(f.id, f.entregada)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                      f.entregada
                        ? 'border border-[#E2E8F0] bg-white text-slate-600 hover:bg-slate-50'
                        : 'bg-[#2563EB] text-white hover:bg-[#1D4ED8]'
                    }`}
                  >
                    {f.entregada ? 'Marcar pendiente' : 'Marcar entregada'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}