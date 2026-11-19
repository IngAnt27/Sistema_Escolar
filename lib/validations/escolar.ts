import { z } from 'zod'

// 1. Validación de Login
export const loginSchema = z.object({
  email: z.string().email('Ingresa un correo institucional válido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
})

// 2. Validación de Estudiantes (con formato de teléfono de Guatemala)
export const estudianteSchema = z.object({
  nombres: z.string().trim().min(2, 'El nombre es obligatorio').max(80),
  apellidos: z.string().trim().min(2, 'El apellido es obligatorio').max(80),
  codigo_personal: z
    .string()
    .trim()
    .regex(/^[A-Z0-9-]{4,20}$/, 'Usa solo mayúsculas, números y guiones (ej. EST-2026-01)'),
  telefono_encargado: z
    .string()
    .trim()
    .regex(/^\+502[0-9]{8}$/, 'Formato requerido: +502 seguido de 8 dígitos (ej. +50255551234)'),
  activo: z.boolean().default(true),
})

// 3. Validación de Calificaciones (Consistencia matemática)
export const calificacionSchema = z.object({
  estudiante_id: z.string().uuid('ID de estudiante inválido'),
  materia_id: z.string().uuid('ID de materia inválido'),
  bloque: z.number().int().min(1).max(4, 'Solo existen bloques del 1 al 4'),
  nota: z.number().min(0, 'La nota mínima es 0').max(100, 'La nota máxima es 100'),
})

// Tipos inferidos automáticamente para usar en TypeScript
export type LoginInput = z.infer<typeof loginSchema>
export type EstudianteInput = z.infer<typeof estudianteSchema>
export type CalificacionInput = z.infer<typeof calificacionSchema>