'use client'

import { Printer } from 'lucide-react'

export function BotonImprimirBoleta() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="inline-flex items-center gap-2 rounded-lg bg-[#2563EB] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#1D4ED8] print:hidden"
    >
      <Printer className="h-4 w-4" />
      Imprimir Boleta / PDF
    </button>
  )
}