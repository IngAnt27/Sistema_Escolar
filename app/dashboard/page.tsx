import Link from 'next/link'
import { redirect } from 'next/navigation'
import {
  Users,
  QrCode,
  ClipboardList,
  BellRing,
  BarChart3,
  ArrowRight,
  CheckCircle2,
  CalendarDays,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/server'

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const fechaHoy = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Guatemala',
  }).format(new Date())

  const [
    { count: totalEstudiantes },
    { count: asistenciasHoy },
    { count: totalTareas },
    { count: alertasHoy },
  ] = await Promise.all([
    supabase
      .from('estudiantes')
      .select('*', { count: 'exact', head: true })
      .eq('activo', true),
    supabase
      .from('asistencias')
      .select('*', { count: 'exact', head: true })
      .eq('fecha', fechaHoy)
      .in('estado', ['presente', 'tarde']),
    supabase.from('tareas').select('*', { count: 'exact', head: true }),
    supabase
      .from('notificaciones_whatsapp')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', `${fechaHoy}T00:00:00`),
  ])

  const estudiantes = totalEstudiantes ?? 0
  const asistencias = asistenciasHoy ?? 0
  const tareas = totalTareas ?? 0
  const alertas = alertasHoy ?? 0
  const porcentajeAsistencia =
    estudiantes > 0 ? Math.round((asistencias / estudiantes) * 100) : 0

  const kpis = [
    {
      titulo: 'Estudiantes Activos',
      valor: estudiantes,
      subtexto: 'Inscritos vigentes',
      icon: Users,
      gradiente: 'from-blue-600 to-blue-700',
      sombra: 'shadow-blue-600/20',
      burbuja: 'bg-blue-500/40',
    },
    {
      titulo: 'Asistencias Hoy',
      valor: asistencias,
      subtexto: `${porcentajeAsistencia}% de cobertura`,
      icon: CheckCircle2,
      gradiente: 'from-emerald-500 to-teal-600',
      sombra: 'shadow-emerald-600/20',
      burbuja: 'bg-emerald-400/40',
    },
    {
      titulo: 'Tareas Asignadas',
      valor: tareas,
      subtexto: 'Actividades registradas',
      icon: ClipboardList,
      gradiente: 'from-amber-500 to-orange-500',
      sombra: 'shadow-amber-500/20',
      burbuja: 'bg-amber-400/40',
    },
    {
      titulo: 'Alertas WhatsApp Hoy',
      valor: alertas,
      subtexto: 'Notificaciones enviadas',
      icon: BellRing,
      gradiente: 'from-rose-500 to-red-600',
      sombra: 'shadow-rose-500/20',
      burbuja: 'bg-rose-400/40',
    },
  ]

  const accesos = [
    {
      titulo: 'Escáner de Asistencia QR',
      descripcion: 'Registra ingresos con cámara y notifica ausentes.',
      href: '/dashboard/asistencia',
      icon: QrCode,
      fondoBanner: 'bg-gradient-to-br from-blue-50 to-indigo-100/70',
      iconoCaja:
        'bg-gradient-to-br from-blue-500 to-blue-700 text-white shadow-lg shadow-blue-600/30',
      hoverTexto: 'group-hover:text-blue-600',
    },
    {
      titulo: 'Directorio de Estudiantes',
      descripcion: 'Inscribe alumnos y genera sus carnets con QR.',
      href: '/dashboard/estudiantes',
      icon: Users,
      fondoBanner: 'bg-gradient-to-br from-emerald-50 to-teal-100/70',
      iconoCaja:
        'bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-600/30',
      hoverTexto: 'group-hover:text-emerald-600',
    },
    {
      titulo: 'Gestión de Tareas',
      descripcion: 'Asigna tareas, revisa entregas y envía alertas.',
      href: '/dashboard/tareas',
      icon: ClipboardList,
      fondoBanner: 'bg-gradient-to-br from-amber-50 to-orange-100/70',
      iconoCaja:
        'bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-lg shadow-amber-500/30',
      hoverTexto: 'group-hover:text-amber-600',
    },
    {
      titulo: 'Informes de Asistencia',
      descripcion: 'Reportes semanales, mensuales y trimestrales.',
      href: '/dashboard/informes',
      icon: BarChart3,
      fondoBanner: 'bg-gradient-to-br from-violet-50 to-purple-100/70',
      iconoCaja:
        'bg-gradient-to-br from-violet-500 to-purple-700 text-white shadow-lg shadow-violet-600/30',
      hoverTexto: 'group-hover:text-violet-600',
    },
  ]

  return (
    <div className="mx-auto max-w-7xl space-y-7">
      {/* Encabezado */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Panel Principal
          </h1>
          <p className="mt-1 flex items-center gap-2 text-sm text-slate-500">
            <CalendarDays className="h-4 w-4 text-slate-400" />
            <span>Resumen general del día —</span>
            <span className="tabular-nums font-semibold text-slate-700">
              {fechaHoy}
            </span>
          </p>
        </div>
      </div>

      {/* Fila superior: Bento KPIs sólidos con volumen */}
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((kpi) => {
          const Icon = kpi.icon
          return (
            <div
              key={kpi.titulo}
              className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${kpi.gradiente} p-6 text-white shadow-lg ${kpi.sombra} transition-transform duration-200 hover:-translate-y-1`}
            >
              {/* Círculos decorativos sutiles para dar profundidad */}
              <div
                className={`pointer-events-none absolute -right-6 -bottom-6 h-28 w-28 rounded-full ${kpi.burbuja} blur-xl`}
              />

              <div className="relative flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-white/85">
                    {kpi.titulo}
                  </p>
                  <p className="tabular-nums mt-3 text-4xl font-extrabold tracking-tight">
                    {kpi.valor}
                  </p>
                </div>

                {/* Contenedor de ícono estilo 3D elevado */}
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/20 shadow-inner ring-1 ring-white/30 backdrop-blur-xs">
                  <Icon className="h-6 w-6 text-white drop-shadow-xs" />
                </div>
              </div>

              <div className="relative mt-5 flex items-center gap-2">
                <span className="inline-flex items-center rounded-full bg-black/15 px-2.5 py-1 text-xs font-medium text-white/95">
                  {kpi.subtexto}
                </span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Fila inferior: Tarjetas Bento de accesos rápidos */}
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {accesos.map((item) => {
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className="group flex flex-col overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-xs transition-all duration-200 hover:-translate-y-1 hover:border-slate-300 hover:shadow-xl hover:shadow-slate-200/70"
            >
              {/* Cabecera visual con ícono en relieve */}
              <div
                className={`relative flex h-32 items-center justify-center ${item.fondoBanner}`}
              >
                <div
                  className={`flex h-16 w-16 items-center justify-center rounded-2xl ${item.iconoCaja} ring-4 ring-white/70 transition-transform duration-200 group-hover:scale-105 group-hover:-rotate-3`}
                >
                  <Icon className="h-8 w-8" />
                </div>
              </div>

              {/* Contenido */}
              <div className="flex flex-1 flex-col justify-between p-5">
                <div>
                  <h2
                    className={`text-base font-bold text-slate-900 transition-colors ${item.hoverTexto}`}
                  >
                    {item.titulo}
                  </h2>
                  <p className="mt-1.5 text-xs leading-relaxed text-slate-500">
                    {item.descripcion}
                  </p>
                </div>

                <div className="mt-4 flex items-center justify-end">
                  <span
                    className={`inline-flex items-center gap-1 text-xs font-semibold text-slate-400 transition-colors ${item.hoverTexto}`}
                  >
                    Abrir
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </span>
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}