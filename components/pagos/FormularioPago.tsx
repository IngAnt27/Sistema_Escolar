'use client'

import { useForm, type Resolver } from 'react-hook-form'
import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { CreditCard, CheckCircle2, AlertCircle } from 'lucide-react'
import { pagoSchema, type PagoInput } from '@/lib/validations/pagos'
import { registrarPago } from '@/app/actions/pagos'

interface EstudianteOpcion {
  id: string
  nombres: string
  apellidos: string
  grado: string
}

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo',
  'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre',
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

  async function onSubmit(data: PagoInput) {
    setEstadoServer(null)
    const res = await registrarPago(data)

    if (res.error) {
      setEstadoServer({ tipo: 'error', texto: res.error })
      return
    }

    setEstadoServer({ tipo: 'ok', texto: 'Pago registrado correctamente.' })
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

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-4 rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-xs"
    >
      <div>
        <h2 className="text-base font-semibold text-slate-900">
          Registrar Pago
        </h2>
        <p className="text-xs text-slate-500">
          Validación en tiempo real con Zod y respaldo en PostgreSQL
        </p>
      </div>

      {estadoServer && (
        <div
          className={`flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-xs font-medium ${
            estadoServer.tipo === 'ok'
              ? 'bg-emerald-50 text-emerald-800'
              : 'bg-red-50 text-red-800'
          }`}
        >
          {estadoServer.tipo === 'ok' ? (
            <CheckCircle2 className="h-4 w-4 shrink-0"/>
          ) : (
            <AlertCircle className="h-4 w-4 shrink-0"/>
          )}
          <span>{estadoServer.texto}</span>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="lg:col-span-2">
          <label className="mb-1 block text-xs font-semibold text-slate-700">
            Estudiante
          </label>
          <select
            {...register('estudiante_id')}
            className="w-full rounded-lg border border-[#E2E8F0] bg-white px-3 py-2 text-sm outline-none focus:border-[#2563EB]"
          >
            <option value="">Selecciona un estudiante...</option>
            {estudiantes.map((e) => (
              <option key={e.id} value={e.id}>
                {e.apellidos}, {e.nombres} ({e.grado})
              </option>
            ))}
          </select>
          {errors.estudiante_id && (
            <p className="mt-1 text-xs text-red-600">{errors.estudiante_id.message}</p>
          )}
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-700">
            Concepto
          </label>
          <select
            {...register('concepto')}
            className="w-full rounded-lg border border-[#E2E8F0] bg-white px-3 py-2 text-sm outline-none focus:border-[#2563EB]"
          >
            <option value="colegiatura">Colegiatura</option>
            <option value="inscripcion">Inscripción</option>
            <option value="examen">Derecho de examen</option>
            <option value="uniforme">Uniforme</option>
            <option value="otro">Otro</option>
          </select>
          {errors.concepto && (
            <p className="mt-1 text-xs text-red-600">{errors.concepto.message}</p>
          )}
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-700">
            Mes (si aplica)
          </label>
          <select
            {...register('mes_correspondiente')}
            className="w-full rounded-lg border border-[#E2E8F0] bg-white px-3 py-2 text-sm outline-none focus:border-[#2563EB]"
          >
            <option value="">No aplica</option>
            {MESES.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-700">
            Monto (Q)
          </label>
          <input
            type="number"
            step="0.01"
            placeholder="0.00"
            {...register('monto')}
            className="tabular-nums w-full rounded-lg border border-[#E2E8F0] px-3 py-2 text-sm outline-none focus:border-[#2563EB]"
          />
          {errors.monto && (
            <p className="mt-1 text-xs text-red-600">{errors.monto.message}</p>
          )}
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-700">
            Método de pago
          </label>
          <select
            {...register('metodo_pago')}
            className="w-full rounded-lg border border-[#E2E8F0] bg-white px-3 py-2 text-sm outline-none focus:border-[#2563EB]"
          >
            <option value="efectivo">Efectivo</option>
            <option value="transferencia">Transferencia</option>
            <option value="deposito">Depósito bancario</option>
            <option value="tarjeta">Tarjeta</option>
          </select>
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-700">
            No. de Recibo / Boleta
          </label>
          <input
            placeholder="Ej. REC-001"
            {...register('numero_recibo')}
            className="tabular-nums w-full rounded-lg border border-[#E2E8F0] px-3 py-2 text-sm outline-none focus:border-[#2563EB]"
          />
          {errors.numero_recibo && (
            <p className="mt-1 text-xs text-red-600">{errors.numero_recibo.message}</p>
          )}
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-700">
            Fecha de pago
          </label>
          <input
            type="date"
            {...register('fecha_pago')}
            className="tabular-nums w-full rounded-lg border border-[#E2E8F0] px-3 py-2 text-sm outline-none focus:border-[#2563EB]"
          />
          {errors.fecha_pago && (
            <p className="mt-1 text-xs text-red-600">{errors.fecha_pago.message}</p>
          )}
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center gap-2 rounded-lg bg-[#2563EB] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#1D4ED8] disabled:opacity-50"
        >
          <CreditCard className="h-4 w-4"/>
          {isSubmitting ? 'Registrando...' : 'Guardar pago'}
        </button>
      </div>
    </form>
  )
}