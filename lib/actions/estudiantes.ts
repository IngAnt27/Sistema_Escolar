'use server'

import { createClient } from '@/lib/supabase/server'
import { estudianteSchema, type EstudianteInput } from '@/lib/validations/escolar'
import { revalidatePath } from 'next/cache'

export async function crearEstudiante(datos: EstudianteInput) {
  // 1. Validación estricta en el servidor (nunca confiar solo en el frontend)
  const validacion = estudianteSchema.safeParse(datos)

  if (!validacion.success) {
    return {
      ok: false,
      errores: validacion.error.flatten().fieldErrors,
    }
  }

  // 2. Inserción segura en Supabase
  const supabase = await createClient()
  const { error } = await supabase
    .from('estudiantes')
    .insert([validacion.data])

  if (error) {
    // Manejo limpio de código duplicado (PostgreSQL error 23505)
    if (error.code === '23505') {
      return { ok: false, mensaje: 'Ya existe un estudiante con ese código personal.' }
    }
    return { ok: false, mensaje: 'Error al guardar el estudiante.' }
  }

  // 3. Refrescar la caché de la vista de estudiantes
  revalidatePath('/dashboard/estudiantes')
  return { ok: true, mensaje: 'Estudiante registrado correctamente.' }
}