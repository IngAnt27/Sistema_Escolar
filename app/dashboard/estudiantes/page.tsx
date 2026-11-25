import { redirect } from 'next/navigation'
import { Users, UserCheck, GraduationCap } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { FormularioEstudiante } from '@/components/estudiantes/FormularioEstudiante'
import { NuevoEstudianteModal } from '@/components/estudiantes/NuevoEstudianteModal'
import { DirectorioEstudiantes } from '@/components/estudiantes/DirectorioEstudiantes'

export default async function EstudiantesPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: perfil } = await supabase
    .from('perfiles')
    .select('rol')
    .eq('id', user.id)
    .single()

  if (!perfil || !['director', 'docente'].includes(perfil.rol)) {
    redirect('/dashboard')
  }

  const { data: estudiantes } = await supabase
    .from('estudiantes')
    .select(
  'id, codigo_personal, nombres, apellidos, grado, telefono_encargado, activo, foto_url'
)
    .order('apellidos', { ascending: true })

  const lista = estudiantes ?? []
  const totalRegistrados = lista.length
  const totalActivos = lista.filter((e) => e.activo).length
  const gradosUnicos = new Set(
    lista.map((e) => e.grado?.trim() || 'Sin grado asignado')
  ).size

  const kpis = [
    {
      titulo: 'Total Estudiantes',
      valor: totalRegistrados,
      subtexto: 'Ciclo escolar actual',
      icon: Users,
      gradiente: 'from-blue-600 to-blue-700',
      sombra: 'shadow-blue-600/20',
      burbuja: 'bg-blue-500/40',
    },
    {
      titulo: 'Estudiantes Activos',
      valor: totalActivos,
      subtexto: `${totalRegistrados - totalActivos} inactivos`,
      icon: UserCheck,
      gradiente: 'from-emerald-500 to-teal-600',
      sombra: 'shadow-emerald-600/20',
      burbuja: 'bg-emerald-400/40',
    },
    {
      titulo: 'Grados Registrados',
      valor: gradosUnicos,
      subtexto: 'Secciones con alumnos',
      icon: GraduationCap,
      gradiente: 'from-violet-500 to-purple-700',
      sombra: 'shadow-violet-600/20',
      burbuja: 'bg-violet-400/40',
    },
  ]

  return (
    <div className="mx-auto max-w-7xl space-y-7">
      {/* Encabezado + Botón flotante de nuevo estudiante */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Directorio de Estudiantes
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Organización por grado, búsqueda rápida y emisión de carnets QR
          </p>
        </div>

        <NuevoEstudianteModal>
          <FormularioEstudiante />
        </NuevoEstudianteModal>
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

      {/* Directorio con buscador destacado + tarjetas por grado */}
      <DirectorioEstudiantes estudiantes={lista} />
    </div>
  )
}