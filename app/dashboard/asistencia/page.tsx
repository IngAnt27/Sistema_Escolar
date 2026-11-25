import { redirect } from 'next/navigation'
import {
  ClipboardCheck,
  UserCheck,
  Clock,
  CalendarDays,
  QrCode,
  BookOpen,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { EscanerQR } from '@/components/asistencia/EscanerQR'
import { BotonCerrarAsistencia } from '@/components/asistencia/BotonCerrarAsistencia'

interface EstudianteResumen {
  codigo_personal: string
  nombres: string
  apellidos: string
  grado: string
  foto_url?: string | null
}

interface AsistenciaConEstudiante {
  id: string
  hora_entrada: string
  estado: 'presente' | 'tarde' | 'ausente'
  estudiantes: EstudianteResumen | EstudianteResumen[] | null
}

export default async function AsistenciaPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const ahora = new Date()
  const fechaHoy = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Guatemala',
  }).format(ahora)

  const fechaLegible = new Intl.DateTimeFormat('es-GT', {
    timeZone: 'America/Guatemala',
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(ahora)

  const { data: asistenciasHoy } = await supabase
    .from('asistencias')
    .select(
      `
      id,
      hora_entrada,
      estado,
      estudiantes (
        codigo_personal,
        nombres,
        apellidos,
        grado,
        foto_url
      )
    `
    )
    .eq('fecha', fechaHoy)
    .order('created_at', { ascending: false })

  const lista = (asistenciasHoy ?? []) as AsistenciaConEstudiante[]
  const totalPresentes = lista.filter((r) => r.estado === 'presente').length
  const totalTarde = lista.filter((r) => r.estado === 'tarde').length
  const totalAusentes = lista.filter((r) => r.estado === 'ausente').length

  const kpis = [
    {
      titulo: 'Registros Hoy',
      valor: lista.length,
      subtexto: fechaHoy,
      icon: ClipboardCheck,
      gradiente: 'from-blue-600 to-blue-700',
      sombra: 'shadow-blue-600/20',
      burbuja: 'bg-blue-500/40',
    },
    {
      titulo: 'Presentes a Tiempo',
      valor: totalPresentes,
      subtexto: 'Ingreso puntual',
      icon: UserCheck,
      gradiente: 'from-emerald-500 to-teal-600',
      sombra: 'shadow-emerald-600/20',
      burbuja: 'bg-emerald-400/40',
    },
    {
      titulo: 'Llegadas Tarde',
      valor: totalTarde,
      subtexto: `${totalAusentes} ${totalAusentes === 1 ? 'ausente' : 'ausentes'} registrados`,
      icon: Clock,
      gradiente: 'from-amber-500 to-orange-600',
      sombra: 'shadow-amber-600/20',
      burbuja: 'bg-amber-400/40',
    },
  ]

  function obtenerEstilosEstado(estado: AsistenciaConEstudiante['estado']) {
    if (estado === 'presente') {
      return 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/70'
    }
    if (estado === 'tarde') {
      return 'bg-amber-50 text-amber-700 ring-1 ring-amber-200/70'
    }
    return 'bg-red-50 text-red-700 ring-1 ring-red-200/70'
  }

  return (
    <div className="mx-auto max-w-7xl space-y-7">
      {/* Encabezado + Acción de cierre */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Asistencia por QR
          </h1>
          <p className="mt-1 flex items-center gap-1.5 text-sm capitalize text-slate-500">
            <CalendarDays className="h-4 w-4 text-blue-600" />
            <span>{fechaLegible}</span>
          </p>
        </div>

        <div className="w-full sm:w-auto">
          <BotonCerrarAsistencia />
        </div>
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
                  <p className="tabular-nums mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">
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

      {/* Grid Principal Bento: Escáner + Registros de hoy */}
      <div className="grid gap-6 lg:grid-cols-12 lg:items-start">
        {/* Escáner QR */}
        <div className="lg:col-span-5">
          <EscanerQR />
        </div>

        {/* Lista de ingresos de hoy */}
        <section className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-xs lg:col-span-7">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 bg-slate-50/60 px-5 py-4 sm:px-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#0f172a] text-blue-400 shadow-sm">
                <ClipboardCheck className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Registros de hoy
                </h2>
                <p className="text-xs text-slate-500">
                  Últimos escaneos ordenados por hora de ingreso
                </p>
              </div>
            </div>

            <span className="tabular-nums inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
              {lista.length} {lista.length === 1 ? 'registro' : 'registros'}
            </span>
          </div>

          {lista.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                <QrCode className="h-6 w-6" />
              </div>
              <p className="text-sm font-semibold text-slate-700">
                Aún no se han escaneado carnets hoy
              </p>
              <p className="mt-1 max-w-xs text-xs text-slate-500">
                Activa el escáner QR para comenzar a registrar las entradas del
                día.
              </p>
            </div>
          ) : (
            <>
              {/* Vista Móvil: Tarjetas apiladas */}
              <div className="divide-y divide-slate-100 md:hidden">
                {lista.map((reg) => {
                  const est = Array.isArray(reg.estudiantes)
                    ? reg.estudiantes[0]
                    : reg.estudiantes
                  const iniciales =
                    `${est?.nombres?.[0] ?? ''}${est?.apellidos?.[0] ?? ''}`.toUpperCase() ||
                    'ES'

                  return (
                    <div key={reg.id} className="space-y-3 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[#0f172a] text-xs font-bold text-white">
                            {est?.foto_url ? (
                              <img
                                src={est.foto_url}
                                alt={`${est.nombres} ${est.apellidos}`}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              iniciales
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-900">
                              {est?.nombres} {est?.apellidos}
                            </p>
                            <p className="tabular-nums font-mono text-xs text-slate-500">
                              {est?.codigo_personal}
                            </p>
                          </div>
                        </div>

                        <span
                          className={`inline-flex shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${obtenerEstilosEstado(
                            reg.estado
                          )}`}
                        >
                          {reg.estado}
                        </span>
                      </div>

                      <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-3 py-2 text-xs text-slate-600">
                        <span className="inline-flex items-center gap-1.5 font-medium">
                          <BookOpen className="h-3.5 w-3.5 text-slate-400" />
                          {est?.grado || 'Sin grado'}
                        </span>
                        <span className="tabular-nums inline-flex items-center gap-1 font-mono font-semibold text-slate-700">
                          <Clock className="h-3.5 w-3.5 text-slate-400" />
                          {reg.hora_entrada}
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
                      <th className="px-6 py-3.5">Estudiante</th>
                      <th className="px-6 py-3.5">Grado</th>
                      <th className="px-6 py-3.5">Hora</th>
                      <th className="px-6 py-3.5 text-right">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {lista.map((reg) => {
                      const est = Array.isArray(reg.estudiantes)
                        ? reg.estudiantes[0]
                        : reg.estudiantes
                      const iniciales =
                        `${est?.nombres?.[0] ?? ''}${est?.apellidos?.[0] ?? ''}`.toUpperCase() ||
                        'ES'

                      return (
                        <tr
                          key={reg.id}
                          className="transition-colors hover:bg-slate-50/80"
                        >
                          <td className="whitespace-nowrap px-6 py-3.5">
                            <div className="flex items-center gap-3">
                              <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[#0f172a] text-xs font-bold text-white">
                                {est?.foto_url ? (
                                  <img
                                    src={est.foto_url}
                                    alt={`${est.nombres} ${est.apellidos}`}
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  iniciales
                                )}
                              </div>
                              <div>
                                <p className="font-semibold text-slate-900">
                                  {est?.nombres} {est?.apellidos}
                                </p>
                                <p className="tabular-nums font-mono text-[11px] text-slate-500">
                                  {est?.codigo_personal}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="whitespace-nowrap px-6 py-3.5 text-slate-600">
                            {est?.grado}
                          </td>
                          <td className="tabular-nums whitespace-nowrap px-6 py-3.5">
                            <span className="rounded-lg bg-slate-100 px-2.5 py-1 font-mono text-xs font-semibold text-slate-700">
                              {reg.hora_entrada}
                            </span>
                          </td>
                          <td className="whitespace-nowrap px-6 py-3.5 text-right">
                            <span
                              className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${obtenerEstilosEstado(
                                reg.estado
                              )}`}
                            >
                              {reg.estado}
                            </span>
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
    </div>
  )
}