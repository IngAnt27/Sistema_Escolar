'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Printer, Filter } from 'lucide-react'

interface FiltrosNotasProps {
  gradoActual: string
  materiaActual: string
  grados: string[]
  materias: string[]
}

export function FiltrosNotas({
  gradoActual,
  materiaActual,
  grados,
  materias,
}: FiltrosNotasProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  function cambiarFiltro(clave: string, valor: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (!valor || valor === 'todas') {
      params.delete(clave)
    } else {
      params.set(clave, valor)
    }
    router.push(`/dashboard/notas?${params.toString()}`)
  }

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-[#E2E8F0] bg-white p-4 shadow-xs sm:flex-row sm:items-center sm:justify-between print:hidden">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
          <Filter className="h-4 w-4" />
          <span>Filtrar:</span>
        </div>

        <select
          value={gradoActual}
          onChange={(e) => cambiarFiltro('grado', e.target.value)}
          className="rounded-lg border border-[#E2E8F0] bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 outline-none focus:border-[#2563EB]"
        >
          <option value="todas">Todos los grados</option>
          {grados.map((g) => (
            <option key={g} value={g}>
              {g}
            </option>
          ))}
        </select>

        <select
          value={materiaActual}
          onChange={(e) => cambiarFiltro('materia', e.target.value)}
          className="rounded-lg border border-[#E2E8F0] bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 outline-none focus:border-[#2563EB]"
        >
          <option value="todas">Todas las materias</option>
          {materias.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
      </div>

      <button
        type="button"
        onClick={() => window.print()}
        className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#2563EB] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#1D4ED8]"
      >
        <Printer className="h-4 w-4" />
        Imprimir cuadro / PDF
      </button>
    </div>
  )
}