import { useEffect, useState } from 'react';
import { 
  LiveKitRoom, 
  VideoConference, 
  RoomAudioRenderer 
} from '@livekit/components-react';
import '@livekit/components-styles'; // Importa los estilos de los controles de video

// Reemplaza con la dirección host que te proporciona LiveKit Cloud en su panel
const LIVEKIT_SERVER_URL = "wss://servicio-1edyffz0.livekit.cloud"; 

export default function VideoSession({ roomName, participantName, isTechnician }) {
  const [token, setToken] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchToken() {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/livekit-token`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
            },
            body: JSON.stringify({
              roomName,
              participantName,
              isTechnician
            })
          }
        );

        if (!response.ok) {
          throw new Error('Error al obtener el token de acceso');
        }

        const data = await response.json();
        setToken(data.token);
      } catch (err) {
        setError(err.message || 'Error de conexión');
      }
    }

    fetchToken();
  }, [roomName, participantName, isTechnician]);

  if (error) {
    return (
      <div className="p-4 text-red-500 bg-red-100 border border-red-400 rounded">
        Error: {error}
      </div>
    );
  }

  if (!token) {
    return (
      <div className="w-full h-screen bg-slate-950 flex items-center justify-center text-gray-400">
        Cargando transmisión...
      </div>
    );
  }

  return (
    <div className="w-full h-screen bg-slate-950 flex flex-col items-center justify-center text-white p-4">
      <div className="w-full max-w-4xl h-[80vh] bg-slate-900 rounded-lg overflow-hidden shadow-2xl relative">
        <LiveKitRoom
          video={isTechnician} // Si es técnico, inicia la cámara de inmediato
          audio={true}         // Ambos inician con el micrófono disponible
          token={token}
          serverUrl={LIVEKIT_SERVER_URL}
          // Se desconecta automáticamente al desmontar el componente
          onDisconnected={() => console.log('Sesión finalizada')}
          data-lk-theme="default"
        >
          {/* Componente estándar de LiveKit que organiza el video y audio en la sala */}
          <VideoConference />
          
          {/* Renderiza el audio recibido de otros participantes */}
          <RoomAudioRenderer />
        </LiveKitRoom>
      </div>
      <div className="mt-4 text-sm text-gray-400">
        Sesión: <span className="font-semibold text-white">{roomName}</span> | 
        Usuario: <span className="font-semibold text-white">{participantName}</span>
      </div>
    </div>
  );
}