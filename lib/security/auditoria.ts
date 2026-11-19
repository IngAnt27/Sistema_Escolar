import { createClient } from '@/lib/supabase/server'

export async function registrarAuditoria(
  accion: string,
  entidad: string,
  detalle?: Record<string, unknown>
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return

  await supabase.from('auditoria_logs').insert([
    {
      usuario_id: user.id,
      accion,
      entidad,
      detalle: detalle ?? {},
    },
  ])
}