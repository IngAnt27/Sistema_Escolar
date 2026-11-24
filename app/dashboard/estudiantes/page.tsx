import { redirect } from 'next/navigation'
import { Users } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { FormularioEstudiante } from '@/components/estudiantes/FormularioEstudiante'
import { CarnetQRModal } from '@/components/estudiantes/CarnetQRModal'
export default async function EstudiantesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

 const { data: perfil, error: errorPerfil } = await supabase
    .from('perfiles')
    .select('rol')
    .eq('id', user.id)
    .single()

  console.log('DEBUG ESTUDIANTES:', { userId: user.id, perfil, errorPerfil })

  if (!perfil || !['director', 'docente'].includes(perfil.rol)) {
    redirect('/dashboard')
  }

const { data: estudiantes, error: errorEstudiantes } = await supabase
    .from('estudiantes')
    .select('id, codigo_personal, nombres, apellidos, grado, telefono_encargado, activo')
    .order('apellidos', { ascending: true })

  if (errorEstudiantes) {
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Estudiantes</h1>
          <p className="text-sm text-slate-500">
            Directorio e inscripción de alumnos del ciclo actual
          </p>
        </div>
        <div className="inline-flex w-fit items-center gap-2 rounded-full bg-blue-50 px-3.5 py-1.5 text-xs font-semibold text-[#2563EB]">
          <Users className="h-4 w-4" />
          <span className="tabular-nums">{estudiantes?.length ?? 0} registrados</span>
        </div>
      </div>

      {/* Formulario de inscripción */}
      <FormularioEstudiante />

      {/* Tabla de estudiantes */}
      <div className="overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-[#E2E8F0] bg-[#F8FAFC] text-xs font-semibold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-6 py-3.5">Código</th>
                <th className="px-6 py-3.5">Estudiante</th>
                <th className="px-6 py-3.5">Grado</th>
                <th className="px-6 py-3.5">Teléfono Encargado</th>
                <th className="px-6 py-3.5">Estado</th>
                <th className="px-6 py-3.5">Carnet</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0]">
              {!estudiantes || estudiantes.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-slate-500">
                    Aún no hay estudiantes registrados. Usa el formulario de arriba para inscribir al primero.
                  </td>
                </tr>
              ) : (
                estudiantes.map((est) => (
                  <tr key={est.id} className="transition hover:bg-slate-50/70">
                    <td className="tabular-nums whitespace-nowrap px-6 py-4 font-mono text-xs font-semibold text-slate-700">
                      {est.codigo_personal}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 font-medium text-slate-900">
                      {est.nombres} {est.apellidos}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-slate-600">
                      {est.grado}
                    </td>
                    <td className="tabular-nums whitespace-nowrap px-6 py-4 text-slate-600">
                      {est.telefono_encargado}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          est.activo
                            ? 'bg-emerald-50 text-emerald-800'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {est.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
  <CarnetQRModal estudiante={est} />
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