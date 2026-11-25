'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  Users,
  Search,
  X,
  BookOpen,
  Phone,
  Hash,
  ArrowRight,
  GraduationCap,
  Printer,
} from 'lucide-react'
import { CarnetQRModal } from '@/components/estudiantes/CarnetQRModal'

export interface EstudianteItem {
  id: string
  codigo_personal: string
  nombres: string
  apellidos: string
  grado: string
  telefono_encargado: string
  activo: boolean
  foto_url?: string | null
}

interface DirectorioEstudiantesProps {
  estudiantes: EstudianteItem[]
}

function normalizar(texto: string) {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

function escaparHtml(texto: string) {
  return texto
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

export function DirectorioEstudiantes({
  estudiantes,
}: DirectorioEstudiantesProps) {
  const [busquedaGlobal, setBusquedaGlobal] = useState('')
  const [gradoActivo, setGradoActivo] = useState<string | null>(null)
  const [busquedaGrado, setBusquedaGrado] = useState('')

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setGradoActivo(null)
    }
    if (gradoActivo) {
      window.addEventListener('keydown', onKeyDown)
      return () => window.removeEventListener('keydown', onKeyDown)
    }
  }, [gradoActivo])

  const gradosOrdenados = useMemo(() => {
    const mapa = new Map<string, EstudianteItem[]>()
    for (const est of estudiantes) {
      const nombreGrado = est.grado?.trim() || 'Sin grado asignado'
      const grupo = mapa.get(nombreGrado) ?? []
      grupo.push(est)
      mapa.set(nombreGrado, grupo)
    }
    return Array.from(mapa.entries()).sort(([a], [b]) =>
      a.localeCompare(b, 'es', { numeric: true, sensitivity: 'base' })
    )
  }, [estudiantes])

  const resultadosGlobal = useMemo(() => {
    const termino = normalizar(busquedaGlobal.trim())
    if (!termino) return []
    return estudiantes.filter((est) => {
      const texto = normalizar(
        `${est.nombres} ${est.apellidos} ${est.codigo_personal} ${est.grado} ${est.telefono_encargado}`
      )
      return texto.includes(termino)
    })
  }, [estudiantes, busquedaGlobal])

  const alumnosGradoActivo = useMemo(() => {
    if (!gradoActivo) return []
    const encontrado = gradosOrdenados.find(([g]) => g === gradoActivo)
    const lista = encontrado ? encontrado[1] : []
    const termino = normalizar(busquedaGrado.trim())
    if (!termino) return lista
    return lista.filter((est) => {
      const texto = normalizar(
        `${est.nombres} ${est.apellidos} ${est.codigo_personal} ${est.telefono_encargado}`
      )
      return texto.includes(termino)
    })
  }, [gradoActivo, gradosOrdenados, busquedaGrado])

  const totalAlumnosGradoActivo = useMemo(() => {
    if (!gradoActivo) return 0
    return gradosOrdenados.find(([g]) => g === gradoActivo)?.[1].length ?? 0
  }, [gradoActivo, gradosOrdenados])

  function abrirGrado(grado: string) {
    setBusquedaGrado('')
    setGradoActivo(grado)
  }

  function imprimirListadoGrado(grado: string, alumnos: EstudianteItem[]) {
    const ventana = window.open('', '_blank', 'width=900,height=700')
    if (!ventana) return

    const fecha = new Date().toLocaleDateString('es-GT', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    })

    const filas = alumnos
      .map(
        (est, index) => `
          <tr>
            <td style="text-align:center;color:#64748b;">${index + 1}</td>
            <td style="font-family:monospace;font-weight:600;">${escaparHtml(est.codigo_personal)}</td>
            <td style="font-weight:600;">${escaparHtml(`${est.apellidos}, ${est.nombres}`)}</td>
            <td>${escaparHtml(est.telefono_encargado || '—')}</td>
            <td style="text-align:center;">
              <span class="badge ${est.activo ? 'activo' : 'inactivo'}">
                ${est.activo ? 'Activo' : 'Inactivo'}
              </span>
            </td>
            <td></td>
          </tr>
        `
      )
      .join('')

    ventana.document.write(`
      <!DOCTYPE html>
      <html lang="es">
        <head>
          <meta charset="UTF-8" />
          <title>Listado - ${escaparHtml(grado)} | KORA</title>
          <style>
            @page { size: letter; margin: 1.5cm; }
            * { box-sizing: border-box; }
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
              color: #0f172a;
              margin: 0;
              padding: 0;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            .header {
              display: flex;
              justify-content: space-between;
              align-items: flex-end;
              border-bottom: 2px solid #0f172a;
              padding-bottom: 12px;
              margin-bottom: 18px;
            }
            .brand {
              font-size: 20px;
              font-weight: 900;
              letter-spacing: 0.08em;
              color: #0f172a;
            }
            .subtitle {
              font-size: 12px;
              color: #475569;
              margin-top: 2px;
            }
            .meta {
              text-align: right;
              font-size: 12px;
              color: #334155;
              line-height: 1.5;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              font-size: 12px;
            }
            th {
              background: #0f172a;
              color: #ffffff;
              text-align: left;
              padding: 8px 10px;
              font-size: 11px;
              text-transform: uppercase;
              letter-spacing: 0.04em;
            }
            td {
              border-bottom: 1px solid #cbd5e1;
              padding: 8px 10px;
            }
            tr:nth-child(even) td {
              background: #f8fafc;
            }
            .badge {
              display: inline-block;
              padding: 2px 8px;
              border-radius: 999px;
              font-size: 10px;
              font-weight: 700;
            }
            .activo { background: #dcfce7; color: #166534; }
            .inactivo { background: #f1f5f9; color: #475569; }
            .footer {
              margin-top: 28px;
              display: flex;
              justify-content: space-between;
              font-size: 11px;
              color: #64748b;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="brand">KORA</div>
              <div class="subtitle">Listado Oficial de Estudiantes — <strong>${escaparHtml(grado)}</strong></div>
            </div>
            <div class="meta">
              <div><strong>Fecha:</strong> ${escaparHtml(fecha)}</div>
              <div><strong>Total alumnos:</strong> ${alumnos.length}</div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th style="width:36px;text-align:center;">#</th>
                <th style="width:110px;">Código</th>
                <th>Apellidos y Nombres</th>
                <th style="width:125px;">Tel. Encargado</th>
                <th style="width:80px;text-align:center;">Estado</th>
                <th style="width:130px;">Firma / Obs.</th>
              </tr>
            </thead>
            <tbody>
              ${filas}
            </tbody>
          </table>

          <div class="footer">
            <span>Generado desde KORA</span>
            <span>Página 1</span>
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

  if (estudiantes.length === 0) {
    return (
      <section className="flex flex-col items-center justify-center rounded-3xl border border-slate-200/80 bg-white px-6 py-14 text-center shadow-xs">
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
          <Users className="h-6 w-6" />
        </div>
        <p className="text-sm font-semibold text-slate-700">
          Aún no hay estudiantes registrados
        </p>
        <p className="mt-1 max-w-sm text-xs text-slate-500">
          Usa el formulario de arriba para inscribir al primer alumno y generar
          su carnet QR.
        </p>
      </section>
    )
  }

  const hayBusquedaGlobal = busquedaGlobal.trim().length > 0

  return (
    <div className="space-y-6">
      {/* Buscador global destacado */}
      <div className="relative overflow-hidden rounded-3xl bg-[#0f172a] p-5 text-white shadow-lg shadow-slate-900/10 sm:p-6">
        <div className="pointer-events-none absolute -top-16 -right-16 h-44 w-44 rounded-full bg-blue-600/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 -left-16 h-44 w-44 rounded-full bg-emerald-500/15 blur-3xl" />

        <div className="relative flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-600/25 text-blue-400 ring-1 ring-blue-500/40">
                <Search className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-bold tracking-tight text-white">
                  Búsqueda rápida de alumnos
                </p>
                <p className="text-xs text-slate-400">
                  Filtra al instante por nombre, código personal, grado o teléfono
                </p>
              </div>
            </div>

            <span className="tabular-nums inline-flex items-center rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-blue-200 ring-1 ring-white/15">
              {hayBusquedaGlobal
                ? `${resultadosGlobal.length} ${resultadosGlobal.length === 1 ? 'coincidencia' : 'coincidencias'}`
                : `${gradosOrdenados.length} ${gradosOrdenados.length === 1 ? 'grado disponible' : 'grados disponibles'}`}
            </span>
          </div>

          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={busquedaGlobal}
              onChange={(e) => setBusquedaGlobal(e.target.value)}
              placeholder="Ej. María José, A123BCD, 5to Administración..."
              className="w-full rounded-2xl border-0 bg-white py-3.5 pl-12 pr-11 text-sm font-medium text-slate-900 shadow-md outline-none transition placeholder:text-slate-400 focus:ring-4 focus:ring-blue-500/35"
            />
            {busquedaGlobal && (
              <button
                type="button"
                onClick={() => setBusquedaGlobal('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-xl bg-slate-100 p-1.5 text-slate-500 transition hover:bg-slate-200 hover:text-slate-800"
                aria-label="Limpiar búsqueda"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Resultados de búsqueda global o Bento Grid de grados */}
      {hayBusquedaGlobal ? (
        <section className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/60 px-5 py-4 sm:px-6">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Resultados de búsqueda
              </h2>
              <p className="text-xs text-slate-500">
                Coincidencias para &ldquo;{busquedaGlobal}&rdquo;
              </p>
            </div>
            <button
              type="button"
              onClick={() => setBusquedaGlobal('')}
              className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Volver a grados
            </button>
          </div>

          {resultadosGlobal.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <p className="text-sm font-medium text-slate-600">
                No se encontró ningún estudiante con ese criterio.
              </p>
            </div>
          ) : (
            <ListaAlumnos alumnos={resultadosGlobal} mostrarGrado />
          )}
        </section>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {gradosOrdenados.map(([grado, alumnosGrado]) => {
            const activos = alumnosGrado.filter((a) => a.activo).length
            return (
              <button
                key={grado}
                type="button"
                onClick={() => abrirGrado(grado)}
                className="group flex flex-col justify-between rounded-3xl border border-slate-200/80 bg-white p-6 text-left shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-lg hover:shadow-slate-200/60 focus:outline-none focus:ring-4 focus:ring-blue-600/15"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#0f172a] text-blue-400 shadow-md shadow-slate-900/15 transition-transform duration-200 group-hover:scale-105">
                      <BookOpen className="h-6 w-6" />
                    </div>
                    <span className="tabular-nums inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200/70">
                      {activos} activos
                    </span>
                  </div>

                  <h3 className="mt-5 text-lg font-bold tracking-tight text-slate-900 group-hover:text-blue-700">
                    {grado}
                  </h3>
                  <p className="tabular-nums mt-1 text-sm text-slate-500">
                    {alumnosGrado.length}{' '}
                    {alumnosGrado.length === 1
                      ? 'estudiante inscrito'
                      : 'estudiantes inscritos'}
                  </p>
                </div>

                <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4 text-xs font-semibold text-blue-600">
                  <span>Ver listado y carnets</span>
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </div>
              </button>
            )
          })}
        </div>
      )}

      {/* Ventana específica del grado seleccionado */}
      {gradoActivo && (
        <div
          className="fixed inset-0 z-[45] flex items-end justify-center bg-slate-950/60 p-0 backdrop-blur-xs sm:items-center sm:p-4"
          onClick={() => setGradoActivo(null)}
        >
          <div
            className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-t-3xl border border-slate-200 bg-white shadow-2xl sm:rounded-3xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Cabecera de la ventana */}
            <div className="flex items-center justify-between gap-3 border-b border-slate-100 bg-[#0f172a] px-5 py-4 text-white sm:px-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-md shadow-blue-600/30">
                  <GraduationCap className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold sm:text-lg">
                    {gradoActivo}
                  </h2>
                  <p className="tabular-nums text-xs text-slate-400">
                    {totalAlumnosGradoActivo}{' '}
                    {totalAlumnosGradoActivo === 1 ? 'alumno' : 'alumnos'} en
                    este grado
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    imprimirListadoGrado(gradoActivo, alumnosGradoActivo)
                  }
                  disabled={alumnosGradoActivo.length === 0}
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white shadow-md shadow-blue-600/30 transition hover:bg-blue-700 disabled:opacity-50"
                >
                  <Printer className="h-4 w-4" />
                  <span className="hidden sm:inline">Imprimir listado</span>
                </button>

                <button
                  type="button"
                  onClick={() => setGradoActivo(null)}
                  className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-800 hover:text-white"
                  aria-label="Cerrar ventana"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Buscador interno del grado */}
            <div className="border-b border-slate-100 bg-slate-50/80 px-5 py-3.5 sm:px-6">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  autoFocus
                  value={busquedaGrado}
                  onChange={(e) => setBusquedaGrado(e.target.value)}
                  placeholder={`Buscar alumno en ${gradoActivo} por nombre, código o teléfono...`}
                  className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-10 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10"
                />
                {busquedaGrado && (
                  <button
                    type="button"
                    onClick={() => setBusquedaGrado('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                    aria-label="Limpiar búsqueda del grado"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Contenido con scroll */}
            <div className="flex-1 overflow-y-auto">
              {alumnosGradoActivo.length === 0 ? (
                <div className="px-6 py-12 text-center">
                  <p className="text-sm font-medium text-slate-600">
                    No hay alumnos en {gradoActivo} que coincidan con &ldquo;
                    {busquedaGrado}&rdquo;.
                  </p>
                </div>
              ) : (
                <ListaAlumnos alumnos={alumnosGradoActivo} />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function ListaAlumnos({
  alumnos,
  mostrarGrado = false,
}: {
  alumnos: EstudianteItem[]
  mostrarGrado?: boolean
}) {
  return (
    <>
      {/* Vista Móvil */}
      <div className="divide-y divide-slate-100 md:hidden">
        {alumnos.map((est) => {
          const iniciales =
            `${est.nombres?.[0] ?? ''}${est.apellidos?.[0] ?? ''}`.toUpperCase()
          return (
            <div key={est.id} className="space-y-3 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[#0f172a] text-xs font-bold text-white">
                    {est.foto_url ? (
                      <img
                        src={est.foto_url}
                        alt={`${est.nombres} ${est.apellidos}`}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      iniciales || 'ES'
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">
                      {est.nombres} {est.apellidos}
                    </p>
                    <div className="mt-0.5 flex flex-wrap items-center gap-2">
                      <span className="tabular-nums inline-flex items-center gap-1 font-mono text-xs text-slate-500">
                        <Hash className="h-3 w-3" />
                        {est.codigo_personal}
                      </span>
                      {mostrarGrado && (
                        <span className="rounded-md bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-700">
                          {est.grado}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <span
                  className={`inline-flex shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                    est.activo
                      ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/70'
                      : 'bg-slate-100 text-slate-600 ring-1 ring-slate-200'
                  }`}
                >
                  {est.activo ? 'Activo' : 'Inactivo'}
                </span>
              </div>

              <div className="flex items-center justify-between gap-2 rounded-2xl bg-slate-50 px-3 py-2.5 text-xs text-slate-600">
                <div className="tabular-nums flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5 text-slate-400" />
                  <span>{est.telefono_encargado}</span>
                </div>
                <CarnetQRModal estudiante={est} />
              </div>
            </div>
          )
        })}
      </div>

      {/* Vista Tablet / Escritorio */}
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-100 bg-white text-xs font-semibold uppercase tracking-wider text-slate-500">
            <tr>
              <th className="px-6 py-3.5">Código</th>
              <th className="px-6 py-3.5">Estudiante</th>
              {mostrarGrado && <th className="px-6 py-3.5">Grado</th>}
              <th className="px-6 py-3.5">Teléfono Encargado</th>
              <th className="px-6 py-3.5">Estado</th>
              <th className="px-6 py-3.5 text-right">Carnet</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {alumnos.map((est) => {
              const iniciales =
                `${est.nombres?.[0] ?? ''}${est.apellidos?.[0] ?? ''}`.toUpperCase()
              return (
                <tr
                  key={est.id}
                  className="transition-colors hover:bg-slate-50/80"
                >
                  <td className="tabular-nums whitespace-nowrap px-6 py-4">
                    <span className="rounded-lg bg-slate-100 px-2.5 py-1 font-mono text-xs font-semibold text-slate-700">
                      {est.codigo_personal}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[#0f172a] text-xs font-bold text-white">
                        {est.foto_url ? (
                          <img
                            src={est.foto_url}
                            alt={`${est.nombres} ${est.apellidos}`}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          iniciales || 'ES'
                        )}
                      </div>
                      <span className="font-semibold text-slate-900">
                        {est.nombres} {est.apellidos}
                      </span>
                    </div>
                  </td>
                  {mostrarGrado && (
                    <td className="whitespace-nowrap px-6 py-4 text-slate-600">
                      {est.grado}
                    </td>
                  )}
                  <td className="tabular-nums whitespace-nowrap px-6 py-4 text-slate-600">
                    {est.telefono_encargado}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                        est.activo
                          ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/70'
                          : 'bg-slate-100 text-slate-600 ring-1 ring-slate-200'
                      }`}
                    >
                      {est.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-right">
                    <CarnetQRModal estudiante={est} />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </>
  )
}