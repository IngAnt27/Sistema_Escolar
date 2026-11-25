'use client'

import { useEffect, useState } from 'react'
import {
  BellRing,
  ExternalLink,
  Loader2,
  X,
  CheckCircle2,
  AlertCircle,
  Phone,
  MessageCircle,
} from 'lucide-react'
import {
  cerrarAsistenciaYNotificar,
  type AlertaGenerada,
} from '@/app/actions/asistencia'

export function BotonCerrarAsistencia() {
  const [cargando, setCargando] = useState(false)
  const [modalAbierto, setModalAbierto] = useState(false)
  const [esError, setEsError] = useState(false)
  const [mensaje, setMensaje] = useState<string | null>(null)
  const [alertas, setAlertas] = useState<AlertaGenerada[]>([])

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setModalAbierto(false)
    }
    if (modalAbierto) {
      window.addEventListener('keydown', onKeyDown)
      return () => window.removeEventListener('keydown', onKeyDown)
    }
  }, [modalAbierto])

  async function manejarCierre() {
    setCargando(true)
    setMensaje(null)
    setEsError(false)

    const res = await cerrarAsistenciaYNotificar()
    setCargando(false)

    if (res.error) {
      setEsError(true)
      setMensaje(res.error)
      setAlertas([])
      setModalAbierto(true)
      return
    }

    setEsError(false)
    setMensaje(res.mensaje ?? 'Proceso completado.')
    setAlertas(res.alertas ?? [])
    setModalAbierto(true)
  }

  return (
    <>
      <button
        type="button"
        onClick={manejarCierre}
        disabled={cargando}
        className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-amber-600/25 transition hover:from-amber-600 hover:to-orange-700 active:scale-[0.98] disabled:opacity-60 sm:w-auto"
      >
        {cargando ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Procesando cierre...</span>
          </>
        ) : (
          <>
            <BellRing className="h-4 w-4" />
            <span>Cerrar asistencia y notificar</span>
          </>
        )}
      </button>

      {/* Modal de resultados y notificaciones */}
      {modalAbierto && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/60 p-0 sm:items-center sm:p-4"
          onClick={() => setModalAbierto(false)}
        >
          <div
            className="flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-3xl border border-slate-200 bg-[#F1F5F9] shadow-2xl sm:rounded-3xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Cabecera KORA */}
            <div className="flex items-center justify-between gap-3 bg-[#0f172a] px-5 py-4 text-white sm:px-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-amber-500 text-white shadow-md shadow-amber-500/30">
                  <BellRing className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold sm:text-lg">
                    Cierre de Asistencia
                  </h2>
                  <p className="text-xs text-slate-400">
                    Resumen de alertas y notificaciones a encargados
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setModalAbierto(false)}
                className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-800 hover:text-white"
                aria-label="Cerrar resumen"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Contenido con scroll */}
            <div className="flex-1 space-y-4 overflow-y-auto p-5 sm:p-6">
              {/* Banner de estado */}
              {mensaje && (
                <div
                  className={`flex items-start gap-2.5 rounded-2xl border px-4 py-3.5 text-sm font-medium ${
                    esError
                      ? 'border-red-200 bg-red-50 text-red-700'
                      : 'border-emerald-200 bg-emerald-50 text-emerald-800'
                  }`}
                >
                  {esError ? (
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
                  ) : (
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                  )}
                  <span>{mensaje}</span>
                </div>
              )}

              {/* Lista de ausentes / alertas */}
              {alertas.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Notificaciones generadas
                    </p>
                    <span className="tabular-nums rounded-full bg-slate-200/80 px-2.5 py-0.5 text-xs font-semibold text-slate-700">
                      {alertas.length}{' '}
                      {alertas.length === 1 ? 'ausente' : 'ausentes'}
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    {alertas.map((a, i) => (
                      <div
                        key={i}
                        className="flex flex-col justify-between gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs sm:flex-row sm:items-center"
                      >
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-sm font-bold text-slate-900">
                              {a.estudiante}
                            </p>
                            <span
                              className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                                a.estado === 'enviado'
                                  ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/70'
                                  : 'bg-amber-50 text-amber-700 ring-1 ring-amber-200/70'
                              }`}
                            >
                              {a.estado === 'enviado'
                                ? 'Enviado automático'
                                : 'Pendiente (API)'}
                            </span>
                          </div>
                          <p className="tabular-nums flex items-center gap-1.5 text-xs text-slate-500">
                            <Phone className="h-3.5 w-3.5 text-slate-400" />
                            <span>{a.telefono}</span>
                          </p>
                        </div>

                        <a
                          href={a.enlaceWaMe}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white shadow-xs transition hover:bg-emerald-700"
                        >
                          <MessageCircle className="h-3.5 w-3.5" />
                          <span>Abrir WhatsApp</span>
                          <ExternalLink className="h-3 w-3 opacity-80" />
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Pie del modal */}
            <div className="flex justify-end border-t border-slate-200/80 bg-white px-5 py-3.5 sm:px-6">
              <button
                type="button"
                onClick={() => setModalAbierto(false)}
                className="rounded-xl bg-[#0f172a] px-5 py-2 text-xs font-semibold text-white transition hover:bg-slate-800"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}