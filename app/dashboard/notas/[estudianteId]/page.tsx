import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { BotonImprimirBoleta } from '@/components/notas/BotonImprimirBoleta'

interface PageProps {
  params: Promise<{ estudianteId: string }>
}

interface ResumenCurso {
  materia: string
  cantidadTareas: number
  punteoAsignado: number
  notaFinal: number
  aprobado: boolean
}

export default async function BoletaEstudiantePage({ params }: PageProps) {
  const { estudianteId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // 1. Obtener datos del estudiante
  const { data: estudiante } = await supabase
    .from('estudiantes')
    .select('id, codigo_personal, nombres, apellidos, grado')
    .eq('id', estudianteId)
    .single()

  if (!estudiante) redirect('/dashboard/notas')

  // 2. Obtener tareas de su grado, sus entregas y sus asistencias
  const [
    { data: tareas },
    { data: entregas },
    { data: asistencias },
  ] = await Promise.all([
    supabase
      .from('tareas')
      .select('id, materia, punteo')
      .eq('grado', estudiante.grado),
    supabase
      .from('entregas_tareas')
      .select('tarea_id, entregada, nota_obtenida')
      .eq('estudiante_id', estudiante.id),
    supabase
      .from('asistencias')
      .select('estado')
      .eq('estudiante_id', estudiante.id),
  ])

  const listaTareas = tareas ?? []
  const mapaEntregas = new Map(
    (entregas ?? []).map((e) => [e.tarea_id, e])
  )

  // 3. Agrupar por curso (materia)
  const cursosMap = new Map<
    string,
    { tareas: number; asignado: number; obtenido: number }
  >()

  for (const t of listaTareas) {
    const actual = cursosMap.get(t.materia) ?? {
      tareas: 0,
      asignado: 0,
      obtenido: 0,
    }
    const ent = mapaEntregas.get(t.id)
    const punteoTarea = Number(t.punteo || 0)

    const notaTarea =
      ent && Number(ent.nota_obtenida) > 0
        ? Number(ent.nota_obtenida)
        : ent?.entregada
        ? punteoTarea
        : 0

    cursosMap.set(t.materia, {
      tareas: actual.tareas + 1,
      asignado: actual.asignado + punteoTarea,
      obtenido: actual.obtenido + notaTarea,
    })
  }

  const cursos: ResumenCurso[] = Array.from(cursosMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([materia, datos]) => {
      const notaFinal = Math.min(100, Math.round(datos.obtenido))
      return {
        materia,
        cantidadTareas: datos.tareas,
        punteoAsignado: Math.round(datos.asignado),
        notaFinal,
        aprobado: notaFinal >= 61,
      }
    })

  // 4. Métricas del bloque
  const cursosAprobados = cursos.filter((c) => c.aprobado).length
  const promedioBloque =
    cursos.length > 0
      ? Math.round(
          cursos.reduce((acc, c) => acc + c.notaFinal, 0) / cursos.length
        )
      : 0

  const listaAsistencias = asistencias ?? []
  const diasAsistidos = listaAsistencias.filter(
    (a) => a.estado === 'presente' || a.estado === 'tarde'
  ).length
  const porcentajeAsistencia =
    listaAsistencias.length > 0
      ? Math.round((diasAsistidos / listaAsistencias.length) * 100)
      : 100

  const anioActual = new Date().getFullYear()

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      {/* Barra superior de acciones (oculta al imprimir) */}
      <div className="flex items-center justify-between print:hidden">
        <Link
          href="/dashboard/notas"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-[#4338CA]"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Volver al cuadro de notas
        </Link>
        <BotonImprimirBoleta />
      </div>

      {/* Hoja de Boleta */}
      <div className="rounded-2xl border border-[#E2E8F0] bg-white p-8 shadow-xs print:rounded-none print:border-none print:p-0 print:shadow-none">
        {/* Encabezado Institucional */}
        <div className="flex items-center justify-between gap-4">
          {/* Logo del Colegio */}
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-[#4338CA] text-2xl font-extrabold tracking-tight text-white">
            NC
          </div>

          {/* Datos del Establecimiento */}
          <div className="text-center">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">
              República de Guatemala | Ministerio de Educación
            </p>
            <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-900">
              Nombre del Colegio
            </h1>
            <p className="mt-0.5 text-xs text-slate-500">
              Dirección y teléfono del establecimiento
            </p>
          </div>

          {/* Espacio Logo MINEDUC */}
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl border border-dashed border-slate-300 text-center text-[11px] font-medium leading-tight text-slate-400">
            Logo
            <br />
            MINEDUC
          </div>
        </div>

        {/* Línea divisoria y barra de título */}
        <div className="mt-6 border-t-2 border-[#4338CA] pt-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-extrabold uppercase tracking-tight text-slate-900">
              Boleta de Calificaciones
            </h2>
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-slate-500">
                Ciclo escolar <span className="tabular-nums">{anioActual}</span>
              </span>
              <span className="rounded-full bg-[#4338CA] px-4 py-1 text-xs font-bold uppercase tracking-wider text-white">
                Bloque I
              </span>
            </div>
          </div>
        </div>

        {/* Tarjeta de datos del estudiante */}
        <div className="mt-5 grid grid-cols-2 gap-x-8 gap-y-4 rounded-2xl bg-[#F4F5FA] px-6 py-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              Estudiante
            </p>
            <p className="mt-0.5 text-sm font-bold text-slate-900">
              {estudiante.apellidos}, {estudiante.nombres}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              Código Personal
            </p>
            <p className="tabular-nums mt-0.5 font-mono text-sm font-bold text-slate-900">
              {estudiante.codigo_personal}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              Grado y Sección
            </p>
            <p className="mt-0.5 text-sm font-bold text-slate-900">
              {estudiante.grado}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              Jornada
            </p>
            <p className="mt-0.5 text-sm font-bold text-slate-900">Matutina</p>
          </div>
        </div>

        {/* Tabla de Cursos y Rendimiento */}
        <div className="mt-6 overflow-hidden rounded-xl border border-slate-100">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-[#4338CA] text-xs font-bold text-white">
                <th className="px-4 py-3">Curso</th>
                <th className="px-3 py-3 text-center">Tareas</th>
                <th className="px-3 py-3 text-center">Evaluado</th>
                <th className="px-3 py-3 text-center">Total (100)</th>
                <th className="w-44 px-4 py-3">Rendimiento</th>
              </tr>
            </thead>
            <tbody>
              {cursos.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-8 text-center text-xs text-slate-500"
                  >
                    Aún no hay cursos con tareas registradas para {estudiante.grado}.
                  </td>
                </tr>
              ) : (
                cursos.map((c, idx) => (
                  <tr
                    key={c.materia}
                    className={idx % 2 === 1 ? 'bg-[#F4F5FA]' : 'bg-white'}
                  >
                    <td className="px-4 py-2.5 font-medium text-slate-900 capitalize">
                      {c.materia}
                    </td>
                    <td className="tabular-nums px-3 py-2.5 text-center text-slate-600">
                      {c.cantidadTareas}
                    </td>
                    <td className="tabular-nums px-3 py-2.5 text-center text-slate-600">
                      {c.punteoAsignado}
                    </td>
                    <td className="tabular-nums px-3 py-2.5 text-center font-bold text-slate-900">
                      {c.notaFinal}
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="h-2.5 w-full overflow-hidden rounded-full bg-indigo-100">
                        <div
                          className={`h-full rounded-full ${
                            c.aprobado ? 'bg-[#4338CA]' : 'bg-rose-500'
                          }`}
                          style={{ width: `${c.notaFinal}%` }}
                        />
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* 4 Tarjetas de Resumen Inferior */}
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-xl bg-[#F4F5FA] px-4 py-3.5">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              Promedio del Bloque
            </p>
            <p className="tabular-nums mt-1.5 text-2xl font-extrabold text-[#4338CA]">
              {promedioBloque}
            </p>
          </div>

          <div className="rounded-xl bg-[#F4F5FA] px-4 py-3.5">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              Asistencia
            </p>
            <p className="tabular-nums mt-1.5 text-2xl font-extrabold text-slate-900">
              {porcentajeAsistencia}%
            </p>
          </div>

          <div className="rounded-xl bg-[#F4F5FA] px-4 py-3.5">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              Cursos Aprobados
            </p>
            <p className="tabular-nums mt-1.5 text-2xl font-extrabold text-slate-900">
              {cursosAprobados} de {cursos.length}
            </p>
          </div>

          <div className="rounded-xl bg-[#F4F5FA] px-4 py-3.5">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              Observaciones
            </p>
            <div className="mt-2 h-6" />
          </div>
        </div>

        {/* Nota de escala */}
        <p className="mt-3 text-[11px] text-slate-400">
          Escala de calificación de 0 a 100 puntos. Nota mínima de aprobación: 61 puntos.
        </p>

        {/* Firmas y Sello del Colegio */}
        <div className="mt-10 grid grid-cols-3 items-end gap-6 pt-2">
          <div className="text-center">
            <div className="border-t border-slate-900 pt-2 text-xs font-bold text-slate-900">
              Padre, madre o encargado
            </div>
          </div>

          <div className="flex justify-center">
            <div className="flex h-28 w-28 items-center justify-center rounded-full border border-dashed border-slate-300 text-center text-xs font-medium leading-tight text-slate-400">
              Sello del
              <br />
              colegio
            </div>
          </div>

          <div className="text-center">
            <div className="border-t border-slate-900 pt-2 text-xs font-bold text-slate-900">
              Director(a)
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}