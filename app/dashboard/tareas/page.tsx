import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ClipboardList, ArrowRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { FormularioCrearTarea } from '@/components/tareas/FormularioCrearTarea'

export default async function TareasPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Gestión de Tareas
        </h1>
        <p className="text-sm text-slate-500">
          Crea tareas por grado, revisa entregas y notifica incumplimientos por WhatsApp
        </p>
      </div>

      <FormularioCrearTarea grados={grados} />

      <div className="overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white shadow-xs">
        <div className="flex items-center gap-2 border-b border-[#E2E8F0] px-6 py-4">
          <ClipboardList className="h-4 w-4 text-[#2563EB]" />
          <h2 className="text-base font-semibold text-slate-900">
            Tareas asignadas
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-[#E2E8F0] bg-[#F8FAFC] text-xs font-semibold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-6 py-3">Tarea</th>
                <th className="px-6 py-3">Materia</th>
                <th className="px-6 py-3">Grado</th>
                <th className="px-6 py-3">Entrega</th>
                <th className="px-6 py-3 text-center">Punteo</th>
                <th className="px-6 py-3 text-right">Revisión</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0]">
              {!tareas || tareas.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-slate-500">
                    Aún no has creado tareas. Usa el formulario superior para asignar la primera.
                  </td>
                </tr>
              ) : (
                tareas.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/70">
                    <td className="px-6 py-3.5 font-semibold text-slate-900">
                      {t.titulo}
                    </td>
                    <td className="px-6 py-3.5 text-slate-700">{t.materia}</td>
                    <td className="px-6 py-3.5 text-slate-600">{t.grado}</td>
                    <td className="tabular-nums px-6 py-3.5 font-mono text-xs text-slate-600">
                      {t.fecha_entrega}
                    </td>
                    <td className="tabular-nums px-6 py-3.5 text-center font-semibold text-slate-900">
                      {t.punteo} pts
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      <Link
                        href={`/dashboard/tareas/${t.id}`}
                        className="inline-flex items-center gap-1 rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-semibold text-[#2563EB] transition hover:bg-blue-100"
                      >
                        Revisar entregas <ArrowRight className="h-3.5 w-3.5" />
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