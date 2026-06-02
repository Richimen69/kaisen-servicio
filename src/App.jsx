import { useState } from 'react'; // <-- Importación necesaria que faltaba
import VideoSession from './components/VideoSession';

function App() {
  // Leemos los parámetros directamente de la URL del navegador
  const queryParams = new URLSearchParams(window.location.search);
  const role = queryParams.get('role'); // "technician" o "client"
  const room = queryParams.get('room'); // ej: "sala-toyota-123"

  // Si no hay parámetros en la URL, mostramos la pantalla para CREAR la sesión (Dashboard)
  if (!role || !room) {
    return <DashboardCreator />;
  }

  const isTechnician = role === 'technician';
  const participantName = isTechnician ? 'Técnico Toyota' : 'Cliente Toyota';

  return (
    <VideoSession 
      roomName={room} 
      participantName={participantName} 
      isTechnician={isTechnician} 
    />
  );
}

// Un pequeño panel administrativo para generar las salas
function DashboardCreator() {
  const [roomName, setRoomName] = useState('');
  const [clientPhone, setClientPhone] = useState(''); // Formato: 521XXXXXXXXXX (México)

  const handleCreateSession = () => {
    if (!roomName) return alert('Por favor escribe un nombre de sala (ej: Placas o No. Orden)');

    // Detectamos la URL base actual (ej: http://localhost:5173 o tu dominio en Vercel)
    const baseUri = window.location.origin;

    // Generamos las dos URLs
    const techUrl = `${baseUri}/?role=technician&room=${encodeURIComponent(roomName)}`;
    const clientUrl = `${baseUri}/?role=client&room=${encodeURIComponent(roomName)}`;

    // Mensaje personalizado para el cliente
    const message = `Hola, soy tu asesor de servicio Toyota. Te comparto el enlace para que puedas ver el mantenimiento de tu auto en tiempo real: ${clientUrl}`;
    
    // Generamos el enlace directo a WhatsApp Web / App
    // Si agregas el teléfono, abrirá el chat directamente con ese número.
    const whatsappUrl = `https://wa.me/${clientPhone}?text=${encodeURIComponent(message)}`;

    // Mostramos los resultados en pantalla para que el técnico los tenga de referencia
    alert(`¡Sesión Creada!\n\nEnlace Técnico (Cópialo): ${techUrl}\n\nEnlace Cliente: Enviando por WhatsApp...`);
    
    // Abre WhatsApp en una nueva pestaña listo para enviar el mensaje al cliente
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 text-white">
      {/* Tarjeta de Control */}
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl">
        
        {/* Cabecera estilo Toyota */}
        <div className="flex flex-col items-center mb-6">
          <div className="bg-red-600 px-4 py-1.5 rounded-full text-xs font-bold tracking-widest uppercase mb-2">
            TOYOTA SERVICE
          </div>
          <h1 className="text-xl font-bold tracking-tight">Panel de Control en Vivo</h1>
          <p className="text-sm text-slate-400 mt-1">Generador de sesiones de taller</p>
        </div>

        {/* Formulario */}
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Identificador de la Sala
            </label>
            <input
              type="text"
              placeholder="Ej: PLACA-XYZ123 o ORDEN-4550"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-red-600 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              WhatsApp del Cliente (Opcional)
            </label>
            <input
              type="tel"
              placeholder="Ej: 5215512345678 (Incluir Lada)"
              value={clientPhone}
              onChange={(e) => setClientPhone(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-red-600 transition-colors"
            />
            <span className="text-[10px] text-slate-500 mt-1 block">
              Formato México: Código de país (52) + lada y número sin espacios.
            </span>
          </div>

          <button
            onClick={handleCreateSession}
            className="w-full bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-semibold py-3 px-4 rounded-lg transition-colors cursor-pointer text-sm shadow-md shadow-red-900/20"
          >
            Iniciar Sesión y Compartir
          </button>
        </div>

        {/* Pie de página con recomendaciones */}
        <div className="mt-6 pt-4 border-t border-slate-800/60 text-center">
          <p className="text-xs text-slate-500">
            Asegúrate de que el técnico tenga encendida la Cámara Virtual de OBS antes de ingresar.
          </p>
        </div>

      </div>
    </div>
  );
}

export default App;