'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

const crearEstudianteSchema = z.object({
  codigo_personal: z
    .string()
    .trim()
    .min(3, 'El código personal debe tener al menos 3 caracteres.')
    .max(20, 'El código personal es demasiado largo.'),
  nombres: z.string().trim().min(2, 'Ingresa los nombres del estudiante.'),
  apellidos: z.string().trim().min(2, 'Ingresa los apellidos del estudiante.'),
  grado: z.string().trim().min(2, 'Ingresa el grado.'),
  telefono_encargado: z
    .string()
    .trim()
    .regex(/^\+502\d{8}$/, 'El teléfono debe tener el formato +502 seguido de 8 dígitos.'),
})

export type CrearEstudianteInput = z.infer<typeof crearEstudianteSchema>

export async function crearEstudiante(datos: CrearEstudianteInput) {
  // 1. Validación estricta con Zod
  const validacion = crearEstudianteSchema.safeParse(datos)
  if (!validacion.success) {
    return { error: validacion.error.issues[0]?.message || 'Datos inválidos.' }
  }

  const supabase = await createClient()

  // 2. Verificar sesión activa
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Sesión expirada. Inicia sesión nuevamente.' }
  }

  // 3. Verificar rol (RBAC en servidor)
  const { data: perfil } = await supabase
    .from('perfiles')
    .select('rol')
    .eq('id', user.id)
    .single()

  if (!perfil || !['director', 'docente'].includes(perfil.rol)) {
    return { error: 'No tienes permisos para inscribir estudiantes.' }
  }

  // 4. Insertar estudiante en PostgreSQL
  const { data: nuevoEstudiante, error: errorInsert } = await supabase
    .from('estudiantes')
    .insert({
      ...validacion.data,
      activo: true,
    })
    .select('id')
    .single()

  if (errorInsert) {
    if (errorInsert.code === '23505') {
      return { error: 'Ya existe un estudiante con ese código personal.' }
    }
    return { error: 'No se pudo guardar el estudiante. Revisa los permisos RLS.' }
  }

  // 5. Registrar en auditoría
  await supabase.from('auditoria_logs').insert({
    usuario_id: user.id,
    accion: 'CREAR_ESTUDIANTE',
    tabla: 'estudiantes',
    registro_id: nuevoEstudiante.id,
    detalles: { codigo_personal: validacion.data.codigo_personal },
  })

  // 6. Actualizar caché de las vistas
  revalidatePath('/dashboard/estudiantes')
  revalidatePath('/dashboard')

  return { ok: true }
}