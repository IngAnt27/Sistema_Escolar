'use server'

import { revalidatePath } from 'next/cache'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

const crearUsuarioSchema = z.object({
  nombre_completo: z
    .string()
    .trim()
    .min(3, 'Ingresa el nombre completo del usuario.'),
  email: z.string().trim().email('Ingresa un correo electrónico válido.'),
  password: z
    .string()
    .min(6, 'La contraseña debe tener al menos 6 caracteres.'),
  rol: z.enum(['director', 'docente'], {
    message: 'Selecciona un rol válido.',
  }),
  curso: z.string().trim().max(100).optional().nullable(),
  foto_url: z.string().trim().url().optional().nullable(),
})

const actualizarUsuarioSchema = z.object({
  id: z.string().uuid('ID de usuario inválido.'),
  nombre_completo: z
    .string()
    .trim()
    .min(3, 'Ingresa el nombre completo del usuario.'),
  email: z.string().trim().email('Ingresa un correo electrónico válido.'),
  rol: z.enum(['director', 'docente'], {
    message: 'Selecciona un rol válido.',
  }),
  curso: z.string().trim().max(100).optional().nullable(),
  foto_url: z.string().trim().url().optional().nullable(),
})

export type CrearUsuarioInput = z.infer<typeof crearUsuarioSchema>
export type ActualizarUsuarioInput = z.infer<typeof actualizarUsuarioSchema>

async function verificarDirectorYAdmin() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Sesión expirada. Inicia sesión nuevamente.' }

  const { data: perfilActual } = await supabase
    .from('perfiles')
    .select('rol')
    .eq('id', user.id)
    .single()

  if (perfilActual?.rol !== 'director') {
    return { error: 'Solo Dirección tiene permisos para gestionar usuarios.' }
  }

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL

  if (!serviceRoleKey || !supabaseUrl) {
    return {
      error:
        'Falta configurar SUPABASE_SERVICE_ROLE_KEY en las variables de entorno.',
    }
  }

  const supabaseAdmin = createAdminClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  return { supabaseAdmin }
}

export async function crearUsuario(datos: CrearUsuarioInput) {
  const validacion = crearUsuarioSchema.safeParse(datos)
  if (!validacion.success) {
    return { error: validacion.error.issues[0]?.message || 'Datos inválidos.' }
  }

  const check = await verificarDirectorYAdmin()
  if ('error' in check) return { error: check.error }
  const { supabaseAdmin } = check

  const { data: creado, error: errorAuth } =
    await supabaseAdmin.auth.admin.createUser({
      email: validacion.data.email,
      password: validacion.data.password,
      email_confirm: true,
      user_metadata: {
        nombre_completo: validacion.data.nombre_completo,
        rol: validacion.data.rol,
      },
    })

  if (errorAuth || !creado.user) {
    if (errorAuth?.message?.toLowerCase().includes('already')) {
      return { error: 'Ya existe un usuario registrado con ese correo.' }
    }
    return { error: errorAuth?.message || 'No se pudo crear el usuario.' }
  }

  const { error: errorPerfil } = await supabaseAdmin.from('perfiles').upsert({
    id: creado.user.id,
    nombre_completo: validacion.data.nombre_completo,
    email: validacion.data.email,
    rol: validacion.data.rol,
    curso: validacion.data.curso || null,
    foto_url: validacion.data.foto_url || null,
  })

  if (errorPerfil) {
    return { error: errorPerfil.message }
  }

  revalidatePath('/dashboard/usuarios')
  return { ok: true }
}

export async function actualizarUsuario(datos: ActualizarUsuarioInput) {
  const validacion = actualizarUsuarioSchema.safeParse(datos)
  if (!validacion.success) {
    return { error: validacion.error.issues[0]?.message || 'Datos inválidos.' }
  }

  const check = await verificarDirectorYAdmin()
  if ('error' in check) return { error: check.error }
  const { supabaseAdmin } = check

  // 1. Actualizar correo y metadatos en Supabase Auth
  const { error: errorAuth } = await supabaseAdmin.auth.admin.updateUserById(
    validacion.data.id,
    {
      email: validacion.data.email,
      email_confirm: true,
      user_metadata: {
        nombre_completo: validacion.data.nombre_completo,
        rol: validacion.data.rol,
      },
    }
  )

  if (errorAuth) {
    return { error: errorAuth.message || 'No se pudo actualizar en Auth.' }
  }

  // 2. Actualizar datos en la tabla perfiles
  const { error: errorPerfil } = await supabaseAdmin
    .from('perfiles')
    .update({
      nombre_completo: validacion.data.nombre_completo,
      email: validacion.data.email,
      rol: validacion.data.rol,
      curso: validacion.data.curso || null,
      foto_url: validacion.data.foto_url || null,
    })
    .eq('id', validacion.data.id)

  if (errorPerfil) {
    return { error: errorPerfil.message }
  }

  revalidatePath('/dashboard/usuarios')
  return { ok: true }
}