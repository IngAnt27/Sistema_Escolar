import { describe, it, expect } from 'vitest'
import { pagoSchema } from '@/lib/validations/pagos'

describe('Esquema Zod de Pagos', () => {
  const pagoValido = {
    estudiante_id: 'b5fd141a-e246-4b25-89dd-203f206b6c4d',
    concepto: 'colegiatura',
    mes_correspondiente: 'Febrero',
    monto: 250,
    metodo_pago: 'efectivo',
    numero_recibo: 'REC-001',
    fecha_pago: '2026-11-22',
  }

  it('acepta un pago válido', () => {
    const res = pagoSchema.safeParse(pagoValido)
    expect(res.success).toBe(true)
  })

  it('rechaza montos en cero o negativos', () => {
    const res = pagoSchema.safeParse({ ...pagoValido, monto: -50 })
    expect(res.success).toBe(false)
  })

  it('rechaza recibos con menos de 3 caracteres', () => {
    const res = pagoSchema.safeParse({ ...pagoValido, numero_recibo: 'R1' })
    expect(res.success).toBe(false)
  })
})