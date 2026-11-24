'use client'

import { useState } from 'react'
import { BellRing, ExternalLink, Loader2 } from 'lucide-react'
import { cerrarAsistenciaYNotificar, type AlertaGenerada } from '@/app/actions/asistencia'

export function BotonCerrarAsistencia() {
  const [cargando, setCargando] = useState(false)
  const [mensaje, setMensaje] = useState<string | null>(null)
  const [alertas, setAlertas] = useState<AlertaGenerada[]>([])

  async function manejarCierre() {
    setCargando(true)
    setMensaje(null)
    const res = await cerrarAsistenciaYNotificar()
    setCargando(false)

    if (res.error) {
      setMensaje(res.error)
      return
    }

    setMensaje(res.mensaje ?? 'Proceso completado.')
    setAlertas(res.alertas ?? [])
  }

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={manejarCierre}
        disabled={cargando}
        className="inline-flex items-center gap-2 rounded-lg bg-amber-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-amber-700 disabled:opacity-50"
      >
        {cargando ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <BellRing className="h-4 w-4" />
        )}
        Cerrar asistencia y notificar ausentes
      </button>

      {mensaje && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900">
          <p className="font-semibold">{mensaje}</p>
          {alertas.length > 0 && (
            <ul className="mt-2 space-y-1.5">
              {alertas.map((a, i) => (
                <li key={i} className="flex items-center justify-between gap-2">
                  <span>
                    {a.estudiante} ({a.telefono}) —{' '}
                    <strong>{a.estado === 'enviado' ? 'Enviado automático' : 'Pendiente (API)'}</strong>
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
    </div>
  )
}