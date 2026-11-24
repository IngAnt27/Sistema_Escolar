'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { UserPlus, CheckCircle2, AlertCircle } from 'lucide-react'
import { crearEstudiante } from '@/app/actions/estudiantes'

export function FormularioEstudiante() {
  const router = useRouter()
  const [cargando, setCargando] = useState(false)
  const [mensaje, setMensaje] = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(null)

  async function manejarEnvio(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setCargando(true)
    setMensaje(null)

    const form = e.currentTarget
    const formData = new FormData(form)

    const resultado = await crearEstudiante({
      codigo_personal: String(formData.get('codigo_personal') || ''),
      nombres: String(formData.get('nombres') || ''),
      apellidos: String(formData.get('apellidos') || ''),
      grado: String(formData.get('grado') || ''),
      telefono_encargado: String(formData.get('telefono_encargado') || ''),
    })

    setCargando(false)

    if (resultado?.error) {
      setMensaje({ tipo: 'error', texto: resultado.error })
      return
    }

    setMensaje({ tipo: 'ok', texto: 'Estudiante inscrito correctamente.' })
    form.reset()
    router.refresh()
  }

  return (
    <div className="rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-xs">
      <div className="mb-4 flex items-center gap-2.5">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-[#2563EB]">
          <UserPlus className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-base font-semibold text-slate-900">Nuevo estudiante</h2>
          <p className="text-xs text-slate-500">Registro validado con auditoría automática</p>
        </div>
      </div>

      {mensaje && (
        <div
          className={`mb-4 flex items-center gap-2 rounded-lg px-3.5 py-2.5 text-sm font-medium ${
            mensaje.tipo === 'ok'
              ? 'bg-emerald-50 text-emerald-800'
              : 'bg-red-50 text-red-800'
          }`}
        >
          {mensaje.tipo === 'ok' ? (
            <CheckCircle2 className="h-4 w-4 shrink-0" />
          ) : (
            <AlertCircle className="h-4 w-4 shrink-0" />
          )}
          <span>{mensaje.texto}</span>
        </div>
      )}

      <form onSubmit={manejarEnvio} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-700">
            Código personal
          </label>
          <input
            name="codigo_personal"
            required
            placeholder="A123BCD"
            className="tabular-nums w-full rounded-lg border border-[#E2E8F0] px-3 py-2 text-sm outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-blue-100"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-slate-700">Nombres</label>
          <input
            name="nombres"
            required
            placeholder="María José"
            className="w-full rounded-lg border border-[#E2E8F0] px-3 py-2 text-sm outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-blue-100"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-slate-700">Apellidos</label>
          <input
            name="apellidos"
            required
            placeholder="López García"
            className="w-full rounded-lg border border-[#E2E8F0] px-3 py-2 text-sm outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-blue-100"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-slate-700">Grado</label>
          <input
            name="grado"
            required
            placeholder="5to Administración"
            className="w-full rounded-lg border border-[#E2E8F0] px-3 py-2 text-sm outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-blue-100"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-slate-700">
            Tel. Encargado (+502)
          </label>
          <input
            name="telefono_encargado"
            required
            placeholder="+50255551234"
            className="tabular-nums w-full rounded-lg border border-[#E2E8F0] px-3 py-2 text-sm outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-blue-100"
          />
        </div>

        <div className="sm:col-span-2 lg:col-span-5 flex justify-end">
          <button
            type="submit"
            disabled={cargando}
            className="rounded-lg bg-[#2563EB] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#1D4ED8] disabled:opacity-60"
          >
            {cargando ? 'Guardando...' : 'Inscribir estudiante'}
          </button>
        </div>
      </form>
    </div>
  )
}