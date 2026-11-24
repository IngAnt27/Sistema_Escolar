export const NOTA_MAXIMA = 100
export const NOTA_MINIMA_APROBACION = 61

export function calcularNotaFinal(punteosObtenidos: number[]): {
  acumulado: number
  aprobado: boolean
} {
  const suma = punteosObtenidos.reduce(
    (acc, val) => acc + Math.max(0, Number(val) || 0),
    0
  )
  const acumulado = Math.min(NOTA_MAXIMA, Number(suma.toFixed(2)))
  return {
    acumulado,
    aprobado: acumulado >= NOTA_MINIMA_APROBACION,
  }
}

export function calcularPromedio(notas: number[]): number {
  if (notas.length === 0) return 0
  const total = notas.reduce((acc, n) => acc + n, 0)
  return Math.round(total / notas.length)
}