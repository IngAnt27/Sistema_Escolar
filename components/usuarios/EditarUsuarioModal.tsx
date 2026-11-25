'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Pencil,
  X,
  User,
  Mail,
  Shield,
  BookOpen,
  Camera,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { actualizarUsuario } from '@/app/actions/usuarios'

export interface UsuarioEditable {
  id: string
  nombre_completo?: string | null
  email?: string | null
  rol: 'director' | 'docente' | string
  curso?: string | null
  foto_url?: string | null
}

export function EditarUsuarioModal({ usuario }: { usuario: UsuarioEditable }) {
  const router = useRouter()
  const inputFotoRef = useRef<HTMLInputElement>(null)

  const [abierto, setAbierto] = useState(false)
  const [cargando, setCargando] = useState(false)
  const [mensaje, setMensaje] = useState<{
    tipo: 'ok' | 'error'
    texto: string
  } | null>(null)

  const [nombreCompleto, setNombreCompleto] = useState(
    usuario.nombre_completo ?? ''
  )
  const [email, setEmail] = useState(usuario.email ?? '')
  const [curso, setCurso] = useState(usuario.curso ?? '')
  const [rol, setRol] = useState<'docente' | 'director'>(
    usuario.rol === 'director' ? 'director' : 'docente'
  )

  const [archivoFoto, setArchivoFoto] = useState<File | null>(null)
  const [previewFoto, setPreviewFoto] = useState<string | null>(
    usuario.foto_url ?? null
  )

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setAbierto(false)
    }
    if (abierto) {
      window.addEventListener('keydown', onKeyDown)
      return () => window.removeEventListener('keydown', onKeyDown)
    }
  }, [abierto])

  function abrirModal() {
    setNombreCompleto(usuario.nombre_completo ?? '')
    setEmail(usuario.email ?? '')
    setCurso(usuario.curso ?? '')
    setRol(usuario.rol === 'director' ? 'director' : 'docente')
    setArchivoFoto(null)
    setPreviewFoto(usuario.foto_url ?? null)
    setMensaje(null)
    setAbierto(true)
  }

  function manejarCambioFoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setMensaje({ tipo: 'error', texto: 'Selecciona una imagen válida.' })
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      setMensaje({ tipo: 'error', texto: 'La foto no debe superar los 2 MB.' })
      return
    }

    setMensaje(null)
    setArchivoFoto(file)
    setPreviewFoto(URL.createObjectURL(file))
  }

  async function manejarEnvio(e: React.FormEvent) {
    e.preventDefault()
    setCargando(true)
    setMensaje(null)

    let fotoUrlFinal: string | null = usuario.foto_url ?? null

    if (archivoFoto) {
      const supabase = createClient()
      const extension = archivoFoto.name.split('.').pop()?.toLowerCase() || 'jpg'
      const rutaArchivo = `perfiles/${usuario.id}-${Date.now()}.${extension}`

      const { error: errorSubida } = await supabase.storage
        .from('fotos-estudiantes')
        .upload(rutaArchivo, archivoFoto, { upsert: true })

      if (errorSubida) {
        setCargando(false)
        setMensaje({
          tipo: 'error',
          texto: 'No se pudo subir la fotografía a Supabase Storage.',
        })
        return
      }

      const { data: urlData } = supabase.storage
        .from('fotos-estudiantes')
        .getPublicUrl(rutaArchivo)

      fotoUrlFinal = urlData.publicUrl
    }

    const res = await actualizarUsuario({
      id: usuario.id,
      nombre_completo: nombreCompleto,
      email,
      rol,
      curso: curso.trim() || null,
      foto_url: fotoUrlFinal,
    })

    setCargando(false)

    if (res.error) {
      setMensaje({ tipo: 'error', texto: res.error })
      return
    }

    setMensaje({ tipo: 'ok', texto: 'Información actualizada correctamente.' })
    router.refresh()
  }

  return (
    <>
      <button
        type="button"
        onClick={abrirModal}
        className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs transition hover:border-blue-600 hover:bg-blue-50/50 hover:text-blue-700"
      >
        <Pencil className="h-3.5 w-3.5" />
        <span>Editar</span>
      </button>

      {abierto && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/60 p-0 sm:items-center sm:p-4"
          onClick={() => setAbierto(false)}
        >
          <div
            className="flex max-h-[90vh] w-full max-w-xl flex-col overflow-hidden rounded-t-3xl border border-slate-200 bg-[#F1F5F9] shadow-2xl sm:rounded-3xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Cabecera KORA */}
            <div className="flex items-center justify-between gap-3 bg-[#0f172a] px-5 py-4 text-white sm:px-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-md shadow-blue-600/30">
                  <Pencil className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold sm:text-lg">
                    Editar usuario
                  </h2>
                  <p className="text-xs text-slate-400">
                    Actualiza foto, curso asignado o credenciales
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setAbierto(false)}
                className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-800 hover:text-white"
                aria-label="Cerrar modal"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Formulario */}
            <form
              onSubmit={manejarEnvio}
              className="flex-1 space-y-5 overflow-y-auto p-5 sm:p-6"
            >
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

              <div className="space-y-4 rounded-3xl border border-slate-200/80 bg-white p-5 shadow-xs">
                {/* Foto del docente */}
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 p-3.5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[#0f172a] text-blue-400">
                      {previewFoto ? (
                        <img
                          src={previewFoto}
                          alt={nombreCompleto}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <Camera className="h-5 w-5" />
                      )}
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-700">
                        Fotografía
                      </p>
                      <p className="text-xs text-slate-500">
                        JPG o PNG (máx. 2 MB)
                      </p>
                    </div>
                  </div>

                  <input
                    ref={inputFotoRef}
                    type="file"
                    accept="image/*"
                    onChange={manejarCambioFoto}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => inputFotoRef.current?.click()}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-xs ring-1 ring-slate-200 transition hover:bg-slate-100"
                  >
                    <Camera className="h-3.5 w-3.5 text-blue-600" />
                    <span>{previewFoto ? 'Cambiar foto' : 'Subir foto'}</span>
                  </button>
                </div>

                {/* Nombre */}
                <div>
                  <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Nombre completo
                  </label>
                  <div className="relative">
                    <User className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      required
                      value={nombreCompleto}
                      onChange={(e) => setNombreCompleto(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/70 py-2.5 pl-10 pr-3.5 text-sm text-slate-900 outline-none transition focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-600/10"
                    />
                  </div>
                </div>

                {/* Correo */}
                <div>
                  <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Correo electrónico
                  </label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/70 py-2.5 pl-10 pr-3.5 text-sm text-slate-900 outline-none transition focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-600/10"
                    />
                  </div>
                </div>

                {/* Curso y Rol */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      Curso que imparte
                    </label>
                    <div className="relative">
                      <BookOpen className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <input
                        value={curso}
                        onChange={(e) => setCurso(e.target.value)}
                        placeholder="Ej. Música / Computación"
                        className="w-full rounded-xl border border-slate-200 bg-slate-50/70 py-2.5 pl-10 pr-3.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-600/10"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      Rol en el sistema
                    </label>
                    <div className="relative">
                      <Shield className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <select
                        value={rol}
                        onChange={(e) =>
                          setRol(e.target.value as 'docente' | 'director')
                        }
                        className="w-full rounded-xl border border-slate-200 bg-slate-50/70 py-2.5 pl-10 pr-3.5 text-sm font-medium text-slate-900 outline-none transition focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-600/10"
                      >
                        <option value="docente">Docente</option>
                        <option value="director">Director</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col-reverse gap-2.5 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setAbierto(false)}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                >
                  Cerrar
                </button>
                <button
                  type="submit"
                  disabled={cargando}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/25 transition hover:from-blue-700 hover:to-blue-800 disabled:opacity-60"
                >
                  {cargando ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Guardando...</span>
                    </>
                  ) : (
                    <span>Guardar cambios</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}