'use client'

import { useState } from 'react'
import { useForm, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  CreditCard,
  CheckCircle2,
  AlertCircle,
  User,
  Tag,
  Calendar,
  Hash,
  Wallet,
  Loader2,
  RotateCcw,
} from 'lucide-react'
import { pagoSchema, type PagoInput } from '@/lib/validations/pagos'
import { registrarPago } from '@/app/actions/pagos'

interface EstudianteOpcion {
  id: string
  nombres: string
  apellidos: string
  grado: string
}

const MESES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
]

export function FormularioPago({
  estudiantes,
  fechaHoy,
}: {
  estudiantes: EstudianteOpcion[]
  fechaHoy: string
}) {
  const [estadoServer, setEstadoServer] = useState<{
    tipo: 'ok' | 'error'
    texto: string
  } | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PagoInput>({
    resolver: zodResolver(pagoSchema) as Resolver<PagoInput>,
    defaultValues: {
      concepto: 'colegiatura',
      metodo_pago: 'efectivo',
      fecha_pago: fechaHoy,
      mes_correspondiente: '',
    },
  })

  function limpiarFormulario() {
    setEstadoServer(null)
    reset({
      estudiante_id: '',
      concepto: 'colegiatura',
      metodo_pago: 'efectivo',
      fecha_pago: fechaHoy,
      numero_recibo: '',
      monto: undefined,
      mes_correspondiente: '',
      observaciones: '',
    })
  }

  async function onSubmit(data: PagoInput) {
    setEstadoServer(null)
    const res = await registrarPago(data)

    if (res.error) {
      setEstadoServer({ tipo: 'error', texto: res.error })
      return
    }

    limpiarFormulario()
    setEstadoServer({ tipo: 'ok', texto: 'Pago registrado correctamente.' })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {/* Alerta de servidor */}
      {estadoServer && (
        <div
          className={`flex items-center gap-2.5 rounded-2xl border px-4 py-3 text-sm font-medium ${
            estadoServer.tipo === 'ok'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
              : 'border-red-200 bg-red-50 text-red-700'
          }`}
        >
          {estadoServer.tipo === 'ok' ? (
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
          ) : (
            <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
          )}
          <span>{estadoServer.texto}</span>
        </div>
      )}

      {/* Bloque 1: Estudiante y Concepto */}
      <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-xs sm:p-6">
        <div className="mb-4 flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
            <User className="h-4 w-4" />
          </div>
          <h3 className="text-sm font-bold text-slate-900">
            Estudiante y Concepto
          </h3>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label
              htmlFor="estudiante_id"
              className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500"
            >
              Estudiante
            </label>
            <select
              id="estudiante_id"
              {...register('estudiante_id')}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3.5 py-2.5 text-sm font-medium text-slate-900 outline-none transition focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-600/10"
            >
              <option value="">Selecciona un estudiante...</option>
              {estudiantes.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.apellidos}, {e.nombres} ({e.grado})
                </option>
              ))}
            </select>
            {errors.estudiante_id && (
              <p className="mt-1.5 text-xs font-medium text-red-600">
                {errors.estudiante_id.message}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="concepto"
              className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500"
            >
              Concepto
            </label>
            <div className="relative">
              <Tag className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <select
                id="concepto"
                {...register('concepto')}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/70 py-2.5 pl-10 pr-3.5 text-sm font-medium text-slate-900 outline-none transition focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-600/10"
              >
                <option value="colegiatura">Colegiatura</option>
                <option value="inscripcion">Inscripción</option>
                <option value="examen">Derecho de examen</option>
                <option value="uniforme">Uniforme</option>
                <option value="otro">Otro</option>
              </select>
            </div>
            {errors.concepto && (
              <p className="mt-1.5 text-xs font-medium text-red-600">
                {errors.concepto.message}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="mes_correspondiente"
              className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500"
            >
              Mes (si aplica)
            </label>
            <div className="relative">
              <Calendar className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <select
                id="mes_correspondiente"
                {...register('mes_correspondiente')}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/70 py-2.5 pl-10 pr-3.5 text-sm font-medium text-slate-900 outline-none transition focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-600/10"
              >
                <option value="">No aplica</option>
                {MESES.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Bloque 2: Detalle del Cobro */}
      <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-xs sm:p-6">
        <div className="mb-4 flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
            <Wallet className="h-4 w-4" />
          </div>
          <h3 className="text-sm font-bold text-slate-900">
            Detalle del Cobro
          </h3>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label
              htmlFor="monto"
              className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500"
            >
              Monto (GTQ)
            </label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-emerald-600">
                Q
              </span>
              <input
                id="monto"
                type="number"
                step="0.01"
                placeholder="0.00"
                {...register('monto')}
                className="tabular-nums w-full rounded-xl border border-slate-200 bg-slate-50/70 py-2.5 pl-9 pr-3.5 text-sm font-bold text-slate-900 outline-none transition placeholder:font-normal placeholder:text-slate-400 focus:border-emerald-600 focus:bg-white focus:ring-4 focus:ring-emerald-600/10"
              />
            </div>
            {errors.monto && (
              <p className="mt-1.5 text-xs font-medium text-red-600">
                {errors.monto.message}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="metodo_pago"
              className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500"
            >
              Método de pago
            </label>
            <div className="relative">
              <CreditCard className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <select
                id="metodo_pago"
                {...register('metodo_pago')}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/70 py-2.5 pl-10 pr-3.5 text-sm font-medium text-slate-900 outline-none transition focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-600/10"
              >
                <option value="efectivo">Efectivo</option>
                <option value="transferencia">Transferencia</option>
                <option value="deposito">Depósito bancario</option>
                <option value="tarjeta">Tarjeta</option>
              </select>
            </div>
          </div>

          <div>
            <label
              htmlFor="numero_recibo"
              className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500"
            >
              No. de Recibo / Boleta
            </label>
            <div className="relative">
              <Hash className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                id="numero_recibo"
                placeholder="Ej. REC-001"
                {...register('numero_recibo')}
                className="tabular-nums w-full rounded-xl border border-slate-200 bg-slate-50/70 py-2.5 pl-10 pr-3.5 font-mono text-sm font-semibold text-slate-900 outline-none transition placeholder:font-sans placeholder:font-normal placeholder:text-slate-400 focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-600/10"
              />
            </div>
            {errors.numero_recibo && (
              <p className="mt-1.5 text-xs font-medium text-red-600">
                {errors.numero_recibo.message}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="fecha_pago"
              className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500"
            >
              Fecha de pago
            </label>
            <input
              id="fecha_pago"
              type="date"
              {...register('fecha_pago')}
              className="tabular-nums w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3.5 py-2.5 text-sm font-medium text-slate-900 outline-none transition focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-600/10"
            />
            {errors.fecha_pago && (
              <p className="mt-1.5 text-xs font-medium text-red-600">
                {errors.fecha_pago.message}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Pie de acciones */}
      <div className="flex flex-col-reverse gap-2.5 border-t border-slate-200/80 pt-4 sm:flex-row sm:items-center sm:justify-end">
        <button
          type="button"
          onClick={limpiarFormulario}
          disabled={isSubmitting}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 hover:text-slate-900 disabled:opacity-50"
        >
          <RotateCcw className="h-4 w-4" />
          <span>Limpiar</span>
        </button>

        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-600/25 transition hover:from-emerald-600 hover:to-teal-700 active:scale-[0.99] disabled:opacity-60"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Registrando...</span>
            </>
          ) : (
            <>
              <CreditCard className="h-4 w-4" />
              <span>Guardar pago</span>
            </>
          )}
        </button>
      </div>
    </form>
  )
}