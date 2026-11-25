'use client'

import { useEffect, useRef, useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { QrCode, Printer, X, GraduationCap } from 'lucide-react'

interface EstudianteCarnet {
  codigo_personal: string
  nombres: string
  apellidos: string
  grado: string
  foto_url?: string | null
}

function escaparHtml(texto: string) {
  return texto
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

export function CarnetQRModal({ estudiante }: { estudiante: EstudianteCarnet }) {
  const [abierto, setAbierto] = useState(false)
  const qrContainerRef = useRef<HTMLDivElement>(null)

  const iniciales =
    `${estudiante.nombres?.[0] ?? ''}${estudiante.apellidos?.[0] ?? ''}`.toUpperCase() ||
    'ES'

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setAbierto(false)
    }
    if (abierto) {
      window.addEventListener('keydown', onKeyDown)
      return () => window.removeEventListener('keydown', onKeyDown)
    }
  }, [abierto])

  function imprimirCarnet() {
    const svgHtml = qrContainerRef.current?.innerHTML || ''
    const ventana = window.open('', '_blank', 'width=460,height=680')
    if (!ventana) return

    const nombreCompleto = `${estudiante.nombres} ${estudiante.apellidos}`.trim()
    const avatarHtml = estudiante.foto_url
      ? `<img src="${escaparHtml(estudiante.foto_url)}" alt="${escaparHtml(nombreCompleto)}" class="avatar-img" />`
      : `<div class="avatar-initials">${escaparHtml(iniciales)}</div>`

    ventana.document.write(`
      <!DOCTYPE html>
      <html lang="es">
        <head>
          <meta charset="UTF-8" />
          <title>Carnet - ${escaparHtml(nombreCompleto)} | KORA</title>
          <style>
            @page { size: auto; margin: 1cm; }
            * { box-sizing: border-box; }
            body {
              margin: 0;
              min-height: 100vh;
              display: flex;
              align-items: center;
              justify-content: center;
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
              background: #ffffff;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            .carnet {
              width: 300px;
              border-radius: 24px;
              background: #0f172a;
              color: #ffffff;
              padding: 28px 24px;
              text-align: center;
              border: 2px solid #2563eb;
            }
            .brand {
              font-size: 16px;
              font-weight: 900;
              letter-spacing: 0.14em;
              margin-bottom: 18px;
              color: #ffffff;
            }
            .avatar-wrap {
              width: 88px;
              height: 88px;
              margin: 0 auto 14px;
              border-radius: 999px;
              overflow: hidden;
              border: 3px solid #3b82f6;
              background: #2563eb;
              display: flex;
              align-items: center;
              justify-content: center;
            }
            .avatar-img {
              width: 100%;
              height: 100%;
              object-fit: cover;
            }
            .avatar-initials {
              font-size: 26px;
              font-weight: 800;
              color: #ffffff;
            }
            .nombre {
              font-size: 17px;
              font-weight: 700;
              line-height: 1.3;
              margin: 0;
            }
            .grado {
              display: inline-block;
              margin-top: 8px;
              padding: 4px 12px;
              border-radius: 999px;
              background: rgba(16, 185, 129, 0.2);
              color: #6ee7b7;
              font-size: 12px;
              font-weight: 600;
            }
            .codigo {
              margin-top: 10px;
              font-family: monospace;
              font-size: 13px;
              font-weight: 700;
              letter-spacing: 0.08em;
              color: #cbd5e1;
            }
            .qr-box {
              margin: 18px auto 0;
              width: fit-content;
              background: #ffffff;
              padding: 12px;
              border-radius: 16px;
            }
          </style>
        </head>
        <body>
          <div class="carnet">
            <div class="brand">KORA</div>
            <div class="avatar-wrap">${avatarHtml}</div>
            <p class="nombre">${escaparHtml(nombreCompleto)}</p>
            <div class="grado">${escaparHtml(estudiante.grado)}</div>
            <div class="codigo">${escaparHtml(estudiante.codigo_personal)}</div>
            <div class="qr-box">${svgHtml}</div>
          </div>
          <script>
            window.onload = function () {
              window.print();
              window.onafterprint = function () { window.close(); };
            };
          </script>
        </body>
      </html>
    `)
    ventana.document.close()
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setAbierto(true)}
        className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs transition hover:border-blue-600 hover:bg-blue-50/50 hover:text-blue-700"
      >
        <QrCode className="h-3.5 w-3.5" />
        <span>Carnet QR</span>
      </button>

      {abierto && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/65 p-4 backdrop-blur-xs"
          onClick={() => setAbierto(false)}
        >
          <div
            className="w-full max-w-sm overflow-hidden rounded-3xl border border-slate-200 bg-[#F1F5F9] shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Cabecera */}
            <div className="flex items-center justify-between bg-[#0f172a] px-5 py-4 text-white">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-600 text-white">
                  <QrCode className="h-4 w-4" />
                </div>
                <h3 className="text-sm font-bold">Carnet Estudiantil</h3>
              </div>
              <button
                type="button"
                onClick={() => setAbierto(false)}
                className="rounded-xl p-1.5 text-slate-400 transition hover:bg-slate-800 hover:text-white"
                aria-label="Cerrar carnet"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Tarjeta del Carnet KORA */}
            <div className="p-5">
              <div className="relative flex flex-col items-center overflow-hidden rounded-3xl border-2 border-blue-500/30 bg-[#0f172a] p-6 text-center text-white shadow-xl shadow-slate-900/20">
                <div className="pointer-events-none absolute -top-14 -right-14 h-32 w-32 rounded-full bg-blue-600/25 blur-2xl" />
                <div className="pointer-events-none absolute -bottom-14 -left-14 h-32 w-32 rounded-full bg-emerald-500/20 blur-2xl" />

                {/* Marca KORA */}
                <div className="relative flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600 text-white shadow-sm shadow-blue-600/40">
                    <GraduationCap className="h-4 w-4" />
                  </div>
                  <span className="text-sm font-black tracking-widest text-white">
                    KORA
                  </span>
                </div>

                {/* Foto o iniciales */}
                <div className="relative mt-5 flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-blue-500 to-blue-700 text-xl font-extrabold text-white shadow-lg shadow-blue-600/35 ring-4 ring-blue-500/25">
                  {estudiante.foto_url ? (
                    <img
                      src={estudiante.foto_url}
                      alt={`${estudiante.nombres} ${estudiante.apellidos}`}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    iniciales
                  )}
                </div>

                {/* Datos */}
                <p className="relative mt-3.5 text-base font-bold leading-snug text-white">
                  {estudiante.nombres} {estudiante.apellidos}
                </p>
                <span className="relative mt-2 inline-flex rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-semibold text-emerald-300 ring-1 ring-emerald-400/30">
                  {estudiante.grado}
                </span>
                <p className="tabular-nums relative mt-2.5 font-mono text-xs font-semibold tracking-wider text-slate-300">
                  {estudiante.codigo_personal}
                </p>

                {/* QR real */}
                <div
                  ref={qrContainerRef}
                  className="relative mt-5 rounded-2xl bg-white p-3 shadow-md"
                >
                  <QRCodeSVG
                    value={estudiante.codigo_personal}
                    size={150}
                    level="H"
                    includeMargin={false}
                  />
                </div>
              </div>
            </div>

            {/* Acciones */}
            <div className="flex items-center justify-end gap-2 border-t border-slate-200/80 bg-white px-5 py-3.5">
              <button
                type="button"
                onClick={() => setAbierto(false)}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
              >
                Cerrar
              </button>
              <button
                type="button"
                onClick={imprimirCarnet}
                className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-blue-600/25 transition hover:from-blue-700 hover:to-blue-800"
              >
                <Printer className="h-3.5 w-3.5" />
                <span>Imprimir carnet</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}