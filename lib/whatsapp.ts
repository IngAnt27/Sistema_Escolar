export interface ResultadoWhatsApp {
  enviado: boolean
  modo: 'vps' | 'simulacion'
  enlaceManual: string
  enlaceWaMe: string
  respuesta: string
  error?: string
}

function normalizarTelefonoGT(telefono: string): string {
  const soloDigitos = telefono.replace(/\D/g, '')
  if (soloDigitos.length === 8) return `502${soloDigitos}`
  return soloDigitos
}

export async function enviarWhatsApp(
  telefono: string,
  mensaje: string
): Promise<ResultadoWhatsApp> {
  const numero = normalizarTelefonoGT(telefono)
  const enlaceManual = `https://wa.me/${numero}?text=${encodeURIComponent(mensaje)}`
  const vpsUrl = process.env.WHATSAPP_VPS_URL
  const apiKey = process.env.WHATSAPP_VPS_API_KEY

  if (!vpsUrl) {
    return {
      enviado: false,
      modo: 'simulacion',
      enlaceManual,
      enlaceWaMe: enlaceManual,
      respuesta: 'Modo simulación (sin VPS configurado)',
    }
  }

  try {
    const res = await fetch(vpsUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(apiKey ? { 'x-api-key': apiKey } : {}),
      },
      body: JSON.stringify({
        phone: numero,
        message: mensaje,
      }),
      signal: AbortSignal.timeout(8000),
    })

    if (!res.ok) {
      const detalle = await res.text()
      const msgError = `Error del microservicio (${res.status}): ${detalle}`
      return {
        enviado: false,
        modo: 'vps',
        enlaceManual,
        enlaceWaMe: enlaceManual,
        error: msgError,
        respuesta: msgError,
      }
    }

    return {
      enviado: true,
      modo: 'vps',
      enlaceManual,
      enlaceWaMe: enlaceManual,
      respuesta: 'Mensaje enviado vía VPS',
    }
  } catch (err) {
    const msgError =
      err instanceof Error ? err.message : 'No se pudo conectar al VPS.'
    return {
      enviado: false,
      modo: 'vps',
      enlaceManual,
      enlaceWaMe: enlaceManual,
      error: msgError,
      respuesta: msgError,
    }
  }
}

export const enviarAlertaWhatsApp = enviarWhatsApp