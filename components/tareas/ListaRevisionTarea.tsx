'use client'

import { useState } from 'react'
import {
  CheckCircle2,
  Circle,
  BellRing,
  ExternalLink,
  Loader2,
  Users,
  AlertTriangle,
} from 'lucide-react'
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
  const pendientesCount = filas.length - entregaronCount
  const porcentaje =
    filas.length > 0 ? Math.round((entregaronCount / filas.length) * 100) : 0

  return (
    <div className="space-y-5">
      {/* Barra de resumen y botón WhatsApp Bento */}
      <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-xs sm:p-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Progreso del grado
              </span>
              <span className="tabular-nums rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-bold text-blue-700">
                {porcentaje}%
              </span>
            </div>
            <p className="text-sm font-medium text-slate-700">
              Entregadas:{' '}
              <span className="tabular-nums text-base font-extrabold text-emerald-700">
                {entregaronCount} / {filas.length}
              </span>
              {pendientesCount > 0 && (
                <span className="tabular-nums ml-2 text-xs font-semibold text-amber-700">
                  ({pendientesCount}{' '}
                  {pendientesCount === 1 ? 'pendiente' : 'pendientes'})
                </span>
              )}
            </p>
          </div>

          <button
            type="button"
            onClick={manejarNotificacion}
            disabled={notificando || pendientesCount === 0}
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 px-5 py-3 text-xs font-semibold text-white shadow-lg shadow-amber-600/20 transition hover:from-amber-600 hover:to-orange-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
          >
            {notificando ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <BellRing className="h-4 w-4" />
            )}
            <span>Notificar por WhatsApp a quienes no entregaron</span>
          </button>
        </div>

        {/* Barra visual */}
        <div className="mt-4 h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-300"
            style={{ width: `${porcentaje}%` }}
          />
        </div>
      </div>

      {/* Panel de alertas WhatsApp */}
      {mensaje && (
        <div className="rounded-3xl border border-amber-200/90 bg-amber-50/90 p-5 text-xs text-amber-950 shadow-2xs">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
            <div className="flex-1 space-y-2.5">
              <p className="text-sm font-bold text-amber-950">{mensaje}</p>

              {alertas.length > 0 && (
                <ul className="space-y-2">
                  {alertas.map((a, i) => (
                    <li
                      key={i}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-white/80 px-3.5 py-2.5 ring-1 ring-amber-200/80"
                    >
                      <span className="font-medium text-slate-800">
                        {a.estudiante}{' '}
                        <span className="tabular-nums font-mono text-[11px] text-slate-500">
                          ({a.telefono})
                        </span>{' '}
                        —{' '}
                        <strong className="text-amber-800">
                          {a.estado === 'enviado'
                            ? 'Enviado'
                            : 'Pendiente (API)'}
                        </strong>
                      </span>
                      <a
                        href={a.enlaceWaMe}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 rounded-xl bg-emerald-600 px-3 py-1.5 text-[11px] font-semibold text-white transition hover:bg-emerald-700"
                      >
                        <span>Abrir WhatsApp</span>
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Listado de estudiantes */}
      <section className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 bg-slate-50/60 px-5 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#0f172a] text-blue-400 shadow-sm">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Estudiantes del grado
              </h2>
              <p className="text-xs text-slate-500">
                Marca o desmarca entregas en tiempo real
              </p>
            </div>
          </div>

          <span className="tabular-nums inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
            {filas.length} {filas.length === 1 ? 'estudiante' : 'estudiantes'}
          </span>
        </div>

        {filas.length === 0 ? (
          <div className="px-6 py-12 text-center text-sm text-slate-500">
            No hay estudiantes activos registrados en este grado.
          </div>
        ) : (
          <>
            {/* Vista Móvil: Tarjetas */}
            <div className="divide-y divide-slate-100 md:hidden">
              {filas.map((f) => (
                <div
                  key={f.id}
                  className="flex items-center justify-between gap-3 p-4"
                >
                  <div className="min-w-0 space-y-1">
                    <p className="truncate text-sm font-bold text-slate-900">
                      {f.apellidos}, {f.nombres}
                    </p>
                    <p className="tabular-nums font-mono text-xs text-slate-500">
                      {f.codigo_personal}
                    </p>
                    <div>
                      {f.entregada ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-800 ring-1 ring-emerald-200/70">
                          <CheckCircle2 className="h-3 w-3" /> Entregó
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-0.5 text-[11px] font-semibold text-red-800 ring-1 ring-red-200/70">
                          <Circle className="h-3 w-3" /> Pendiente
                          {f.alerta_enviada && ' (Notificado)'}
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => cambiarEstado(f.id, f.entregada)}
                    className={`shrink-0 rounded-xl px-3.5 py-2 text-xs font-semibold transition ${
                      f.entregada
                        ? 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                        : 'bg-blue-600 text-white shadow-xs hover:bg-blue-700'
                    }`}
                  >
                    {f.entregada ? 'Marcar pendiente' : 'Marcar entregada'}
                  </button>
                </div>
              ))}
            </div>

            {/* Vista Tablet / Escritorio: Tabla */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-slate-100 bg-white text-xs font-semibold uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-6 py-3.5">Estudiante</th>
                    <th className="px-6 py-3.5">Estado</th>
                    <th className="px-6 py-3.5 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filas.map((f) => (
                    <tr
                      key={f.id}
                      className="transition-colors hover:bg-slate-50/80"
                    >
                      <td className="px-6 py-4">
                        <p className="font-semibold text-slate-900">
                          {f.apellidos}, {f.nombres}
                        </p>
                        <span className="tabular-nums font-mono text-xs text-slate-500">
                          {f.codigo_personal}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        {f.entregada ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800 ring-1 ring-emerald-200/70">
                            <CheckCircle2 className="h-3.5 w-3.5" /> Entregó
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-800 ring-1 ring-red-200/70">
                            <Circle className="h-3.5 w-3.5" /> Pendiente
                            {f.alerta_enviada && ' (Notificado)'}
                          </span>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-right">
                        <button
                          type="button"
                          onClick={() => cambiarEstado(f.id, f.entregada)}
                          className={`rounded-xl px-3.5 py-2 text-xs font-semibold transition ${
                            f.entregada
                              ? 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                              : 'bg-blue-600 text-white shadow-xs hover:bg-blue-700'
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
          </>
        )}
      </section>
    </div>
  )
}