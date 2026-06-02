import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { AccessToken } from 'npm:livekit-server-sdk'

// Configuración de CORS para permitir que tu frontend (local o en producción) pueda consumir esta función sin bloqueos
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {
  // Manejo de peticiones preflight de CORS (método OPTIONS)
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Leemos los parámetros que el frontend nos enviará en el cuerpo de la petición
    const { roomName, participantName, isTechnician } = await req.json()

    // Validación básica de los parámetros requeridos
    if (!roomName || !participantName) {
      throw new Error("Faltan campos requeridos: roomName o participantName")
    }

    // Leemos las llaves de LiveKit configuradas en las variables de entorno de Supabase
    const apiKey = Deno.env.get('LIVEKIT_API_KEY')
    const apiSecret = Deno.env.get('LIVEKIT_API_SECRET')

    if (!apiKey || !apiSecret) {
      throw new Error("Error de configuración del servidor: Las credenciales de LiveKit no están configuradas.")
    }

    // Instanciamos el generador de tokens de LiveKit
    const at = new AccessToken(apiKey, apiSecret, {
      identity: participantName,
    })

    // Lógica de permisos (Grants)
    if (isTechnician) {
      // El Técnico puede publicar video (OBS) y audio, y recibir el audio del cliente
      at.addGrant({ 
        roomJoin: true, 
        room: roomName, 
        canPublish: true, 
        canSubscribe: true 
      })
    } else {
      // El Cliente puede recibir el video/audio del técnico, y enviar su propio audio (hablar)
      at.addGrant({ 
        roomJoin: true, 
        room: roomName, 
        canPublish: true, // Debe ser true para poder enviar su micrófono
        canSubscribe: true,
        // Restringimos que el cliente publique video de manera estricta
        video: { canPublish: false } 
      })
    }

    // Generamos el JSON Web Token firmado
    const token = await at.toJwt()

    // Retornamos el token al cliente
    return new Response(
      JSON.stringify({ token }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})