import Link from 'next/link'
import { redirect } from 'next/navigation'
import {
  Users,
  QrCode,
  ClipboardList,
  BellRing,
  BarChart3,
  ArrowRight,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/server'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
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

  const accesos = [
    {
      titulo: 'Escáner de Asistencia QR',
      descripcion: 'Registra ingresos con cámara y notifica ausentes.',
      href: '/dashboard/asistencia',
      icon: QrCode,
      color: 'bg-blue-50 text-[#2563EB]',
    },
    {
      titulo: 'Directorio de Estudiantes',
      descripcion: 'Inscribe alumnos y genera sus carnets con QR.',
      href: '/dashboard/estudiantes',
      icon: Users,
      color: 'bg-emerald-50 text-emerald-700',
    },
    {
      titulo: 'Gestión de Tareas',
      descripcion: 'Asigna tareas, revisa entregas y envía alertas.',
      href: '/dashboard/tareas',
      icon: ClipboardList,
      color: 'bg-amber-50 text-amber-700',
    },
    {
      titulo: 'Informes de Asistencia',
      descripcion: 'Reportes semanales, mensuales y trimestrales.',
      href: '/dashboard/informes',
      icon: BarChart3,
      color: 'bg-purple-50 text-purple-700',
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Panel Principal
        </h1>
        <p className="text-sm text-slate-500">
          Resumen general del día —{' '}
          <span className="tabular-nums font-medium">{fechaHoy}</span>
        </p>
      </div>

      {/* Bento KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Estudiantes Activos
            </span>
            <Users className="h-4 w-4 text-[#2563EB]" />
          </div>
          <p className="tabular-nums mt-2 text-3xl font-bold text-slate-900">
            {totalEstudiantes ?? 0}
          </p>
        </div>

        <div className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Asistencias Hoy
            </span>
            <QrCode className="h-4 w-4 text-emerald-600" />
          </div>
          <p className="tabular-nums mt-2 text-3xl font-bold text-emerald-600">
            {asistenciasHoy ?? 0}
          </p>
        </div>

        <div className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Tareas Asignadas
            </span>
            <ClipboardList className="h-4 w-4 text-amber-600" />
          </div>
          <p className="tabular-nums mt-2 text-3xl font-bold text-slate-900">
            {totalTareas ?? 0}
          </p>
        </div>

        <div className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Alertas WhatsApp Hoy
            </span>
            <BellRing className="h-4 w-4 text-red-600" />
          </div>
          <p className="tabular-nums mt-2 text-3xl font-bold text-slate-900">
            {alertasHoy ?? 0}
          </p>
        </div>
      </div>

      {/* Accesos rápidos */}
      <div className="grid gap-4 sm:grid-cols-2">
        {accesos.map((item) => {
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className="group flex items-center justify-between rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-xs transition hover:border-[#2563EB]/40 hover:shadow-sm"
            >
              <div className="flex items-start gap-4">
                <div className={`rounded-xl p-3 ${item.color}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-slate-900 group-hover:text-[#2563EB]">
                    {item.titulo}
                  </h2>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {item.descripcion}
                  </p>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-[#2563EB]" />
            </Link>
          )
        })}
      </div>
    </div>
  )
}