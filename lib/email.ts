import { Resend } from 'resend'

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null

interface EnviarCorreoParams {
  para: string
  asunto: string
  titulo: string
  cuerpoHtml: string
}

export async function enviarCorreoInstitucional({
  para,
  asunto,
  titulo,
  cuerpoHtml,
}: EnviarCorreoParams) {
  if (!resend) {
    console.warn('[Resend] RESEND_API_KEY no configurada. Correo omitido:', asunto)
    return { enviado: false, error: 'Resend no configurado.' }
  }

  const remitente =
    process.env.EMAIL_FROM ?? 'Sistema Escolar <onboarding@resend.dev>'

  const { data, error } = await resend.emails.send({
    from: remitente,
    to: para,
    subject: asunto,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; border: 1px solid #E2E8F0; border-radius: 12px; overflow: hidden;">
        <div style="background: #2563EB; padding: 20px 24px; color: #FFFFFF;">
          <h2 style="margin: 0; font-size: 18px;">${titulo}</h2>
        </div>
        <div style="padding: 24px; color: #1E293B; font-size: 14px; line-height: 1.6;">
          ${cuerpoHtml}
        </div>
        <div style="background: #F8FAFC; padding: 14px 24px; font-size: 11px; color: #64748B; border-top: 1px solid #E2E8F0;">
          Mensaje automático generado por el Sistema Escolar.
        </div>
      </div>
    `,
  })

  if (error) {
    return { enviado: false, error: error.message }
  }

  return { enviado: true, id: data?.id }
}