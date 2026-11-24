import { z } from 'zod'

export const pagoSchema = z.object({
  estudiante_id: z.string().uuid('Selecciona un estudiante válido.'),
  concepto: z.enum(['inscripcion', 'colegiatura', 'examen', 'uniforme', 'otro'], {
    message: 'Selecciona un concepto válido.',
  }),
  mes_correspondiente: z.string().max(30, 'Máximo 30 caracteres.').optional(),
  monto: z.coerce
    .number({ message: 'Ingresa un monto numérico.' })
    .positive('El monto debe ser mayor a Q 0.00.')
    .max(50000, 'El monto excede el límite permitido.'),
  metodo_pago: z.enum(['efectivo', 'transferencia', 'deposito', 'tarjeta'], {
    message: 'Selecciona un método de pago.',
  }),
  numero_recibo: z
    .string()
    .trim()
    .min(3, 'El número de recibo debe tener al menos 3 caracteres.')
    .max(30, 'Máximo 30 caracteres.'),
  fecha_pago: z.string().min(1, 'La fecha de pago es obligatoria.'),
  observaciones: z.string().max(200, 'Máximo 200 caracteres.').optional(),
})

export type PagoInput = z.infer<typeof pagoSchema>