import { useEffect, useState, useRef } from "react";
import {
  LiveKitRoom,
  VideoTrack,
  RoomAudioRenderer,
  useTracks,
  useLocalParticipant,
} from "@livekit/components-react";
import { Track } from "livekit-client";
import "@livekit/components-styles";
import {
  VideoOff,
  Mic,
  MicOff,
  Volume2,
  Maximize,
  Minimize,
} from "lucide-react";

const LIVEKIT_SERVER_URL = "wss://servicio-1edyffz0.livekit.cloud"; // Reemplaza por tu URL real

export default function VideoSession({
  roomName,
  participantName,
  isTechnician,
}) {
  const [token, setToken] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchToken() {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/livekit-token`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            },
            body: JSON.stringify({
              roomName,
              participantName,
              isTechnician,
            }),
          },
        );

        if (!response.ok) {
          throw new Error("Error al obtener el token de acceso");
        }

        const data = await response.json();
        setToken(data.token);
      } catch (err) {
        setError(err.message || "Error de conexión");
      }
    }

    fetchToken();
  }, [roomName, participantName, isTechnician]);

  if (error) {
    return (
      <div className="w-full h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="p-4 text-red-500 bg-red-950/40 border border-red-900 rounded-xl max-w-md text-center">
          <p className="font-bold">Error de Conexión</p>
          <p className="text-sm text-red-400 mt-1">{error}</p>
        </div>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="w-full h-screen bg-slate-950 flex items-center justify-center text-slate-500">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Estableciendo conexión...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-screen bg-slate-950 flex flex-col items-center justify-center text-white p-4">
      {/* Estilo local para evitar recortes en la señal de video */}
      <style>{`
        .lk-video-container video, video {
          object-fit: contain !important;
          background-color: #020617 !important;
        }
      `}</style>

      <div className="w-full max-w-4xl h-[90vh] md:h-[80vh] bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl relative flex flex-col">
        <LiveKitRoom
          video={isTechnician}
          audio={true}
          token={token}
          serverUrl={LIVEKIT_SERVER_URL}
          data-lk-theme="default"
        >
          {/* Aquí decidimos qué interfaz mostrar según el rol */}
          {isTechnician ? <TechnicianLayout /> : <ClientLayout />}

          <RoomAudioRenderer />
        </LiveKitRoom>
      </div>
    </div>
  );
}

// ---------------------------------------------------------
// VISTA DEL CLIENTE (REPLICANDO TU DISEÑO)
// ---------------------------------------------------------
function ClientLayout() {
  const cameraTracks = useTracks([
    { source: Track.Source.Camera, withPlaceholder: false },
  ]);
  const videoTrack = cameraTracks[0];
  const { localParticipant, isMicrophoneEnabled } = useLocalParticipant();

  // Referencia al contenedor del video para expandirlo
  const videoContainerRef = useRef(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Escuchar si el usuario sale de pantalla completa mediante gestos nativos del celular
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange); // Compatibilidad con iOS Safari

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener(
        "webkitfullscreenchange",
        handleFullscreenChange,
      );
    };
  }, []);

  // Función para activar/desactivar la pantalla completa nativa
  const toggleFullscreen = () => {
    const element = videoContainerRef.current;
    if (!element) return;

    if (!isFullscreen) {
      if (element.requestFullscreen) {
        element.requestFullscreen();
      } else if (element.webkitRequestFullscreen) {
        element.webkitRequestFullscreen(); // Para navegadores basados en iOS/Safari
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen(); // Para navegadores basados en iOS/Safari
      }
    }
  };

  const toggleMic = () => {
    localParticipant.setMicrophoneEnabled(!isMicrophoneEnabled);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-950">
      {/* Barra superior de estado */}
      <div className="flex items-center justify-between p-4 border-b border-slate-800/80 bg-slate-900/20">
        <div className="flex items-center gap-2">
          {videoTrack && (
            <span className="w-2.5 h-2.5 bg-red-600 rounded-full animate-pulse"></span>
          )}
          <span className="font-bold tracking-wider text-xs md:text-sm text-slate-200">
            TRANSMISIÓN DE TALLER EN CURSO
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Volume2 className="text-red-500 w-4 h-4 animate-bounce" />
          <span className="text-[10px] bg-slate-800 px-2 py-1 rounded text-slate-400 font-bold uppercase tracking-wider">
            Taller Toyota Live
          </span>
        </div>
      </div>

      {/* Área del reproductor de video (Con referencia para expandir) */}
      <div
        ref={videoContainerRef}
        className="flex-1 relative flex items-center justify-center bg-slate-950 overflow-hidden"
      >
        {videoTrack ? (
          <>
            {/* Reproductor de Video */}
            <VideoTrack trackRef={videoTrack} className="w-full h-full" />

            {/* Botón Flotante de Pantalla Completa */}
            <button
              onClick={toggleFullscreen}
              className="absolute bottom-4 right-4 bg-slate-900/80 hover:bg-slate-800 border border-slate-700/50 p-2.5 rounded-lg text-white transition-all cursor-pointer shadow-lg backdrop-blur-sm active:scale-95"
              title={
                isFullscreen
                  ? "Salir de pantalla completa"
                  : "Pantalla completa"
              }
            >
              {isFullscreen ? (
                <Minimize className="w-5 h-5 text-slate-200" />
              ) : (
                <Maximize className="w-5 h-5 text-slate-200" />
              )}
            </button>

            {/* Sugerencia visual temporal cuando NO está en pantalla completa */}
            {!isFullscreen && (
              <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-slate-900/85 border border-slate-800 px-3 py-1.5 rounded-full shadow-md backdrop-blur-sm pointer-events-none">
                <span className="text-[10px] font-semibold text-slate-300 tracking-wider uppercase block text-center">
                  🔄 Gira tu celular para pantalla completa
                </span>
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center p-6 text-center">
            <div className="w-16 h-16 rounded-full bg-slate-900 border border-slate-800/60 flex items-center justify-center mb-5">
              <VideoOff className="text-slate-600 w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-slate-200 tracking-tight">
              Señal de Video en Pausa
            </h3>
            <p className="text-xs text-slate-400 max-w-md mt-2 leading-relaxed px-4">
              El técnico se encuentra en una pausa breve de inspección estática
              o calibrando la cámara de bahía. El audio sigue disponible.
            </p>
          </div>
        )}
      </div>

      {/* Botón flotante para hablar por audio (Llamar) */}
      <div className="p-4 border-t border-slate-800/60 bg-slate-900/40">
        <button
          onClick={toggleMic}
          className={`w-full flex items-center justify-center gap-2 font-bold py-3.5 px-4 rounded-xl transition-all cursor-pointer shadow-lg text-xs md:text-sm ${
            isMicrophoneEnabled
              ? "bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 shadow-emerald-900/20"
              : "bg-red-600 hover:bg-red-700 active:bg-red-800 shadow-red-900/20"
          }`}
        >
          {isMicrophoneEnabled ? (
            <>
              <Mic className="w-5 h-5 animate-pulse" />
              <span>HABLANDO EN VIVO (PRESIONA PARA SILENCIAR)</span>
            </>
          ) : (
            <>
              <MicOff className="w-5 h-5 text-slate-200" />
              <span>HABLAR CON EL TÉCNICO POR AUDIO (LLAMAR)</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------
// VISTA DEL TÉCNICO (CONSOLA DE CONTROL DE MEDIOS COMPLETA)
// ---------------------------------------------------------
function TechnicianLayout() {
  const { localParticipant, isMicrophoneEnabled, isCameraEnabled } =
    useLocalParticipant();

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-900">
      <div className="p-4 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
        <h2 className="text-sm font-bold tracking-wider text-red-500">
          CONSOLA DE TRANSMISIÓN DEL TÉCNICO
        </h2>
        <span className="text-xs bg-slate-800 px-2.5 py-1 rounded-full text-slate-400">
          Rol: Emisor
        </span>
      </div>

      {/* Monitor de retorno para el técnico (Ve su propia OBS Virtual Camera) */}
      <div className="flex-1 bg-slate-950 flex items-center justify-center relative">
        {isCameraEnabled ? (
          <VideoTrack
            trackRef={{
              participant: localParticipant,
              source: Track.Source.Camera,
            }}
            className="w-full h-full"
          />
        ) : (
          <div className="text-slate-500 text-sm">Tu cámara está apagada</div>
        )}
      </div>

      {/* Controles de muteo y estado para el técnico */}
      <div className="p-4 border-t border-slate-800 bg-slate-950 flex justify-center gap-4">
        <button
          onClick={() =>
            localParticipant.setMicrophoneEnabled(!isMicrophoneEnabled)
          }
          className={`px-5 py-2.5 rounded-lg font-semibold text-sm transition-all cursor-pointer ${
            isMicrophoneEnabled
              ? "bg-slate-800 hover:bg-slate-700 text-white"
              : "bg-red-600 hover:bg-red-700 text-white"
          }`}
        >
          {isMicrophoneEnabled ? "Silenciar Micrófono" : "Activar Micrófono"}
        </button>

        <button
          onClick={() => localParticipant.setCameraEnabled(!isCameraEnabled)}
          className={`px-5 py-2.5 rounded-lg font-semibold text-sm transition-all cursor-pointer ${
            isCameraEnabled
              ? "bg-slate-800 hover:bg-slate-700 text-white"
              : "bg-red-600 hover:bg-red-700 text-white"
          }`}
        >
          {isCameraEnabled ? "Pausar Video (OBS)" : "Reanudar Video (OBS)"}
        </button>
      </div>
    </div>
  );
}
