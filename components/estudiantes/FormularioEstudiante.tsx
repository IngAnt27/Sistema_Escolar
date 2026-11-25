'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  CheckCircle2,
  AlertCircle,
  Hash,
  User,
  BookOpen,
  Phone,
  GraduationCap,
  Loader2,
  RotateCcw,
  Camera,
  SwitchCamera,
  Upload,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { crearEstudiante } from '@/app/actions/estudiantes'

function obtenerExtensionArchivo(archivo: Blob | File): string {
  if ('name' in archivo && typeof archivo.name === 'string') {
    const partes = archivo.name.split('.')
    if (partes.length > 1) {
      const ext = partes[partes.length - 1]?.trim().toLowerCase()
      if (ext) return ext
    }
  }

  if (archivo.type) {
    const subtipo = archivo.type.split('/')[1]?.trim().toLowerCase()
    if (subtipo) {
      return subtipo === 'jpeg' ? 'jpg' : subtipo
    }
  }

  return 'jpg'
}

export function FormularioEstudiante() {
  const router = useRouter()
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [cargando, setCargando] = useState(false)
  const [mensaje, setMensaje] = useState<{
    tipo: 'ok' | 'error'
    texto: string
  } | null>(null)

  const [codigoPersonal, setCodigoPersonal] = useState('')
  const [nombres, setNombres] = useState('')
  const [apellidos, setApellidos] = useState('')
  const [grado, setGrado] = useState('')
  const [telefonoEncargado, setTelefonoEncargado] = useState('')

  const [camaraActiva, setCamaraActiva] = useState(false)
  const [errorCamara, setErrorCamara] = useState<string | null>(null)
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user')
  const [reinicioCamara, setReinicioCamara] = useState(0)
  const [fotoRespaldoUrl, setFotoRespaldoUrl] = useState<string | null>(null)
  const [fotoRespaldoFile, setFotoRespaldoFile] = useState<File | null>(null)

  const iniciales =
    `${nombres.trim()[0] ?? ''}${apellidos.trim()[0] ?? ''}`.toUpperCase() ||
    'ES'

  const nombreCompleto =
    `${nombres.trim()} ${apellidos.trim()}`.trim() || 'Nombre del Estudiante'

  useEffect(() => {
    let cancelado = false

    async function abrirCamara() {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
        streamRef.current = null
      }

      if (!navigator.mediaDevices?.getUserMedia) {
        if (!cancelado) {
          setCamaraActiva(false)
          setErrorCamara('Tu navegador no soporta cámara directa.')
        }
        return
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: facingMode },
            width: { ideal: 640 },
            height: { ideal: 640 },
          },
          audio: false,
        })

        if (cancelado) {
          stream.getTracks().forEach((track) => track.stop())
          return
        }

        streamRef.current = stream
        setErrorCamara(null)
        setCamaraActiva(true)

        if (videoRef.current) {
          videoRef.current.srcObject = stream
          await videoRef.current.play()
        }
      } catch {
        if (!cancelado) {
          setCamaraActiva(false)
          setErrorCamara(
            'No se pudo acceder a la cámara. Revisa permisos o usa subir archivo.'
          )
        }
      }
    }

    void abrirCamara()

    return () => {
      cancelado = true
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
        streamRef.current = null
      }
    }
  }, [facingMode, reinicioCamara])

  function detenerCamaraActual() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
    setCamaraActiva(false)
  }

  function alternarCamara() {
    setFotoRespaldoUrl(null)
    setFotoRespaldoFile(null)
    setFacingMode((prev) => (prev === 'user' ? 'environment' : 'user'))
  }

  function manejarArchivoRespaldo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setMensaje({ tipo: 'error', texto: 'Selecciona una imagen válida.' })
      return
    }

    if (file.size > 2 * 1024 * 1024) {
      setMensaje({ tipo: 'error', texto: 'La imagen no debe superar 2 MB.' })
      return
    }

    setMensaje(null)
    if (fotoRespaldoUrl) URL.revokeObjectURL(fotoRespaldoUrl)
    setFotoRespaldoFile(file)
    setFotoRespaldoUrl(URL.createObjectURL(file))
    detenerCamaraActual()
  }

  function limpiarFormulario() {
    setCodigoPersonal('')
    setNombres('')
    setApellidos('')
    setGrado('')
    setTelefonoEncargado('')
    if (fotoRespaldoUrl) URL.revokeObjectURL(fotoRespaldoUrl)
    setFotoRespaldoUrl(null)
    setFotoRespaldoFile(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
    setMensaje(null)
    setReinicioCamara((n) => n + 1)
  }

  // Captura automáticamente el fotograma actual del video al guardar
  function capturarFotoDesdeCamara(): Promise<Blob | null> {
    return new Promise((resolve) => {
      const video = videoRef.current
      const canvas = canvasRef.current

      if (!video || !canvas || !camaraActiva || video.readyState < 2) {
        resolve(null)
        return
      }

      const size = 480
      canvas.width = size
      canvas.height = size

      const ctx = canvas.getContext('2d')
      if (!ctx) {
        resolve(null)
        return
      }

      const vw = video.videoWidth || size
      const vh = video.videoHeight || size
      const lado = Math.min(vw, vh)
      const sx = (vw - lado) / 2
      const sy = (vh - lado) / 2

      // Efecto espejo natural en cámara frontal
      if (facingMode === 'user') {
        ctx.translate(size, 0)
        ctx.scale(-1, 1)
      }

      ctx.drawImage(video, sx, sy, lado, lado, 0, 0, size, size)

      canvas.toBlob(
        (blob) => {
          resolve(blob)
        },
        'image/jpeg',
        0.86
      )
    })
  }

  async function manejarEnvio(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setCargando(true)
    setMensaje(null)

    let fotoUrl: string | null = null
    let archivoParaSubir: Blob | File | null = fotoRespaldoFile

    if (!archivoParaSubir && camaraActiva) {
      archivoParaSubir = await capturarFotoDesdeCamara()
    }

    if (archivoParaSubir) {
      const supabase = createClient()
      const extension = obtenerExtensionArchivo(archivoParaSubir)
      const nombreArchivo = `${codigoPersonal.trim() || 'est'}-${Date.now()}.${extension}`
      const tipoContenido = archivoParaSubir.type || 'image/jpeg'

      const { error: errorSubida } = await supabase.storage
        .from('fotos-estudiantes')
        .upload(nombreArchivo, archivoParaSubir, {
          contentType: tipoContenido,
          upsert: true,
        })

      if (errorSubida) {
        setCargando(false)
        setMensaje({
          tipo: 'error',
          texto:
            'No se pudo guardar la foto en Supabase Storage. Revisa el bucket fotos-estudiantes.',
        })
        return
      }

      const { data: urlData } = supabase.storage
        .from('fotos-estudiantes')
        .getPublicUrl(nombreArchivo)

      fotoUrl = urlData.publicUrl
    }

    const resultado = await crearEstudiante({
      codigo_personal: codigoPersonal.trim(),
      nombres: nombres.trim(),
      apellidos: apellidos.trim(),
      grado: grado.trim(),
      telefono_encargado: telefonoEncargado.trim(),
      foto_url: fotoUrl,
    })

    setCargando(false)

    if (resultado?.error) {
      setMensaje({ tipo: 'error', texto: resultado.error })
      return
    }

    limpiarFormulario()
    setMensaje({
      tipo: 'ok',
      texto: 'Estudiante inscrito y fotografía guardada correctamente.',
    })
    router.refresh()
  }

  return (
    <form onSubmit={manejarEnvio} className="space-y-5">
      {/* Canvas oculto para capturar la foto al enviar */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Alerta */}
      {mensaje && (
        <div
          className={`flex items-center gap-2.5 rounded-2xl border px-4 py-3 text-sm font-medium ${
            mensaje.tipo === 'ok'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
              : 'border-red-200 bg-red-50 text-red-700'
          }`}
        >
          {mensaje.tipo === 'ok' ? (
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
          ) : (
            <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
          )}
          <span>{mensaje.texto}</span>
        </div>
      )}

      {/* Vista dividida */}
      <div className="grid gap-6 lg:grid-cols-12 lg:items-stretch">
        {/* Columna izquierda: Datos del estudiante */}
        <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-xs sm:p-6 lg:col-span-7">
          <div className="space-y-4">
            {/* Estado de cámara + respaldo opcional */}
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200/80 bg-slate-50/80 p-3.5">
              <div className="flex items-center gap-2.5">
                <span
                  className={`h-2.5 w-2.5 rounded-full ${
                    camaraActiva
                      ? 'bg-emerald-500'
                      : fotoRespaldoUrl
                        ? 'bg-blue-600'
                        : 'bg-slate-400'
                  }`}
                />
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    {camaraActiva
                      ? 'Cámara lista · Se capturará al guardar'
                      : fotoRespaldoUrl
                        ? 'Imagen seleccionada para guardar'
                        : 'Cámara inactiva'}
                  </p>
                  {errorCamara && (
                    <p className="text-xs text-amber-700">{errorCamara}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={alternarCamara}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs ring-1 ring-slate-200 transition hover:bg-slate-100"
                >
                  <SwitchCamera className="h-3.5 w-3.5 text-blue-600" />
                  <span>Cambiar cámara</span>
                </button>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={manejarArchivoRespaldo}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-2xs ring-1 ring-slate-200 transition hover:bg-slate-100"
                >
                  <Upload className="h-3.5 w-3.5 text-slate-500" />
                  <span>Archivo</span>
                </button>
              </div>
            </div>

            {/* Código personal */}
            <div>
              <label
                htmlFor="codigo_personal"
                className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500"
              >
                Código personal
              </label>
              <div className="relative">
                <Hash className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  id="codigo_personal"
                  name="codigo_personal"
                  required
                  value={codigoPersonal}
                  onChange={(e) => setCodigoPersonal(e.target.value)}
                  placeholder="A123BCD"
                  className="tabular-nums w-full rounded-xl border border-slate-200 bg-slate-50/70 py-2.5 pl-10 pr-3.5 font-mono text-sm font-semibold text-slate-900 outline-none transition placeholder:font-sans placeholder:font-normal placeholder:text-slate-400 focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-600/10"
                />
              </div>
            </div>

            {/* Nombres y Apellidos */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="nombres"
                  className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500"
                >
                  Nombres
                </label>
                <div className="relative">
                  <User className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    id="nombres"
                    name="nombres"
                    required
                    value={nombres}
                    onChange={(e) => setNombres(e.target.value)}
                    placeholder="María José"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/70 py-2.5 pl-10 pr-3.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-600/10"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="apellidos"
                  className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500"
                >
                  Apellidos
                </label>
                <div className="relative">
                  <User className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    id="apellidos"
                    name="apellidos"
                    required
                    value={apellidos}
                    onChange={(e) => setApellidos(e.target.value)}
                    placeholder="López García"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/70 py-2.5 pl-10 pr-3.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-600/10"
                  />
                </div>
              </div>
            </div>

            {/* Grado */}
            <div>
              <label
                htmlFor="grado"
                className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500"
              >
                Grado
              </label>
              <div className="relative">
                <BookOpen className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  id="grado"
                  name="grado"
                  required
                  value={grado}
                  onChange={(e) => setGrado(e.target.value)}
                  placeholder="5to Administración"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/70 py-2.5 pl-10 pr-3.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-600/10"
                />
              </div>
            </div>

            {/* Teléfono encargado */}
            <div>
              <label
                htmlFor="telefono_encargado"
                className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500"
              >
                Tel. Encargado (+502)
              </label>
              <div className="relative">
                <Phone className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  id="telefono_encargado"
                  name="telefono_encargado"
                  required
                  value={telefonoEncargado}
                  onChange={(e) => setTelefonoEncargado(e.target.value)}
                  placeholder="+50255551234"
                  className="tabular-nums w-full rounded-xl border border-slate-200 bg-slate-50/70 py-2.5 pl-10 pr-3.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-600/10"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Columna derecha: Carnet en vivo con cámara */}
        <div className="flex flex-col lg:col-span-5">
          <p className="mb-2 text-center text-xs font-semibold uppercase tracking-wider text-slate-500">
            Vista previa del carnet
          </p>

          <div className="relative flex flex-1 flex-col items-center justify-between overflow-hidden rounded-3xl border-2 border-blue-500/30 bg-[#0f172a] p-6 text-center text-white shadow-xl shadow-slate-900/20">
            <div className="pointer-events-none absolute -top-16 -right-16 h-36 w-36 rounded-full bg-blue-600/25 blur-2xl" />
            <div className="pointer-events-none absolute -bottom-16 -left-16 h-36 w-36 rounded-full bg-emerald-500/20 blur-2xl" />

            {/* Marca KORA */}
            <div className="relative flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600 text-white shadow-sm shadow-blue-600/40">
                <GraduationCap className="h-4 w-4" />
              </div>
              <span className="text-sm font-black tracking-widest text-white">
                KORA
              </span>
            </div>

            {/* Cámara en vivo / Foto / Iniciales */}
            <div className="relative my-4 flex flex-col items-center">
              <div className="relative flex h-24 w-24 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-blue-500 to-blue-700 text-xl font-extrabold tracking-tight text-white shadow-lg shadow-blue-600/35 ring-4 ring-blue-500/25">
                {fotoRespaldoUrl ? (
                  <img
                    src={fotoRespaldoUrl}
                    alt={nombreCompleto}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <>
                    <video
                      ref={videoRef}
                      playsInline
                      muted
                      autoPlay
                      className={`h-full w-full object-cover ${
                        camaraActiva ? 'block' : 'hidden'
                      } ${facingMode === 'user' ? '-scale-x-100' : ''}`}
                    />
                    {!camaraActiva && <span>{iniciales}</span>}
                  </>
                )}
              </div>

              {camaraActiva && !fotoRespaldoUrl && (
                <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-blue-500/20 px-2.5 py-0.5 text-[10px] font-semibold text-blue-200 ring-1 ring-blue-400/30">
                  <Camera className="h-3 w-3" />
                  En vivo
                </span>
              )}

              <h3 className="mt-3 max-w-[220px] break-words text-base font-bold leading-snug text-white">
                {nombreCompleto}
              </h3>

              <span className="mt-2 inline-flex max-w-[210px] truncate rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-semibold text-emerald-300 ring-1 ring-emerald-400/30">
                {grado.trim() || 'Grado / Sección'}
              </span>

              <p className="tabular-nums mt-2 font-mono text-xs font-semibold tracking-wider text-slate-300">
                {codigoPersonal.trim() || 'A123BCD'}
              </p>
            </div>

            {/* Bloque QR */}
            <div className="relative rounded-2xl bg-white p-2.5 shadow-md">
              <svg
                viewBox="0 0 100 100"
                className="h-20 w-20 text-slate-900"
                aria-hidden="true"
              >
                <rect x="4" y="4" width="28" height="28" rx="4" fill="none" stroke="currentColor" strokeWidth="6" />
                <rect x="13" y="13" width="10" height="10" rx="1.5" fill="currentColor" />
                <rect x="68" y="4" width="28" height="28" rx="4" fill="none" stroke="currentColor" strokeWidth="6" />
                <rect x="77" y="13" width="10" height="10" rx="1.5" fill="currentColor" />
                <rect x="4" y="68" width="28" height="28" rx="4" fill="none" stroke="currentColor" strokeWidth="6" />
                <rect x="13" y="77" width="10" height="10" rx="1.5" fill="currentColor" />
                <rect x="40" y="6" width="8" height="8" fill="currentColor" />
                <rect x="52" y="6" width="8" height="8" fill="currentColor" />
                <rect x="40" y="18" width="8" height="8" fill="currentColor" />
                <rect x="48" y="26" width="12" height="8" fill="currentColor" />
                <rect x="6" y="42" width="12" height="8" fill="currentColor" />
                <rect x="24" y="42" width="8" height="16" fill="currentColor" />
                <rect x="38" y="40" width="14" height="14" rx="2" fill="currentColor" />
                <rect x="58" y="42" width="10" height="8" fill="currentColor" />
                <rect x="74" y="40" width="10" height="10" fill="currentColor" />
                <rect x="88" y="46" width="8" height="12" fill="currentColor" />
                <rect x="6" y="54" width="10" height="8" fill="currentColor" />
                <rect x="42" y="60" width="8" height="12" fill="currentColor" />
                <rect x="56" y="56" width="14" height="10" fill="currentColor" />
                <rect x="74" y="58" width="10" height="14" fill="currentColor" />
                <rect x="42" y="78" width="12" height="10" fill="currentColor" />
                <rect x="60" y="72" width="10" height="10" fill="currentColor" />
                <rect x="76" y="78" width="18" height="8" fill="currentColor" />
                <rect x="60" y="88" width="14" height="8" fill="currentColor" />
                <rect x="82" y="88" width="12" height="8" fill="currentColor" />
              </svg>
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
          <span>Limpiar campos</span>
        </button>

        <button
          type="submit"
          disabled={cargando}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/25 transition hover:from-blue-700 hover:to-blue-800 active:scale-[0.99] disabled:opacity-60"
        >
          {cargando ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Capturando y guardando...</span>
            </>
          ) : (
            <span>Inscribir estudiante</span>
          )}
        </button>
      </div>
    </form>
  )
}