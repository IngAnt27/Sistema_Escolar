import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)
const resend = new Resend(process.env.RESEND_API_KEY)

async function procesarCola() {
  // 1. Tomar hasta 10 tareas pendientes
  const { data: tareas, error } = await supabase
    .from('cola_tareas')
    .select('*')
    .eq('estado', 'pendiente')
    .order('creado_en', { ascending: true })
    .limit(10)

  if (error || !tareas?.length) return

  for (const tarea of tareas) {
    // Marcar como procesando
    await supabase
      .from('cola_tareas')
      .update({ estado: 'procesando', intentos: tarea.intentos + 1 })
      .eq('id', tarea.id)

    try {
      if (tarea.tipo === 'correo_resend') {
        await resend.emails.send({
          from: 'Colegio <notificaciones@tudominio.com>',
          to: tarea.payload.para,
          subject: tarea.payload.asunto,
          html: tarea.payload.html,
        })
      }

      if (tarea.tipo === 'alerta_whatsapp') {
        const res = await fetch(process.env.WHATSAPP_VPS_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': process.env.WHATSAPP_VPS_SECRET,
          },
          body: JSON.stringify({
            telefono: tarea.payload.telefono,
            mensaje: tarea.payload.mensaje,
          }),
        })
        if (!res.ok) throw new Error(`VPS respondió con estado ${res.status}`)
      }

      // Éxito
      await supabase
        .from('cola_tareas')
        .update({ estado: 'completado', procesado_en: new Date().toISOString() })
        .eq('id', tarea.id)
    } catch (err) {
      const nuevoEstado = tarea.intentos + 1 >= tarea.max_intentos ? 'fallido' : 'pendiente'
      await supabase
        .from('cola_tareas')
        .update({ estado: nuevoEstado, ultimo_error: err.message })
        .eq('id', tarea.id)
    }
  }
}

procesarCola().then(() => console.log('Ciclo de cola finalizado'))