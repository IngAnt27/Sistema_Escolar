'use client'

import { useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { QrCode, Printer, X } from 'lucide-react'

interface EstudianteCarnet {
  codigo_personal: string
  nombres: string
  apellidos: string
  grado: string
}

export function CarnetQRModal({ estudiante }: { estudiante: EstudianteCarnet }) {
  const [abierto, setAbierto] = useState(false)

  return (
    <>
      <button
        type="button"
        onClick={() => setAbierto(true)}
        className="inline-flex items-center gap-1.5 rounded-lg border border-[#E2E8F0] bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-[#2563EB] hover:text-[#2563EB]"
      >
        <QrCode className="h-3.5 w-3.5" />
        Carnet QR
      </button>

      {abierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs print:bg-white print:p-0">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl print:shadow-none">
            <div className="mb-4 flex items-center justify-between print:hidden">
              <h3 className="text-sm font-semibold text-slate-900">Carnet Estudiantil</h3>
              <button
                type="button"
                onClick={() => setAbierto(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Diseño del Carnet */}
            <div className="flex flex-col items-center rounded-xl border-2 border-[#2563EB]/20 bg-[#F8FAFC] p-6 text-center">
              <span className="text-[11px] font-bold uppercase tracking-widest text-[#2563EB]">
                Identificación Escolar
              </span>

              <div className="my-4 rounded-xl bg-white p-3 shadow-xs">
                <QRCodeSVG
                  value={estudiante.codigo_personal}
                  size={170}
                  level="H"
                  includeMargin={false}
                />
              </div>

              <p className="text-base font-bold text-slate-900">
                {estudiante.nombres} {estudiante.apellidos}
              </p>
              <p className="text-xs font-medium text-slate-600">{estudiante.grado}</p>
              <p className="tabular-nums mt-2 rounded-full bg-blue-50 px-3 py-0.5 font-mono text-xs font-semibold text-[#2563EB]">
                {estudiante.codigo_personal}
              </p>
            </div>

            <div className="mt-5 flex justify-end gap-2 print:hidden">
              <button
                type="button"
                onClick={() => setAbierto(false)}
                className="rounded-lg border border-[#E2E8F0] px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cerrar
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#2563EB] px-4 py-2 text-xs font-semibold text-white hover:bg-[#1D4ED8]"
              >
                <Printer className="h-3.5 w-3.5" />
                Imprimir
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}