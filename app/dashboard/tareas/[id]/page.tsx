import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
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
  const { data: { user } } = await supabase.auth.getUser()
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
    <div className="space-y-6">
      <div className="space-y-2">
        <Link
          href="/dashboard/tareas"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-[#2563EB]"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Volver a tareas
        </Link>

        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            {tarea.titulo}
          </h1>
          <p className="text-sm text-slate-500">
            {tarea.materia} • {tarea.grado} • Entrega:{' '}
            <span className="tabular-nums font-medium">{tarea.fecha_entrega}</span> •{' '}
            <span className="tabular-nums font-medium">{tarea.punteo} pts</span>
          </p>
          {tarea.descripcion && (
            <p className="mt-1 text-xs text-slate-600">{tarea.descripcion}</p>
          )}
        </div>
      </div>

      <ListaRevisionTarea tareaId={tarea.id} filasIniciales={filas} />
    </div>
  )
}