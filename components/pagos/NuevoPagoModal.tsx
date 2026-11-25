'use client'

import { useEffect, useState } from 'react'
import { PlusCircle, X, Receipt } from 'lucide-react'

interface NuevoPagoModalProps {
  children: React.ReactNode
}

export function NuevoPagoModal({ children }: NuevoPagoModalProps) {
  const [abierto, setAbierto] = useState(false)

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setAbierto(false)
    }
    if (abierto) {
      window.addEventListener('keydown', onKeyDown)
      return () => window.removeEventListener('keydown', onKeyDown)
    }
  }, [abierto])

  return (
    <>
      <button
        type="button"
        onClick={() => setAbierto(true)}
        className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-600/25 transition hover:from-emerald-600 hover:to-teal-700 active:scale-[0.98] sm:w-auto"
      >
        <PlusCircle className="h-4 w-4" />
        <span>Registrar pago</span>
      </button>

      {abierto && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/60 p-0 sm:items-center sm:p-4"
          onClick={() => setAbierto(false)}
        >
          <div
            className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-t-3xl border border-slate-200 bg-[#F1F5F9] shadow-2xl sm:rounded-3xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Cabecera KORA */}
            <div className="flex items-center justify-between gap-3 bg-[#0f172a] px-5 py-4 text-white sm:px-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-500 text-white shadow-md shadow-emerald-500/30">
                  <Receipt className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold sm:text-lg">
                    Registrar nuevo pago
                  </h2>
                  <p className="text-xs text-slate-400">
                    Emisión de recibo y actualización de solvencia
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setAbierto(false)}
                className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-800 hover:text-white"
                aria-label="Cerrar formulario de pago"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Contenido */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6">{children}</div>
          </div>
        </div>
      )}
    </>
  )
}