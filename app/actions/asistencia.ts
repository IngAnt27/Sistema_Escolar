'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { enviarAlertaWhatsApp } from '@/lib/whatsapp'

export async function registrarAsistenciaQR(codigoPersonal: string) {
  const codigo = codigoPersonal.trim()
  if (!codigo) return { error: 'Código QR vacío.' }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Sesión expirada.' }

  // 1. Buscar estudiante por código personal
  const { data: estudiante, error: errorEst } = await supabase
    .from('estudiantes')
    .select('id, nombres, apellidos, grado, activo')
    .eq('codigo_personal', codigo)
    .single()

  if (errorEst || !estudiante) {
    return { error: `No se encontró ningún estudiante con el código "${codigo}".` }
  }

  if (!estudiante.activo) {
    return { error: `${estudiante.nombres} ${estudiante.apellidos} está inactivo.` }
  }

  // 2. Obtener fecha y hora actual en Guatemala
  const ahora = new Date()
  const fechaHoy = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Guatemala',
  }).format(ahora) // YYYY-MM-DD

  const horaGT = new Intl.DateTimeFormat('es-GT', {
    timeZone: 'America/Guatemala',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(ahora)

  // Ejemplo: después de las 07:45:00 se marca como 'tarde'
  const estado = horaGT > '07:45:00' ? 'tarde' : 'presente'

  // 3. Insertar asistencia
  const { error: errorInsert } = await supabase.from('asistencias').insert({
    estudiante_id: estudiante.id,
    fecha: fechaHoy,
    hora_entrada: horaGT,
    estado,
    registrado_por: user.id,
    metodo: 'qr',
  })

  if (errorInsert) {
    if (errorInsert.code === '23505') {
      return {
        duplicado: true,
        mensaje: `${estudiante.nombres} ${estudiante.apellidos} ya registró asistencia hoy.`,
      }
    }
    return { error: 'Error al guardar la asistencia.' }
  }

  revalidatePath('/dashboard/asistencia')
  revalidatePath('/dashboard')

  return {
    ok: true,
    estudiante: `${estudiante.nombres} ${estudiante.apellidos}`,
    grado: estudiante.grado,
    hora: horaGT,
    estado,
  }
}

export interface AlertaGenerada {
  estudiante: string
  telefono: string
  estado: 'enviado' | 'pendiente'
  enlaceWaMe: string
}

export async function cerrarAsistenciaYNotificar() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Sesión expirada.' }

  const fechaHoy = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Guatemala',
  }).format(new Date())

  // 1. Obtener todos los estudiantes activos
  const { data: estudiantes } = await supabase
    .from('estudiantes')
    .select('id, nombres, apellidos, grado, telefono_encargado')
    .eq('activo', true)

  if (!estudiantes || estudiantes.length === 0) {
    return { error: 'No hay estudiantes activos registrados.' }
  }

  // 2. Obtener IDs de quienes YA tienen registro hoy
  const { data: asistenciasHoy } = await supabase
    .from('asistencias')
    .select('estudiante_id')
    .eq('fecha', fechaHoy)

  const idsPresentes = new Set((asistenciasHoy ?? []).map((a) => a.estudiante_id))

  // 3. Filtrar ausentes
  const ausentes = estudiantes.filter((e) => !idsPresentes.has(e.id))

  if (ausentes.length === 0) {
    return { ok: true, alertas: [] as AlertaGenerada[], mensaje: 'Todos los estudiantes asistieron hoy.' }
  }

  const alertas: AlertaGenerada[] = []

  // 4. Marcar como ausente y enviar alerta por cada estudiante
  for (const est of ausentes) {
    await supabase.from('asistencias').insert({
      estudiante_id: est.id,
      fecha: fechaHoy,
      hora_entrada: '00:00:00',
      estado: 'ausente',
      registrado_por: user.id,
      metodo: 'sistema',
    })

    const texto = `Estimado padre/madre de familia, le informamos que su hijo(a) ${est.nombres} ${est.apellidos} (${est.grado}) no registró asistencia el día de hoy (${fechaHoy}). Por favor comunicarse con la dirección si requiere justificar la falta.`

    const resultado = await enviarAlertaWhatsApp(est.telefono_encargado, texto)
    const estadoNotif = resultado.enviado ? 'enviado' : 'pendiente'

    await supabase.from('notificaciones_whatsapp').insert({
      estudiante_id: est.id,
      telefono_destino: est.telefono_encargado,
      tipo: 'inasistencia',
      mensaje: texto,
      estado: estadoNotif,
      respuesta_api: resultado.respuesta ?? null,
    })

    alertas.push({
      estudiante: `${est.nombres} ${est.apellidos}`,
      telefono: est.telefono_encargado,
      estado: estadoNotif,
      enlaceWaMe: resultado.enlaceWaMe,
    })
  }

  revalidatePath('/dashboard/asistencia')
  revalidatePath('/dashboard')

  return {
    ok: true,
    alertas,
    mensaje: `Se registraron ${ausentes.length} inasistencia(s) y se generaron las alertas.`,
  }
}