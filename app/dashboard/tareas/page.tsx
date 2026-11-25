import Link from 'next/link'
import { redirect } from 'next/navigation'
import {
  ClipboardList,
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  BookOpen,
  Award,
  Calendar,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { FormularioCrearTarea } from '@/components/tareas/FormularioCrearTarea'
import { NuevaTareaModal } from '@/components/tareas/NuevaTareaModal'

interface TareaRow {
  id: string
  titulo: string
  materia: string
  grado: string
  fecha_entrega: string
  punteo: number
}

export default async function TareasPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const fechaHoy = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Guatemala',
  }).format(new Date())

  const [{ data: estudiantes }, { data: tareas }] = await Promise.all([
    supabase.from('estudiantes').select('grado').eq('activo', true),
    supabase
      .from('tareas')
      .select('id, titulo, materia, grado, fecha_entrega, punteo')
      .order('fecha_entrega', { ascending: false }),
  ])

  const grados = Array.from(
    new Set((estudiantes ?? []).map((e) => e.grado))
  ).sort()

  const listaTareas = (tareas ?? []) as TareaRow[]
  const tareasVigentes = listaTareas.filter(
    (t) => t.fecha_entrega >= fechaHoy
  ).length
  const tareasCerradas = listaTareas.length - tareasVigentes
  const gradosConTareas = new Set(listaTareas.map((t) => t.grado)).size

  const kpis = [
    {
      titulo: 'Tareas Asignadas',
      valor: listaTareas.length,
      subtexto: `En ${gradosConTareas} ${gradosConTareas === 1 ? 'grado' : 'grados'}`,
      icon: ClipboardList,
      gradiente: 'from-blue-600 to-blue-700',
      sombra: 'shadow-blue-600/20',
      burbuja: 'bg-blue-500/40',
    },
    {
      titulo: 'Vigentes',
      valor: tareasVigentes,
      subtexto: 'Entrega hoy o próxima',
      icon: CalendarClock,
      gradiente: 'from-emerald-500 to-teal-600',
      sombra: 'shadow-emerald-600/20',
      burbuja: 'bg-emerald-400/40',
    },
    {
      titulo: 'Cerradas / Revisión',
      valor: tareasCerradas,
      subtexto: 'Fecha límite cumplida',
      icon: CheckCircle2,
      gradiente: 'from-violet-500 to-purple-700',
      sombra: 'shadow-violet-600/20',
      burbuja: 'bg-violet-400/40',
    },
  ]

  return (
    <div className="mx-auto max-w-7xl space-y-7">
      {/* Encabezado + Botón Nueva Tarea */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Gestión de Tareas
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Crea tareas por grado, revisa entregas y notifica incumplimientos
            por WhatsApp
          </p>
        </div>

        <NuevaTareaModal>
          <FormularioCrearTarea grados={grados} />
        </NuevaTareaModal>
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
                <span className="inline-flex items-center rounded-full bg-black/15 px-2.5 py-1 text-xs font-medium text-white/95">
                  {kpi.subtexto}
                </span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Listado de Tareas */}
      <section className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 bg-slate-50/60 px-5 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#0f172a] text-blue-400 shadow-sm">
              <ClipboardList className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Tareas asignadas
              </h2>
              <p className="text-xs text-slate-500">
                Ordenadas por fecha de entrega más reciente
              </p>
            </div>
          </div>

          <span className="tabular-nums inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
            {listaTareas.length}{' '}
            {listaTareas.length === 1 ? 'tarea' : 'tareas'}
          </span>
        </div>

        {listaTareas.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
              <ClipboardList className="h-6 w-6" />
            </div>
            <p className="text-sm font-semibold text-slate-700">
              Aún no has creado tareas
            </p>
            <p className="mt-1 max-w-xs text-xs text-slate-500">
              Usa el botón &ldquo;Nueva tarea&rdquo; para asignar la primera
              actividad a un grado.
            </p>
          </div>
        ) : (
          <>
            {/* Vista Móvil: Tarjetas */}
            <div className="divide-y divide-slate-100 md:hidden">
              {listaTareas.map((t) => {
                const esVigente = t.fecha_entrega >= fechaHoy

                return (
                  <div key={t.id} className="space-y-3 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-slate-900">
                          {t.titulo}
                        </p>
                        <p className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-500">
                          <BookOpen className="h-3.5 w-3.5 text-blue-600" />
                          <span>{t.materia}</span>
                          <span>·</span>
                          <span className="font-medium text-slate-700">
                            {t.grado}
                          </span>
                        </p>
                      </div>

                      <span
                        className={`inline-flex shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                          esVigente
                            ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/70'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {esVigente ? 'Vigente' : 'Cerrada'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-3 py-2 text-xs text-slate-600">
                      <span className="tabular-nums inline-flex items-center gap-1.5 font-mono font-medium">
                        <Calendar className="h-3.5 w-3.5 text-slate-400" />
                        {t.fecha_entrega}
                      </span>
                      <span className="tabular-nums inline-flex items-center gap-1 font-bold text-slate-900">
                        <Award className="h-3.5 w-3.5 text-amber-500" />
                        {t.punteo} pts
                      </span>
                    </div>

                    <Link
                      href={`/dashboard/tareas/${t.id}`}
                      className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-[#0f172a] px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-slate-800"
                    >
                      <span>Revisar entregas</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                )
              })}
            </div>

            {/* Vista Tablet / Escritorio: Tabla */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-slate-100 bg-white text-xs font-semibold uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-6 py-3.5">Tarea</th>
                    <th className="px-6 py-3.5">Materia</th>
                    <th className="px-6 py-3.5">Grado</th>
                    <th className="px-6 py-3.5">Entrega</th>
                    <th className="px-6 py-3.5 text-center">Punteo</th>
                    <th className="px-6 py-3.5 text-right">Revisión</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {listaTareas.map((t) => {
                    const esVigente = t.fecha_entrega >= fechaHoy

                    return (
                      <tr
                        key={t.id}
                        className="transition-colors hover:bg-slate-50/80"
                      >
                        <td className="px-6 py-4">
                          <p className="font-semibold text-slate-900">
                            {t.titulo}
                          </p>
                          <span
                            className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                              esVigente
                                ? 'bg-emerald-50 text-emerald-700'
                                : 'bg-slate-100 text-slate-500'
                            }`}
                          >
                            {esVigente ? 'Vigente' : 'Cerrada'}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-slate-700">
                          {t.materia}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4">
                          <span className="inline-flex rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                            {t.grado}
                          </span>
                        </td>
                        <td className="tabular-nums whitespace-nowrap px-6 py-4 font-mono text-xs font-medium text-slate-600">
                          {t.fecha_entrega}
                        </td>
                        <td className="tabular-nums whitespace-nowrap px-6 py-4 text-center">
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-800 ring-1 ring-amber-200/70">
                            {t.punteo} pts
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-right">
                          <Link
                            href={`/dashboard/tareas/${t.id}`}
                            className="inline-flex items-center gap-1.5 rounded-xl bg-blue-50 px-3.5 py-2 text-xs font-semibold text-blue-700 transition hover:bg-blue-600 hover:text-white"
                          >
                            <span>Revisar entregas</span>
                            <ArrowRight className="h-3.5 w-3.5" />
                          </Link>
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