import { describe, it, expect } from 'vitest'
import { estudianteSchema, calificacionSchema } from '@/lib/validations/escolar'

describe('Validaciones de Estudiantes', () => {
  it('acepta un estudiante válido con formato de Guatemala', () => {
    const resultado = estudianteSchema.safeParse({
      nombres: 'Carlos Andrés',
      apellidos: 'López Pérez',
      codigo_personal: 'EST-2026-01',
      telefono_encargado: '+50255551234',
      activo: true,
    })
    expect(resultado.success).toBe(true)
  })

  it('rechaza un teléfono sin código +502 o incompleto', () => {
    const resultado = estudianteSchema.safeParse({
      nombres: 'Carlos',
      apellidos: 'López',
      codigo_personal: 'EST-2026-01',
      telefono_encargado: '55551234', // Falta +502
    })
    expect(resultado.success).toBe(false)
  })
})

describe('Validaciones de Calificaciones', () => {
  it('rechaza notas mayores a 100 o negativas', () => {
    const notaAlta = calificacionSchema.safeParse({
      estudiante_id: '550e8400-e29b-41d4-a716-446655440000',
      materia_id: '550e8400-e29b-41d4-a716-446655440001',
      bloque: 1,
      nota: 105,
    })
    expect(notaAlta.success).toBe(false)

    const notaNegativa = calificacionSchema.safeParse({
      estudiante_id: '550e8400-e29b-41d4-a716-446655440000',
      materia_id: '550e8400-e29b-41d4-a716-446655440001',
      bloque: 1,
      nota: -5,
    })
    expect(notaNegativa.success).toBe(false)
  })

  it('rechaza bloques fuera del rango 1-4', () => {
    const bloqueInvalido = calificacionSchema.safeParse({
      estudiante_id: '550e8400-e29b-41d4-a716-446655440000',
      materia_id: '550e8400-e29b-41d4-a716-446655440001',
      bloque: 5,
      nota: 85,
    })
    expect(bloqueInvalido.success).toBe(false)
  })
})