'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Printer, Calendar } from 'lucide-react'

interface ControlesInformeProps {
  periodoActual: string
  gradoActual: string
  gradosDisponibles: string[]
}

const PERIODOS = [
  { id: 'semanal', label: 'Semanal (7 días)' },
  { id: 'mensual', label: 'Mensual (Mes actual)' },
  { id: 'trimestral', label: 'Trimestral (3 meses)' },
]

export function ControlesInforme({
  periodoActual,
  gradoActual,
  gradosDisponibles,
}: ControlesInformeProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  function actualizarFiltro(clave: string, valor: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (valor === 'todos') {
      params.delete(clave)
    } else {
      params.set(clave, valor)
    }
    router.push(`/dashboard/informes?${params.toString()}`)
  }

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-[#E2E8F0] bg-white p-4 shadow-xs sm:flex-row sm:items-center sm:justify-between print:hidden">
      <div className="flex flex-wrap items-center gap-2">
        <div className="inline-flex items-center gap-1.5 rounded-xl bg-slate-100 p-1">
          {PERIODOS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => actualizarFiltro('periodo', p.id)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                periodoActual === p.id
                  ? 'bg-white text-[#2563EB] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1.5">
          <Calendar className="h-4 w-4 text-slate-400" />
          <select
            value={gradoActual}
            onChange={(e) => actualizarFiltro('grado', e.target.value)}
            className="rounded-lg border border-[#E2E8F0] bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 outline-none focus:border-[#2563EB]"
          >
            <option value="todos">Todos los grados</option>
            {gradosDisponibles.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </div>
      </div>

      <button
        type="button"
        onClick={() => window.print()}
        className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#2563EB] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#1D4ED8]"
      >
        <Printer className="h-4 w-4" />
        Imprimir / PDF
      </button>
    </div>
  )
}