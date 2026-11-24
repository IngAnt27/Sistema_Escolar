import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Award, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { FiltrosNotas } from '@/components/notas/FiltrosNotas'

interface PageProps {
  searchParams: Promise<{ grado?: string; materia?: string }>
}

export default async function NotasPage({ searchParams }: PageProps) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const params = await searchParams
  const gradoFiltro = params.grado ?? 'todas'
  const materiaFiltro = params.materia ?? 'todas'

  const [
    { data: estudiantes },
    { data: tareas },
    { data: entregas },
  ] = await Promise.all([
    supabase
      .from('estudiantes')
      .select('id, codigo_personal, nombres, apellidos, grado')
      .eq('activo', true)
      .order('apellidos', { ascending: true }),
    supabase
      .from('tareas')
      .select('id, titulo, materia, grado, punteo')
      .order('fecha_entrega', { ascending: true }),
    supabase
      .from('entregas_tareas')
      .select('tarea_id, estudiante_id, entregada, nota_obtenida'),
  ])

  const listaEstudiantes = estudiantes ?? []
  const listaTareas = tareas ?? []
  const listaEntregas = entregas ?? []

  const grados = Array.from(new Set(listaEstudiantes.map((e) => e.grado))).sort()
  const materias = Array.from(new Set(listaTareas.map((t) => t.materia))).sort()

  // Filtrar estudiantes y tareas según selección
  const estudiantesFiltrados =
    gradoFiltro === 'todas'
      ? listaEstudiantes
      : listaEstudiantes.filter((e) => e.grado === gradoFiltro)

  const tareasFiltradas = listaTareas.filter((t) => {
    const coincideGrado = gradoFiltro === 'todas' || t.grado === gradoFiltro
    const coincideMateria = materiaFiltro === 'todas' || t.materia === materiaFiltro
    return coincideGrado && coincideMateria
  })

  const idsTareasFiltradas = new Set(tareasFiltradas.map((t) => t.id))
  const punteoAsignado = tareasFiltradas.reduce(
    (acc, t) => acc + Number(t.punteo || 0),
    0
  )

  // Mapa rápido de entregas: `${estudiante_id}_${tarea_id}` -> nota
  const mapaNotas = new Map<string, number>()
  for (const ent of listaEntregas) {
    if (idsTareasFiltradas.has(ent.tarea_id)) {
      // Si se marcó entregada pero nota_obtenida es 0, toma el punteo de la tarea como respaldo
      const tarea = tareasFiltradas.find((t) => t.id === ent.tarea_id)
      const notaFinal =
        Number(ent.nota_obtenida) > 0
          ? Number(ent.nota_obtenida)
          : ent.entregada && tarea
          ? Number(tarea.punteo)
          : 0
      mapaNotas.set(`${ent.estudiante_id}_${ent.tarea_id}`, notaFinal)
    }
  }

  // Calcular acumulado por estudiante (tope 100 pts, mínimo 61 para aprobar)
  const filas = estudiantesFiltrados.map((est) => {
    const tareasDelGrado = tareasFiltradas.filter((t) => t.grado === est.grado)
    const sumaBruta = tareasDelGrado.reduce((acc, t) => {
      return acc + (mapaNotas.get(`${est.id}_${t.id}`) ?? 0)
    }, 0)

    const acumulado = Math.min(100, Number(sumaBruta.toFixed(2)))
    const aprobado = acumulado >= 61

    return {
      ...est,
      tareasCount: tareasDelGrado.length,
      acumulado,
      aprobado,
    }
  })

  const aprobados = filas.filter((f) => f.aprobado).length
  const reprobados = filas.length - aprobados
  const promedio =
    filas.length > 0
      ? Math.round(filas.reduce((acc, f) => acc + f.acumulado, 0) / filas.length)
      : 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Cuadro de Notas
        </h1>
        <p className="text-sm text-slate-500">
          Acumulado de tareas (máximo 100 pts • mínimo 61 pts para aprobar)
        </p>
      </div>

      <FiltrosNotas
        gradoActual={gradoFiltro}
        materiaActual={materiaFiltro}
        grados={grados}
        materias={materias}
      />

      {punteoAsignado > 100 && gradoFiltro !== 'todas' && materiaFiltro !== 'todas' && (
        <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-medium text-amber-900">
          <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" />
          <span>
            Las tareas asignadas en {materiaFiltro} ({gradoFiltro}) suman{' '}
            <strong className="tabular-nums">{punteoAsignado} pts</strong>. El sistema aplica un tope máximo de 100 pts por estudiante.
          </span>
        </div>
      )}

      {/* Bento KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-xs">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Promedio General
          </span>
          <p className="tabular-nums mt-2 text-3xl font-bold text-slate-900">
            {promedio} <span className="text-sm font-normal text-slate-400">/ 100</span>
          </p>
        </div>

        <div className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-xs">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Aprobados (≥ 61)
          </span>
          <p className="tabular-nums mt-2 text-3xl font-bold text-emerald-600">
            {aprobados}
          </p>
        </div>

        <div className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-xs">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Reprobados (&lt; 61)
          </span>
          <p className="tabular-nums mt-2 text-3xl font-bold text-red-600">
            {reprobados}
          </p>
        </div>

        <div className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-xs">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Puntos Asignados
          </span>
          <p className="tabular-nums mt-2 text-3xl font-bold text-[#2563EB]">
            {punteoAsignado} <span className="text-sm font-normal text-slate-400">pts</span>
          </p>
        </div>
      </div>

      {/* Tabla de Notas */}
      <div className="overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white shadow-xs">
        <div className="flex items-center justify-between border-b border-[#E2E8F0] px-6 py-4">
          <div className="flex items-center gap-2">
            <Award className="h-4 w-4 text-[#2563EB]" />
            <h2 className="text-base font-semibold text-slate-900">
              Consolidado por Estudiante
            </h2>
          </div>
          <Link
            href="/dashboard/tareas"
            className="text-xs font-semibold text-[#2563EB] hover:underline print:hidden"
          >
            Ir a calificar tareas →
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-[#E2E8F0] bg-[#F8FAFC] text-xs font-semibold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-6 py-3.5">Estudiante</th>
                <th className="px-6 py-3.5">Grado</th>
                <th className="px-4 py-3.5 text-center">Tareas</th>
                <th className="px-6 py-3.5">Progreso (100 pts)</th>
                <th className="px-4 py-3.5 text-right">Nota Final</th>
                <th className="px-6 py-3.5 text-right">Estado</th>
                <th className="px-6 py-3.5 text-right print:hidden">Boleta</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0]">
              {filas.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-10 text-center text-slate-500">
                    No hay estudiantes para los filtros seleccionados.
                  </td>
                </tr>
              ) : (
                filas.map((f) => (
                  <tr key={f.id} className="hover:bg-slate-50/70">
                    <td className="px-6 py-3.5 font-medium text-slate-900">
                      {f.apellidos}, {f.nombres}
                      <span className="tabular-nums block font-mono text-xs font-normal text-slate-500">
                        {f.codigo_personal}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-slate-600">{f.grado}</td>
                    <td className="tabular-nums px-4 py-3.5 text-center text-slate-600">
                      {f.tareasCount}
                    </td>
                    <td className="px-6 py-3.5">
                      <div className="h-2 w-32 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className={`h-full rounded-full ${
                            f.aprobado ? 'bg-emerald-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${f.acumulado}%` }}
                        />
                      </div>
                    </td>
                    <td className="tabular-nums px-4 py-3.5 text-right text-base font-bold text-slate-900">
                      {f.acumulado} pts
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      {f.aprobado ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
                          <CheckCircle2 className="h-3.5 w-3.5" /> Aprobado
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-semibold text-red-800">
                          <XCircle className="h-3.5 w-3.5" /> Reprobado
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-3.5 text-right print:hidden">
  <Link
    href={`/dashboard/notas/${f.id}`}
    className="inline-flex items-center rounded-lg border border-[#E2E8F0] bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-[#2563EB] hover:text-[#2563EB]"
  >
    Ver boleta
  </Link>
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