import { describe, it, expect } from 'vitest'
import { calcularNotaFinal, calcularPromedio } from '@/lib/notas'

describe('Lógica de Calificaciones', () => {
  it('aprueba exactamente con 61 puntos', () => {
    const res = calcularNotaFinal([20, 20, 21])
    expect(res.acumulado).toBe(61)
    expect(res.aprobado).toBe(true)
  })

  it('reprueba con 60.99 puntos', () => {
    const res = calcularNotaFinal([30, 30.99])
    expect(res.acumulado).toBe(60.99)
    expect(res.aprobado).toBe(false)
  })

  it('aplica el tope máximo de 100 puntos aunque las tareas sumen más', () => {
    const res = calcularNotaFinal([40, 40, 35])
    expect(res.acumulado).toBe(100)
    expect(res.aprobado).toBe(true)
  })

  it('ignora valores negativos y calcula promedio correctamente', () => {
    const res = calcularNotaFinal([-10, 50, 20])
    expect(res.acumulado).toBe(70)
    expect(calcularPromedio([80, 90, 70])).toBe(80)
    expect(calcularPromedio([])).toBe(0)
  })
})