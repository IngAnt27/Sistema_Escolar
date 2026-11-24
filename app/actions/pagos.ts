'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { pagoSchema, type PagoInput } from '@/lib/validations/pagos'

export async function registrarPago(datos: PagoInput) {
  const validacion = pagoSchema.safeParse(datos)
  if (!validacion.success) {
    return {
      error: validacion.error.issues[0]?.message ?? 'Datos de pago inválidos.',
    }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Sesión expirada.' }

  const { error } = await supabase.from('pagos').insert({
    ...validacion.data,
    mes_correspondiente: validacion.data.mes_correspondiente || null,
    observaciones: validacion.data.observaciones || null,
    registrado_por: user.id,
  })

  if (error) {
    if (error.code === '23505') {
      return { error: 'Ese número de recibo ya está registrado.' }
    }
    if (error.code === '42501') {
      return { error: 'Acceso denegado: solo el director puede registrar pagos.' }
    }
    return { error: 'No se pudo registrar el pago.' }
  }

  revalidatePath('/dashboard/pagos')
  revalidatePath('/dashboard')
  return { ok: true }
}