import Link from 'next/link'
import { redirect } from 'next/navigation'
import {
  ArrowLeft,
  BookOpen,
  GraduationCap,
  Calendar,
  Award,
  ClipboardCheck,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import {
  ListaRevisionTarea,
  type FilaEstudianteEntrega,
} from '@/components/tareas/ListaRevisionTarea'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function RevisarTareaPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: tarea } = await supabase
    .from('tareas')
    .select('id, titulo, materia, grado, descripcion, fecha_entrega, punteo')
    .eq('id', id)
    .single()

  if (!tarea) redirect('/dashboard/tareas')

  const [{ data: estudiantes }, { data: entregas }] = await Promise.all([
    supabase
      .from('estudiantes')
      .select('id, codigo_personal, nombres, apellidos')
      .eq('activo', true)
      .eq('grado', tarea.grado)
      .order('apellidos', { ascending: true }),
    supabase
      .from('entregas_tareas')
      .select('estudiante_id, entregada, alerta_enviada')
      .eq('tarea_id', tarea.id),
  ])

  const mapa = new Map((entregas ?? []).map((e) => [e.estudiante_id, e]))

  const filas: FilaEstudianteEntrega[] = (estudiantes ?? []).map((est) => {
    const reg = mapa.get(est.id)
    return {
      ...est,
      entregada: reg?.entregada ?? false,
      alerta_enviada: reg?.alerta_enviada ?? false,
    }
  })

  return (
    <div className="mx-auto max-w-7xl space-y-7">
      {/* Navegación superior */}
      <div>
        <Link
          href="/dashboard/tareas"
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200/80 bg-white px-3.5 py-2 text-xs font-semibold text-slate-600 shadow-2xs transition hover:border-blue-300 hover:text-blue-700"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Volver a tareas</span>
        </Link>
      </div>

      {/* Tarjeta principal de la tarea en estilo Bento KORA */}
      <section className="relative overflow-hidden rounded-3xl bg-[#0f172a] p-6 text-white shadow-lg sm:p-7">
        <div className="pointer-events-none absolute -top-12 -right-12 h-40 w-40 rounded-full bg-blue-600/25 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-12 -left-12 h-36 w-36 rounded-full bg-emerald-500/15 blur-3xl" />

        <div className="relative space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold text-blue-200 ring-1 ring-white/15">
              <ClipboardCheck className="h-3.5 w-3.5 text-blue-400" />
              <span>Control de entregas</span>
            </div>

            <span className="tabular-nums inline-flex items-center gap-1.5 rounded-full bg-amber-500/20 px-3 py-1 text-xs font-bold text-amber-200 ring-1 ring-amber-400/30">
              <Award className="h-3.5 w-3.5 text-amber-300" />
              {tarea.punteo} pts
            </span>
          </div>

          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
              {tarea.titulo}
            </h1>
            {tarea.descripcion && (
              <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-300">
                {tarea.descripcion}
              </p>
            )}
          </div>

          {/* Metadatos en chips */}
          <div className="flex flex-wrap gap-2.5 pt-1 text-xs">
            <span className="inline-flex items-center gap-1.5 rounded-xl bg-white/10 px-3 py-1.5 font-semibold text-slate-100 ring-1 ring-white/10">
              <BookOpen className="h-3.5 w-3.5 text-blue-400" />
              {tarea.materia}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-xl bg-white/10 px-3 py-1.5 font-semibold text-slate-100 ring-1 ring-white/10">
              <GraduationCap className="h-3.5 w-3.5 text-emerald-400" />
              {tarea.grado}
            </span>
            <span className="tabular-nums inline-flex items-center gap-1.5 rounded-xl bg-white/10 px-3 py-1.5 font-mono font-semibold text-slate-100 ring-1 ring-white/10">
              <Calendar className="h-3.5 w-3.5 text-violet-400" />
              Entrega: {tarea.fecha_entrega}
            </span>
          </div>
        </div>
      </section>

      {/* Listado interactivo de entregas */}
      <ListaRevisionTarea tareaId={tarea.id} filasIniciales={filas} />
    </div>
  )
}