import { redirect } from 'next/navigation'
import { ClipboardCheck } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { EscanerQR } from '@/components/asistencia/EscanerQR'
import { BotonCerrarAsistencia } from '@/components/asistencia/BotonCerrarAsistencia'

interface EstudianteResumen {
  codigo_personal: string
  nombres: string
  apellidos: string
  grado: string
}

interface AsistenciaConEstudiante {
  id: string
  hora_entrada: string
  estado: 'presente' | 'tarde' | 'ausente'
  estudiantes: EstudianteResumen | EstudianteResumen[] | null
}
export default async function AsistenciaPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const fechaHoy = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Guatemala',
  }).format(new Date())

  const { data: asistenciasHoy } = await supabase
    .from('asistencias')
    .select(`
      id,
      hora_entrada,
      estado,
      estudiantes (
        codigo_personal,
        nombres,
        apellidos,
        grado
      )
    `)
    .eq('fecha', fechaHoy)
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Asistencia por QR
          </h1>
          <p className="text-sm text-slate-500">
            Control diario de ingresos — <span className="tabular-nums font-medium">{fechaHoy}</span>
          </p>
        </div>
        <div className="inline-flex w-fit items-center gap-2 rounded-full bg-emerald-50 px-3.5 py-1.5 text-xs font-semibold text-emerald-800">
          <ClipboardCheck className="h-4 w-4" />
          <span className="tabular-nums">{asistenciasHoy?.length ?? 0} presentes hoy</span>
        </div>
      </div>
<BotonCerrarAsistencia />
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Escáner */}
        <div className="lg:col-span-5">
          <EscanerQR />
        </div>

        {/* Lista de ingresos de hoy */}
        <div className="lg:col-span-7 overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white shadow-xs">
          <div className="border-b border-[#E2E8F0] px-6 py-4">
            <h2 className="text-base font-semibold text-slate-900">Registros de hoy</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-[#E2E8F0] bg-[#F8FAFC] text-xs font-semibold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-6 py-3">Estudiante</th>
                  <th className="px-6 py-3">Grado</th>
                  <th className="px-6 py-3">Hora</th>
                  <th className="px-6 py-3">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                {!asistenciasHoy || asistenciasHoy.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-10 text-center text-slate-500">
                      Aún no se han escaneado carnets el día de hoy.
                    </td>
                  </tr>
                ) : (
                  (asistenciasHoy as AsistenciaConEstudiante[]).map((reg) => {
                    const est = Array.isArray(reg.estudiantes)
                      ? reg.estudiantes[0]
                      : reg.estudiantes

                    return (
                      <tr key={reg.id} className="hover:bg-slate-50/70">
                        <td className="px-6 py-3.5 font-medium text-slate-900">
                          {est?.nombres} {est?.apellidos}
                        </td>
                        <td className="px-6 py-3.5 text-slate-600">
                          {est?.grado}
                        </td>
                        <td className="tabular-nums px-6 py-3.5 font-mono text-xs text-slate-600">
                          {reg.hora_entrada}
                        </td>
                        <td className="px-6 py-3.5">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${
                              reg.estado === 'presente'
                                ? 'bg-emerald-50 text-emerald-800'
                                : reg.estado === 'tarde'
                                  ? 'bg-amber-50 text-amber-800'
                                  : 'bg-red-50 text-red-800'
                            }`}
                          >
                            {reg.estado}
                          </span>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}