import { redirect } from 'next/navigation'
import {
  CreditCard,
  Wallet,
  Receipt,
  Calendar,
  Hash,
  ShieldCheck,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { FormularioPago } from '@/components/pagos/FormularioPago'
import { NuevoPagoModal } from '@/components/pagos/NuevoPagoModal'

interface PagoRow {
  id: string
  concepto: string
  mes_correspondiente: string | null
  monto: number
  metodo_pago: string
  numero_recibo: string
  fecha_pago: string
  estudiantes:
    | { nombres: string; apellidos: string; grado: string }
    | { nombres: string; apellidos: string; grado: string }[]
    | null
}

function formatoQuetzales(valor: number) {
  return new Intl.NumberFormat('es-GT', {
    style: 'currency',
    currency: 'GTQ',
  }).format(valor)
}

export default async function PagosPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Doble verificación de rol en servidor
  const { data: perfil } = await supabase
    .from('perfiles')
    .select('rol')
    .eq('id', user.id)
    .single()

  if (perfil?.rol !== 'director') redirect('/dashboard')

  const fechaHoy = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Guatemala',
  }).format(new Date())

  const inicioMes = `${fechaHoy.slice(0, 7)}-01`

  const [{ data: estudiantes }, { data: pagos }] = await Promise.all([
    supabase
      .from('estudiantes')
      .select('id, nombres, apellidos, grado')
      .eq('activo', true)
      .order('apellidos', { ascending: true }),
    supabase
      .from('pagos')
      .select(
        'id, concepto, mes_correspondiente, monto, metodo_pago, numero_recibo, fecha_pago, estudiantes(nombres, apellidos, grado)'
      )
      .order('fecha_pago', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(50),
  ])

  const listaPagos = (pagos ?? []) as PagoRow[]
  const totalMes = listaPagos
    .filter((p) => p.fecha_pago >= inicioMes)
    .reduce((acc, p) => acc + Number(p.monto), 0)
  const totalGeneral = listaPagos.reduce((acc, p) => acc + Number(p.monto), 0)

  const kpis = [
    {
      titulo: 'Recaudado este mes',
      valor: formatoQuetzales(totalMes),
      subtexto: `Desde ${inicioMes}`,
      icon: Wallet,
      gradiente: 'from-emerald-500 to-teal-600',
      sombra: 'shadow-emerald-600/20',
      burbuja: 'bg-emerald-400/40',
    },
    {
      titulo: 'Total registrado',
      valor: formatoQuetzales(totalGeneral),
      subtexto: 'Últimos 50 movimientos',
      icon: CreditCard,
      gradiente: 'from-blue-600 to-blue-700',
      sombra: 'shadow-blue-600/20',
      burbuja: 'bg-blue-500/40',
    },
    {
      titulo: 'Recibos emitidos',
      valor: String(listaPagos.length),
      subtexto: 'Comprobantes activos',
      icon: Receipt,
      gradiente: 'from-violet-500 to-purple-700',
      sombra: 'shadow-violet-600/20',
      burbuja: 'bg-violet-400/40',
    },
  ]

  return (
    <div className="mx-auto max-w-7xl space-y-7">
      {/* Encabezado + Botón Registrar Pago */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Pagos y Solvencia
            </h1>
            <span className="hidden items-center gap-1 rounded-full bg-slate-200/80 px-2.5 py-0.5 text-[11px] font-semibold text-slate-700 sm:inline-flex">
              <ShieldCheck className="h-3.5 w-3.5 text-blue-600" />
              Dirección
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Control financiero, emisión de recibos e historial de ingresos
          </p>
        </div>

        <NuevoPagoModal>
          <FormularioPago estudiantes={estudiantes ?? []} fechaHoy={fechaHoy} />
        </NuevoPagoModal>
      </div>

      {/* KPIs Bento */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {kpis.map((kpi) => {
          const Icon = kpi.icon
          return (
            <div
              key={kpi.titulo}
              className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${kpi.gradiente} p-6 text-white shadow-lg ${kpi.sombra} transition-transform duration-200 hover:-translate-y-0.5`}
            >
              <div
                className={`pointer-events-none absolute -right-6 -bottom-6 h-24 w-24 rounded-full ${kpi.burbuja} blur-xl`}
              />
              <div className="relative flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-white/85">
                    {kpi.titulo}
                  </p>
                  <p className="tabular-nums mt-2 text-2xl font-extrabold tracking-tight sm:text-3xl">
                    {kpi.valor}
                  </p>
                </div>
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/20 shadow-inner ring-1 ring-white/30">
                  <Icon className="h-5 w-5 text-white" />
                </div>
              </div>
              <div className="relative mt-4">
                <span className="tabular-nums inline-flex items-center rounded-full bg-black/15 px-2.5 py-1 text-xs font-medium text-white/95">
                  {kpi.subtexto}
                </span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Historial de Pagos Recientes */}
      <section className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 bg-slate-50/60 px-5 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#0f172a] text-emerald-400 shadow-sm">
              <Receipt className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Historial de Pagos Recientes
              </h2>
              <p className="text-xs text-slate-500">
                Últimos 50 movimientos ordenados por fecha
              </p>
            </div>
          </div>

          <span className="tabular-nums inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
            {listaPagos.length}{' '}
            {listaPagos.length === 1 ? 'registro' : 'registros'}
          </span>
        </div>

        {listaPagos.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
              <Wallet className="h-6 w-6" />
            </div>
            <p className="text-sm font-semibold text-slate-700">
              No hay pagos registrados todavía
            </p>
            <p className="mt-1 max-w-xs text-xs text-slate-500">
              Usa el botón &ldquo;Registrar pago&rdquo; para emitir el primer
              recibo.
            </p>
          </div>
        ) : (
          <>
            {/* Vista Móvil: Tarjetas */}
            <div className="divide-y divide-slate-100 md:hidden">
              {listaPagos.map((p) => {
                const est = Array.isArray(p.estudiantes)
                  ? p.estudiantes[0]
                  : p.estudiantes
                return (
                  <div key={p.id} className="space-y-3 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-bold text-slate-900">
                          {est?.apellidos}, {est?.nombres}
                        </p>
                        <p className="text-xs text-slate-500">{est?.grado}</p>
                      </div>
                      <p className="tabular-nums text-base font-extrabold text-emerald-700">
                        {formatoQuetzales(Number(p.monto))}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-slate-50 px-3 py-2 text-xs text-slate-600">
                      <span className="font-semibold capitalize text-slate-800">
                        {p.concepto}
                        {p.mes_correspondiente && (
                          <span className="ml-1 font-normal text-slate-500">
                            ({p.mes_correspondiente})
                          </span>
                        )}
                      </span>
                      <span className="rounded-full bg-white px-2.5 py-0.5 text-[11px] font-semibold capitalize text-slate-700 ring-1 ring-slate-200">
                        {p.metodo_pago}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span className="tabular-nums inline-flex items-center gap-1 font-mono font-semibold text-slate-700">
                        <Hash className="h-3 w-3 text-slate-400" />
                        {p.numero_recibo}
                      </span>
                      <span className="tabular-nums inline-flex items-center gap-1 font-mono">
                        <Calendar className="h-3 w-3 text-slate-400" />
                        {p.fecha_pago}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Vista Tablet / Escritorio: Tabla */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-slate-100 bg-white text-xs font-semibold uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-6 py-3.5">Fecha</th>
                    <th className="px-6 py-3.5">Recibo</th>
                    <th className="px-6 py-3.5">Estudiante</th>
                    <th className="px-6 py-3.5">Concepto</th>
                    <th className="px-6 py-3.5">Método</th>
                    <th className="px-6 py-3.5 text-right">Monto</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {listaPagos.map((p) => {
                    const est = Array.isArray(p.estudiantes)
                      ? p.estudiantes[0]
                      : p.estudiantes
                    return (
                      <tr
                        key={p.id}
                        className="transition-colors hover:bg-slate-50/80"
                      >
                        <td className="tabular-nums whitespace-nowrap px-6 py-4 font-mono text-xs text-slate-500">
                          {p.fecha_pago}
                        </td>
                        <td className="tabular-nums whitespace-nowrap px-6 py-4">
                          <span className="rounded-lg bg-slate-100 px-2.5 py-1 font-mono text-xs font-semibold text-slate-700">
                            {p.numero_recibo}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4">
                          <p className="font-semibold text-slate-900">
                            {est?.apellidos}, {est?.nombres}
                          </p>
                          <p className="text-xs text-slate-500">{est?.grado}</p>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 capitalize text-slate-700">
                          <span className="font-medium">{p.concepto}</span>
                          {p.mes_correspondiente && (
                            <span className="ml-1.5 text-xs text-slate-500">
                              ({p.mes_correspondiente})
                            </span>
                          )}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4">
                          <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold capitalize text-slate-700">
                            {p.metodo_pago}
                          </span>
                        </td>
                        <td className="tabular-nums whitespace-nowrap px-6 py-4 text-right font-extrabold text-emerald-700">
                          {formatoQuetzales(Number(p.monto))}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>
    </div>
  )
}