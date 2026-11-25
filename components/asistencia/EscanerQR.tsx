'use client'

import { useEffect, useRef, useState } from 'react'
import { Html5Qrcode } from 'html5-qrcode'
import {
  Camera,
  CameraOff,
  CheckCircle2,
  AlertCircle,
  Clock,
  QrCode,
  Hash,
  Loader2,
} from 'lucide-react'
import { registrarAsistenciaQR } from '@/app/actions/asistencia'

export function EscanerQR() {
  const [camaraActiva, setCamaraActiva] = useState(false)
  const [codigoManual, setCodigoManual] = useState('')
  const [procesando, setProcesando] = useState(false)
  const [resultado, setResultado] = useState<{
    tipo: 'ok' | 'duplicado' | 'error'
    texto: string
  } | null>(null)

  const scannerRef = useRef<Html5Qrcode | null>(null)
  const ultimoEscaneoRef = useRef<{ codigo: string; tiempo: number }>({
    codigo: '',
    tiempo: 0,
  })

  function emitirPitido() {
    try {
      const ctx = new AudioContext()
      const osc = ctx.createOscillator()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(880, ctx.currentTime)
      osc.connect(ctx.destination)
      osc.start()
      osc.stop(ctx.currentTime + 0.12)
    } catch {
      // Ignorar si el navegador bloquea audio
    }
  }

  async function procesarCodigo(codigo: string) {
    const ahora = Date.now()
    if (
      ultimoEscaneoRef.current.codigo === codigo &&
      ahora - ultimoEscaneoRef.current.tiempo < 3000
    ) {
      return
    }
    ultimoEscaneoRef.current = { codigo, tiempo: ahora }

    setProcesando(true)
    const res = await registrarAsistenciaQR(codigo)
    setProcesando(false)

    if (res.error) {
      setResultado({ tipo: 'error', texto: res.error })
    } else if (res.duplicado) {
      setResultado({ tipo: 'duplicado', texto: res.mensaje! })
    } else if (res.ok) {
      emitirPitido()
      setResultado({
        tipo: 'ok',
        texto: `${res.estudiante} (${res.grado}) — ${res.estado.toUpperCase()} a las ${res.hora}`,
      })
    }
  }

  async function iniciarCamara() {
    setResultado(null)
    try {
      const html5QrCode = new Html5Qrcode('lector-qr')
      scannerRef.current = html5QrCode
      await html5QrCode.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 240, height: 240 } },
        (textoDecodificado) => {
          procesarCodigo(textoDecodificado)
        },
        () => {}
      )
      setCamaraActiva(true)
    } catch {
      setResultado({
        tipo: 'error',
        texto:
          'No se pudo acceder a la cámara. Verifica los permisos del navegador.',
      })
    }
  }

  async function detenerCamara() {
    if (scannerRef.current) {
      await scannerRef.current.stop()
      scannerRef.current.clear()
      scannerRef.current = null
    }
    setCamaraActiva(false)
  }

  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {})
      }
    }
  }, [])

  async function manejarManual(e: React.FormEvent) {
    e.preventDefault()
    if (!codigoManual.trim()) return
    await procesarCodigo(codigoManual.trim())
    setCodigoManual('')
  }

  return (
    <section className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-xs">
      {/* Cabecera estilo KORA */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#0f172a] px-5 py-4 text-white sm:px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-md shadow-blue-600/30">
            <QrCode className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold leading-tight">
                Escáner QR
              </h2>
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                  camaraActiva
                    ? 'bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-400/30'
                    : 'bg-white/10 text-slate-300'
                }`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    camaraActiva ? 'animate-pulse bg-emerald-400' : 'bg-slate-400'
                  }`}
                />
                {camaraActiva ? 'Activo' : 'En espera'}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Acerca el carnet del estudiante a la cámara
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={camaraActiva ? detenerCamara : iniciarCamara}
          className={`inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold text-white shadow-md transition active:scale-[0.98] sm:w-auto ${
            camaraActiva
              ? 'bg-red-600 shadow-red-600/25 hover:bg-red-700'
              : 'bg-blue-600 shadow-blue-600/25 hover:bg-blue-700'
          }`}
        >
          {camaraActiva ? (
            <>
              <CameraOff className="h-4 w-4" />
              <span>Detener cámara</span>
            </>
          ) : (
            <>
              <Camera className="h-4 w-4" />
              <span>Activar cámara</span>
            </>
          )}
        </button>
      </div>

      {/* Cuerpo del escáner */}
      <div className="space-y-4 p-5 sm:p-6">
        {/* Visor de cámara */}
        <div className="relative overflow-hidden rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50">
          <div id="lector-qr" className="min-h-[260px] w-full" />

          {!camaraActiva && (
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
              <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-slate-400 shadow-xs ring-1 ring-slate-200/80">
                <Camera className="h-6 w-6" />
              </div>
              <p className="text-sm font-semibold text-slate-700">
                Cámara desactivada
              </p>
              <p className="mt-1 max-w-[230px] text-xs text-slate-500">
                Presiona &ldquo;Activar cámara&rdquo; para escanear carnets o
                usa el registro manual abajo.
              </p>
            </div>
          )}
        </div>

        {/* Feedback del último escaneo */}
        {resultado && (
          <div
            className={`flex items-start gap-2.5 rounded-2xl border px-4 py-3 text-sm font-medium ${
              resultado.tipo === 'ok'
                ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                : resultado.tipo === 'duplicado'
                  ? 'border-amber-200 bg-amber-50 text-amber-800'
                  : 'border-red-200 bg-red-50 text-red-700'
            }`}
          >
            {resultado.tipo === 'ok' && (
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
            )}
            {resultado.tipo === 'duplicado' && (
              <Clock className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
            )}
            {resultado.tipo === 'error' && (
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
            )}
            <span>{resultado.texto}</span>
          </div>
        )}

        {/* Respaldo manual / lector USB */}
        <form
          onSubmit={manejarManual}
          className="space-y-2 border-t border-slate-100 pt-4"
        >
          <label
            htmlFor="codigo-manual-qr"
            className="block text-[11px] font-bold uppercase tracking-wider text-slate-500"
          >
            Registro manual o lector USB
          </label>
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="relative flex-1">
              <Hash className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                id="codigo-manual-qr"
                value={codigoManual}
                onChange={(e) => setCodigoManual(e.target.value)}
                placeholder="Código personal (ej. A123BCD)"
                className="tabular-nums w-full rounded-xl border border-slate-200 bg-slate-50/70 py-2.5 pl-10 pr-3.5 font-mono text-sm font-semibold text-slate-900 outline-none transition placeholder:font-sans placeholder:font-normal placeholder:text-slate-400 focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-600/10"
              />
            </div>

            <button
              type="submit"
              disabled={procesando}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#0f172a] px-5 py-2.5 text-xs font-semibold text-white shadow-xs transition hover:bg-slate-800 active:scale-[0.98] disabled:opacity-50"
            >
              {procesando ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Registrando...</span>
                </>
              ) : (
                <span>Registrar</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </section>
  )
}