import { redirect } from 'next/navigation'
import {
  Users,
  ShieldCheck,
  GraduationCap,
  Mail,
  BookOpen,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { NuevoUsuarioModal } from '@/components/usuarios/NuevoUsuarioModal'
import {
  EditarUsuarioModal,
  type UsuarioEditable,
} from '@/components/usuarios/EditarUsuarioModal'

export default async function UsuariosPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: perfilActual } = await supabase
    .from('perfiles')
    .select('rol')
    .eq('id', user.id)
    .single()

  if (perfilActual?.rol !== 'director') redirect('/dashboard')

  const { data: perfiles } = await supabase
    .from('perfiles')
    .select('id, nombre_completo, email, rol, curso, foto_url')
    .order('rol', { ascending: true })

  const lista = (perfiles ?? []) as UsuarioEditable[]
  const totalDirectores = lista.filter((u) => u.rol === 'director').length
  const totalDocentes = lista.filter((u) => u.rol === 'docente').length

  const kpis = [
    {
      titulo: 'Total Usuarios',
      valor: lista.length,
      subtexto: 'Cuentas con acceso a KORA',
      icon: Users,
      gradiente: 'from-blue-600 to-blue-700',
      sombra: 'shadow-blue-600/20',
      burbuja: 'bg-blue-500/40',
    },
    {
      titulo: 'Directores',
      valor: totalDirectores,
      subtexto: 'Acceso administrativo total',
      icon: ShieldCheck,
      gradiente: 'from-violet-500 to-purple-700',
      sombra: 'shadow-violet-600/20',
      burbuja: 'bg-violet-400/40',
    },
    {
      titulo: 'Docentes',
      valor: totalDocentes,
      subtexto: 'Gestión académica y asistencia',
      icon: GraduationCap,
      gradiente: 'from-emerald-500 to-teal-600',
      sombra: 'shadow-emerald-600/20',
      burbuja: 'bg-emerald-400/40',
    },
  ]

  return (
    <div className="mx-auto max-w-7xl space-y-7">
      {/* Encabezado + Botón Nuevo Usuario */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Gestión de Usuarios
            </h1>
            <span className="hidden items-center gap-1 rounded-full bg-slate-200/80 px-2.5 py-0.5 text-[11px] font-semibold text-slate-700 sm:inline-flex">
              <ShieldCheck className="h-3.5 w-3.5 text-blue-600" />
              Dirección
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Administra los accesos, fotografías y cursos del personal
          </p>
        </div>

        <NuevoUsuarioModal />
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

      {/* Carnets de Personal */}
      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Personal Registrado
            </h2>
            <p className="text-xs text-slate-500">
              Credenciales institucionales con curso asignado y edición rápida
            </p>
          </div>
          <span className="tabular-nums inline-flex items-center rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700 ring-1 ring-slate-200/80">
            {lista.length} {lista.length === 1 ? 'usuario' : 'usuarios'}
          </span>
        </div>

        {lista.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-3xl border border-slate-200/80 bg-white px-6 py-14 text-center shadow-xs">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
              <Users className="h-6 w-6" />
            </div>
            <p className="text-sm font-semibold text-slate-700">
              No hay usuarios registrados todavía
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Usa el botón &ldquo;Nuevo usuario&rdquo; para crear la primera
              cuenta.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {lista.map((u) => {
              const nombre = u.nombre_completo?.trim() || 'Usuario KORA'
              const iniciales = nombre
                .split(' ')
                .slice(0, 2)
                .map((p) => p[0])
                .join('')
                .toUpperCase()
              const esActual = u.id === user.id
              const esDirector = u.rol === 'director'

              return (
                <article
                  key={u.id}
                  className="group flex flex-col overflow-hidden rounded-3xl border border-slate-200/90 bg-white shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-blue-300 hover:shadow-xl hover:shadow-slate-200/70"
                >
                  {/* Cabecera tipo Carnet KORA */}
                  <div className="relative bg-[#0f172a] px-5 pt-4 pb-16 text-white">
                    <div
                      className={`pointer-events-none absolute -top-10 -right-10 h-32 w-32 rounded-full blur-2xl ${
                        esDirector ? 'bg-violet-500/35' : 'bg-blue-500/35'
                      }`}
                    />
                    <div className="pointer-events-none absolute -bottom-10 -left-10 h-28 w-28 rounded-full bg-emerald-500/20 blur-2xl" />

                    {/* Ranura de porta-carnet */}
                    <div className="relative mx-auto mb-3 h-1.5 w-12 rounded-full bg-white/20 ring-1 ring-white/10" />

                    {/* Marca y etiqueta */}
                    <div className="relative flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-blue-600 text-white shadow-xs">
                          <GraduationCap className="h-3.5 w-3.5" />
                        </div>
                        <span className="text-xs font-black tracking-widest text-white">
                          KORA
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {esActual && (
                          <span className="rounded-full bg-blue-500/25 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-blue-200 ring-1 ring-blue-400/30">
                            Tú
                          </span>
                        )}
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ring-1 ${
                            esDirector
                              ? 'bg-violet-500/25 text-violet-200 ring-violet-400/30'
                              : 'bg-emerald-500/25 text-emerald-200 ring-emerald-400/30'
                          }`}
                        >
                          {esDirector ? (
                            <ShieldCheck className="h-3 w-3" />
                          ) : (
                            <GraduationCap className="h-3 w-3" />
                          )}
                          {u.rol}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Cuerpo del Carnet */}
                  <div className="flex flex-1 flex-col items-center px-5 pb-5 text-center">
                    {/* Foto grande centrada */}
                    <div className="relative z-10 -mt-14 mb-3 flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-3xl border-4 border-white bg-gradient-to-br from-blue-600 to-slate-900 text-2xl font-extrabold text-white shadow-lg ring-1 ring-slate-200/80">
                      {u.foto_url ? (
                        <img
                          src={u.foto_url}
                          alt={nombre}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        iniciales || 'US'
                      )}
                    </div>

                    {/* Nombre */}
                    <h3 className="w-full truncate text-lg font-bold tracking-tight text-slate-900">
                      {nombre}
                    </h3>

                    {/* Correo */}
                    <p className="mt-1 flex max-w-full items-center justify-center gap-1.5 text-xs text-slate-500">
                      <Mail className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                      <span className="truncate">
                        {u.email || 'Sin correo registrado'}
                      </span>
                    </p>

                    {/* Bloque del Curso */}
                    <div className="mt-4 w-full rounded-2xl bg-slate-50 px-4 py-3 text-left ring-1 ring-slate-100">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-blue-600 shadow-2xs ring-1 ring-slate-200/70">
                          <BookOpen className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            Curso asignado
                          </p>
                          <p className="truncate text-sm font-semibold text-slate-800">
                            {u.curso || 'Sin curso asignado'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Pie del Carnet */}
                  <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/70 px-5 py-3">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                      Personal Activo
                    </span>
                    <EditarUsuarioModal usuario={u} />
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}