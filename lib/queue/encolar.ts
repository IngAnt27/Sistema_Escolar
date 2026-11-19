import { createClient } from '@/lib/supabase/server'

type TipoTarea = 'correo_resend' | 'alerta_whatsapp' | 'generar_boletas'

export async function encolarTarea(tipo: TipoTarea, payload: Record<string, unknown>) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('cola_tareas')
    .insert([{ tipo, payload, estado: 'pendiente' }])

  if (error) {
    console.error('Error al encolar tarea:', error.message)
    return { ok: false }
  }

  return { ok: true }
}