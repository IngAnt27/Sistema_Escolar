import { redirect } from 'next/navigation'
import { CreditCard, Wallet, Receipt } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { FormularioPago } from '@/components/pagos/FormularioPago'

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
  const { data: { user } } = await supabase.auth.getUser()
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Pagos y Solvencia
        </h1>
        <p className="text-sm text-slate-500">
          Control financiero exclusivo de Dirección (protegido por RLS y Middleware)
        </p>
      </div>

      {/* Bento KPIs */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Recaudado este mes
            </span>
            <Wallet className="h-4 w-4 text-emerald-600"/>
          </div>
          <p className="tabular-nums mt-2 text-2xl font-bold text-emerald-600">
            {formatoQuetzales(totalMes)}
          </p>
        </div>

        <div className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Total registrado
            </span>
            <CreditCard className="h-4 w-4 text-[#2563EB]"/>
          </div>
          <p className="tabular-nums mt-2 text-2xl font-bold text-slate-900">
            {formatoQuetzales(totalGeneral)}
          </p>
        </div>

        <div className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Recibos emitidos
            </span>
            <Receipt className="h-4 w-4 text-slate-500"/>
          </div>
          <p className="tabular-nums mt-2 text-2xl font-bold text-slate-900">
            {listaPagos.length}
          </p>
        </div>
      </div>

      <FormularioPago estudiantes={estudiantes ?? []} fechaHoy={fechaHoy} />
      {/* Historial de Pagos */}
      <div className="overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white shadow-xs">
        <div className="border-b border-[#E2E8F0] px-6 py-4">
          <h2 className="text-base font-semibold text-slate-900">
            Historial de Pagos Recientes
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-[#E2E8F0] bg-[#F8FAFC] text-xs font-semibold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-6 py-3">Fecha</th>
                <th className="px-6 py-3">Recibo</th>
                <th className="px-6 py-3">Estudiante</th>
                <th className="px-6 py-3">Concepto</th>
                <th className="px-6 py-3">Método</th>
                <th className="px-6 py-3 text-right">Monto</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0]">
              {listaPagos.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-slate-500">
                    No hay pagos registrados todavía.
                  </td>
                </tr>
              ) : (
                listaPagos.map((p) => {
                  const est = Array.isArray(p.estudiantes)
                    ? p.estudiantes[0]
                    : p.estudiantes
                  return (
                    <tr key={p.id} className="hover:bg-slate-50/70">
                      <td className="tabular-nums whitespace-nowrap px-6 py-3.5 font-mono text-xs text-slate-600">
                        {p.fecha_pago}
                      </td>
                      <td className="tabular-nums px-6 py-3.5 font-mono text-xs font-semibold text-slate-900">
                        {p.numero_recibo}
                      </td>
                      <td className="px-6 py-3.5 font-medium text-slate-900">
                        {est?.apellidos}, {est?.nombres}
                        <span className="block text-xs font-normal text-slate-500">
                          {est?.grado}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 capitalize text-slate-700">
                        {p.concepto}
                        {p.mes_correspondiente && (
                          <span className="ml-1 text-xs text-slate-500">
                            ({p.mes_correspondiente})
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-3.5 capitalize text-slate-600">
                        {p.metodo_pago}
                      </td>
                      <td className="tabular-nums px-6 py-3.5 text-right font-bold text-emerald-700">
                        {formatoQuetzales(Number(p.monto))}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}