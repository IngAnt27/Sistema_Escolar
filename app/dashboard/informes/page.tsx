import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ControlesInforme } from '@/components/informes/ControlesInforme'

interface PageProps {
  searchParams: Promise<{ periodo?: string; grado?: string }>
}

function calcularRangoFechas(periodo: string) {
  const ahora = new Date()
  const formato = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Guatemala',
  })

  const fechaFin = formato.format(ahora)
  const inicio = new Date(ahora)

  if (periodo === 'mensual') {
    inicio.setDate(1)
  } else if (periodo === 'trimestral') {
    inicio.setMonth(inicio.getMonth() - 3)
  } else {
    // Semanal por defecto (últimos 7 días)
    inicio.setDate(inicio.getDate() - 6)
  }

  return {
    fechaInicio: formato.format(inicio),
    fechaFin,
  }
}

export default async function InformesPage({ searchParams }: PageProps) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const params = await searchParams
  const periodo = ['semanal', 'mensual', 'trimestral'].includes(params.periodo ?? '')
    ? (params.periodo as string)
    : 'semanal'
  const gradoFiltro = params.grado ?? 'todos'

  const { fechaInicio, fechaFin } = calcularRangoFechas(periodo)

  // 1. Obtener estudiantes activos, asistencias y tareas del rango
  const [
    { data: estudiantes },
    { data: asistencias },
    { data: tareas },
  ] = await Promise.all([
    supabase
      .from('estudiantes')
      .select('id, codigo_personal, nombres, apellidos, grado')
      .eq('activo', true)
      .order('apellidos', { ascending: true }),
    supabase
      .from('asistencias')
      .select('estudiante_id, estado')
      .gte('fecha', fechaInicio)
      .lte('fecha', fechaFin),
    supabase
      .from('incumplimientos_tareas')
      .select('estudiante_id')
      .gte('fecha', fechaInicio)
      .lte('fecha', fechaFin),
  ])

  const listaEstudiantes = estudiantes ?? []
  const gradosDisponibles = Array.from(
    new Set(listaEstudiantes.map((e) => e.grado))
  ).sort()

  const estudiantesFiltrados =
    gradoFiltro === 'todos'
      ? listaEstudiantes
      : listaEstudiantes.filter((e) => e.grado === gradoFiltro)

  // 2. Consolidar métricas por estudiante
  const filas = estudiantesFiltrados.map((est) => {
    const asisEst = (asistencias ?? []).filter((a) => a.estudiante_id === est.id)
    const presentes = asisEst.filter((a) => a.estado === 'presente').length
    const tardes = asisEst.filter((a) => a.estado === 'tarde').length
    const ausentes = asisEst.filter((a) => a.estado === 'ausente').length
    const totalDias = presentes + tardes + ausentes
    const porcentaje =
      totalDias > 0 ? Math.round(((presentes + tardes) / totalDias) * 100) : 0
    const tareasIncumplidas = (tareas ?? []).filter(
      (t) => t.estudiante_id === est.id
    ).length

    return {
      ...est,
      presentes,
      tardes,
      ausentes,
      totalDias,
      porcentaje,
      tareasIncumplidas,
    }
  })

  // 3. Totales generales del periodo
  const totalPresentes = filas.reduce((acc, f) => acc + f.presentes, 0)
  const totalTardes = filas.reduce((acc, f) => acc + f.tardes, 0)
  const totalAusentes = filas.reduce((acc, f) => acc + f.ausentes, 0)
  const totalTareas = filas.reduce((acc, f) => acc + f.tareasIncumplidas, 0)
  const totalRegistros = totalPresentes + totalTardes + totalAusentes
  const porcentajeGeneral =
    totalRegistros > 0
      ? Math.round(((totalPresentes + totalTardes) / totalRegistros) * 100)
      : 0

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-1 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Informe de Asistencia ({periodo.charAt(0).toUpperCase() + periodo.slice(1)})
          </h1>
          <p className="text-sm text-slate-500">
            Periodo del <span className="tabular-nums font-medium">{fechaInicio}</span> al{' '}
            <span className="tabular-nums font-medium">{fechaFin}</span>
            {gradoFiltro !== 'todos' && ` — Grado: ${gradoFiltro}`}
          </p>
        </div>
      </div>

      <ControlesInforme
        periodoActual={periodo}
        gradoActual={gradoFiltro}
        gradosDisponibles={gradosDisponibles}
      />

      {/* Tarjetas de resumen (Bento KPIs) */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-xs">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Asistencia General
          </p>
          <p className="tabular-nums mt-2 text-3xl font-bold text-emerald-600">
            {porcentajeGeneral}%
          </p>
        </div>
        <div className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-xs">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Llegadas Tarde
          </p>
          <p className="tabular-nums mt-2 text-3xl font-bold text-amber-600">
            {totalTardes}
          </p>
        </div>
        <div className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-xs">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Inasistencias
          </p>
          <p className="tabular-nums mt-2 text-3xl font-bold text-red-600">
            {totalAusentes}
          </p>
        </div>
        <div className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-xs">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Tareas Incumplidas
          </p>
          <p className="tabular-nums mt-2 text-3xl font-bold text-slate-900">
            {totalTareas}
          </p>
        </div>
      </div>

      {/* Tabla detallada por estudiante */}
      <div className="overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-[#E2E8F0] bg-[#F8FAFC] text-xs font-semibold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-6 py-3.5">Estudiante</th>
                <th className="px-6 py-3.5">Grado</th>
                <th className="px-4 py-3.5 text-center">Presente</th>
                <th className="px-4 py-3.5 text-center">Tarde</th>
                <th className="px-4 py-3.5 text-center">Ausente</th>
                <th className="px-4 py-3.5 text-center">Tareas inc.</th>
                <th className="px-6 py-3.5 text-right">% Asistencia</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0]">
              {filas.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-10 text-center text-slate-500">
                    No hay estudiantes para mostrar en este filtro.
                  </td>
                </tr>
              ) : (
                filas.map((f) => (
                  <tr key={f.id} className="hover:bg-slate-50/70">
                    <td className="px-6 py-3.5 font-medium text-slate-900">
                      {f.apellidos}, {f.nombres}
                    </td>
                    <td className="px-6 py-3.5 text-slate-600">{f.grado}</td>
                    <td className="tabular-nums px-4 py-3.5 text-center font-semibold text-emerald-700">
                      {f.presentes}
                    </td>
                    <td className="tabular-nums px-4 py-3.5 text-center font-semibold text-amber-700">
                      {f.tardes}
                    </td>
                    <td className="tabular-nums px-4 py-3.5 text-center font-semibold text-red-700">
                      {f.ausentes}
                    </td>
                    <td className="tabular-nums px-4 py-3.5 text-center text-slate-700">
                      {f.tareasIncumplidas}
                    </td>
                    <td className="tabular-nums px-6 py-3.5 text-right font-bold text-slate-900">
                      {f.totalDias > 0 ? `${f.porcentaje}%` : '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}