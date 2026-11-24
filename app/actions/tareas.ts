'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { enviarAlertaWhatsApp } from '@/lib/whatsapp'

export async function registrarIncumplimientoTarea(formData: {
  estudiante_id: string
  materia: string
  descripcion_tarea: string
}) {
  const { estudiante_id, materia, descripcion_tarea } = formData

  if (!estudiante_id || !materia.trim() || !descripcion_tarea.trim()) {
    return { error: 'Todos los campos son obligatorios.' }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Sesión expirada.' }

  // 1. Obtener datos del estudiante y teléfono del encargado
  const { data: est, error: errorEst } = await supabase
    .from('estudiantes')
    .select('id, nombres, apellidos, grado, telefono_encargado')
    .eq('id', estudiante_id)
    .single()

  if (errorEst || !est) {
    return { error: 'No se encontró el estudiante seleccionado.' }
  }

  const fechaHoy = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Guatemala',
  }).format(new Date())

  // 2. Preparar y enviar alerta de WhatsApp
  const texto = `Estimado padre/madre de familia, le informamos que su hijo(a) ${est.nombres} ${est.apellidos} (${est.grado}) no cumplió con la tarea de ${materia.trim()}: "${descripcion_tarea.trim()}" el día ${fechaHoy}. Agradecemos su apoyo para darle seguimiento en casa.`

  const resultado = await enviarAlertaWhatsApp(est.telefono_encargado, texto)
  const estadoNotif = resultado.enviado ? 'enviado' : 'pendiente'

  // 3. Guardar incumplimiento
  const { error: errorInsert } = await supabase.from('incumplimientos_tareas').insert({
    estudiante_id: est.id,
    materia: materia.trim(),
    descripcion_tarea: descripcion_tarea.trim(),
    fecha: fechaHoy,
    registrado_por: user.id,
    alerta_enviada: resultado.enviado,
  })

  if (errorInsert) {
    return { error: 'No se pudo registrar el reporte de tarea.' }
  }

  // 4. Guardar historial de notificación
  await supabase.from('notificaciones_whatsapp').insert({
    estudiante_id: est.id,
    telefono_destino: est.telefono_encargado,
    tipo: 'tarea_incumplida',
    mensaje: texto,
    estado: estadoNotif,
    respuesta_api: resultado.respuesta ?? null,
  })

  revalidatePath('/dashboard/tareas')

  return {
    ok: true,
    estudiante: `${est.nombres} ${est.apellidos}`,
    estado: estadoNotif,
    enlaceWaMe: resultado.enlaceWaMe,
  }
}
export async function crearTarea(datos: {
  titulo: string
  materia: string
  grado: string
  descripcion: string
  fecha_entrega: string
  punteo: number
}) {
  if (!datos.titulo.trim() || !datos.materia.trim() || !datos.grado.trim() || !datos.fecha_entrega) {
    return { error: 'Completa los campos obligatorios.' }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Sesión expirada.' }

  const { error } = await supabase.from('tareas').insert({
    titulo: datos.titulo.trim(),
    materia: datos.materia.trim(),
    grado: datos.grado.trim(),
    descripcion: datos.descripcion.trim() || null,
    fecha_entrega: datos.fecha_entrega,
    punteo: datos.punteo || 10,
    creado_por: user.id,
  })

  if (error) return { error: 'No se pudo crear la tarea.' }

  revalidatePath('/dashboard/tareas')
  return { ok: true }
}

export async function toggleEntregaTarea(
  tareaId: string,
  estudianteId: string,
  entregada: boolean
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Sesión expirada.' }

  const { error } = await supabase.from('entregas_tareas').upsert(
    {
      tarea_id: tareaId,
      estudiante_id: estudianteId,
      entregada,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'tarea_id,estudiante_id' }
  )

  if (error) return { error: 'No se pudo actualizar la entrega.' }

  revalidatePath(`/dashboard/tareas/${tareaId}`)
  return { ok: true }
}

export interface AlertaTarea {
  estudiante: string
  telefono: string
  estado: 'enviado' | 'pendiente'
  enlaceWaMe: string
}

export async function notificarNoEntregaron(tareaId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Sesión expirada.' }

  // 1. Obtener la tarea
  const { data: tarea } = await supabase
    .from('tareas')
    .select('id, titulo, materia, grado, fecha_entrega')
    .eq('id', tareaId)
    .single()

  if (!tarea) return { error: 'Tarea no encontrada.' }

  // 2. Estudiantes activos de ese grado y sus entregas
  const [{ data: estudiantes }, { data: entregas }] = await Promise.all([
    supabase
      .from('estudiantes')
      .select('id, nombres, apellidos, telefono_encargado')
      .eq('activo', true)
      .eq('grado', tarea.grado),
    supabase
      .from('entregas_tareas')
      .select('estudiante_id, entregada, alerta_enviada')
      .eq('tarea_id', tareaId),
  ])

  const mapaEntregas = new Map(
    (entregas ?? []).map((e) => [e.estudiante_id, e])
  )

  // Filtrar quienes NO entregaron y aún NO han sido notificados
  const pendientes = (estudiantes ?? []).filter((est) => {
    const reg = mapaEntregas.get(est.id)
    return !reg?.entregada && !reg?.alerta_enviada
  })

  if (pendientes.length === 0) {
    return {
      ok: true,
      alertas: [] as AlertaTarea[],
      mensaje: 'No hay estudiantes pendientes por notificar en esta tarea.',
    }
  }

  const fechaHoy = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Guatemala',
  }).format(new Date())

  const alertas: AlertaTarea[] = []

  for (const est of pendientes) {
    const texto = `Estimado padre/madre de familia, le informamos que su hijo(a) ${est.nombres} ${est.apellidos} (${tarea.grado}) no entregó la tarea "${tarea.titulo}" de ${tarea.materia} (fecha de entrega: ${tarea.fecha_entrega}). Agradecemos su apoyo en casa.`

    const resWa = await enviarAlertaWhatsApp(est.telefono_encargado, texto)
    const estadoNotif = resWa.enviado ? 'enviado' : 'pendiente'

    // Marcar alerta enviada en entregas_tareas
    await supabase.from('entregas_tareas').upsert(
      {
        tarea_id: tareaId,
        estudiante_id: est.id,
        entregada: false,
        alerta_enviada: true,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'tarea_id,estudiante_id' }
    )

    // Guardar en incumplimientos_tareas para que sume en /dashboard/informes
    await supabase.from('incumplimientos_tareas').insert({
      estudiante_id: est.id,
      materia: tarea.materia,
      descripcion_tarea: tarea.titulo,
      fecha: fechaHoy,
      registrado_por: user.id,
      alerta_enviada: resWa.enviado,
    })

    // Guardar historial de WhatsApp
    await supabase.from('notificaciones_whatsapp').insert({
      estudiante_id: est.id,
      telefono_destino: est.telefono_encargado,
      tipo: 'tarea_incumplida',
      mensaje: texto,
      estado: estadoNotif,
      respuesta_api: resWa.respuesta ?? null,
    })

    alertas.push({
      estudiante: `${est.nombres} ${est.apellidos}`,
      telefono: est.telefono_encargado,
      estado: estadoNotif,
      enlaceWaMe: resWa.enlaceWaMe,
    })
  }

  revalidatePath(`/dashboard/tareas/${tareaId}`)
  revalidatePath('/dashboard/informes')

  return {
    ok: true,
    alertas,
    mensaje: `Se generaron ${alertas.length} alerta(s) de incumplimiento.`,
  }
}
export async function guardarNotaEntrega(
  tareaId: string,
  estudianteId: string,
  nota: number,
  punteoMaximo: number
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Sesión expirada.' }

  const notaValida = Math.max(0, Math.min(nota, punteoMaximo))

  const { error } = await supabase.from('entregas_tareas').upsert(
    {
      tarea_id: tareaId,
      estudiante_id: estudianteId,
      entregada: notaValida > 0,
      nota_obtenida: notaValida,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'tarea_id,estudiante_id' }
  )

  if (error) return { error: 'No se pudo guardar la nota.' }

  revalidatePath(`/dashboard/tareas/${tareaId}`)
  revalidatePath('/dashboard/notas')
  return { ok: true, nota: notaValida }
}