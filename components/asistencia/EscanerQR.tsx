'use client'

import { useEffect, useRef, useState } from 'react'
import { Html5Qrcode } from 'html5-qrcode'
import { Camera, CameraOff, CheckCircle2, AlertCircle, Clock } from 'lucide-react'
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
  const ultimoEscaneoRef = useRef<{ codigo: string; tiempo: number }>({ codigo: '', tiempo: 0 })

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
    // Evitar lecturas repetidas del mismo QR en menos de 3 segundos
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
        texto: 'No se pudo acceder a la cámara. Verifica los permisos del navegador.',
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
    await procesarCodigo(codigoManual)
    setCodigoManual('')
  }

  return (
    <div className="rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-xs">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-slate-900">Escáner de Asistencia QR</h2>
          <p className="text-xs text-slate-500">Acerca el carnet del estudiante a la cámara</p>
        </div>

        <button
          type="button"
          onClick={camaraActiva ? detenerCamara : iniciarCamara}
          className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold text-white transition ${
            camaraActiva
              ? 'bg-red-600 hover:bg-red-700'
              : 'bg-[#2563EB] hover:bg-[#1D4ED8]'
          }`}
        >
          {camaraActiva ? (
            <>
              <CameraOff className="h-4 w-4" /> Detener cámara
            </>
          ) : (
            <>
              <Camera className="h-4 w-4" /> Activar cámara
            </>
          )}
        </button>
      </div>

      {/* Visor de cámara */}
      <div
        id="lector-qr"
        className="mx-auto mb-4 min-h-[260px] w-full max-w-md overflow-hidden rounded-xl border border-dashed border-slate-300 bg-slate-50"
      />

      {/* Feedback del último escaneo */}
      {resultado && (
        <div
          className={`mb-4 flex items-center gap-2.5 rounded-xl px-4 py-3 text-sm font-medium ${
            resultado.tipo === 'ok'
              ? 'bg-emerald-50 text-emerald-800'
              : resultado.tipo === 'duplicado'
              ? 'bg-amber-50 text-amber-800'
              : 'bg-red-50 text-red-800'
          }`}
        >
          {resultado.tipo === 'ok' && <CheckCircle2 className="h-5 w-5 shrink-0" />}
          {resultado.tipo === 'duplicado' && <Clock className="h-5 w-5 shrink-0" />}
          {resultado.tipo === 'error' && <AlertCircle className="h-5 w-5 shrink-0" />}
          <span>{resultado.texto}</span>
        </div>
      )}

      {/* Respaldo manual / lector USB */}
      <form onSubmit={manejarManual} className="flex gap-2 border-t border-[#E2E8F0] pt-4">
        <input
          value={codigoManual}
          onChange={(e) => setCodigoManual(e.target.value)}
          placeholder="O ingresa el código personal manualmente (ej. 07013)"
          className="tabular-nums flex-1 rounded-lg border border-[#E2E8F0] px-3 py-2 text-sm outline-none focus:border-[#2563EB]"
        />
        <button
          type="submit"
          disabled={procesando}
          className="rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
        >
          Registrar
        </button>
      </form>
    </div>
  )
}