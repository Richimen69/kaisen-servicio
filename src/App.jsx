import { AdminDashboard } from '@/pages/Admin/AdminDashboard';
import VideoSession from '@/components/video/VideoSession';

function App() {
  // Leemos de forma nativa los parámetros de la URL
  const queryParams = new URLSearchParams(window.location.search);
  const role = queryParams.get('role'); // "technician" o "client"
  const room = queryParams.get('room'); // ID de la sesión (UUID de Supabase)
  const label = queryParams.get('label') || 'Servicio Toyota'; // Identificador amigable (Placa)

  // FLUJO 1: Si la URL no tiene parámetros, mostramos el Panel de Administración
  if (!role || !room) {
    return <AdminDashboard />;
  }

  // FLUJO 2: Si tiene parámetros, procesamos la conexión a la videollamada de LiveKit
  const isTechnician = role === 'technician';
  const participantName = isTechnician ? 'Técnico' : 'Cliente';

  return (
    <VideoSession 
      roomName={room} // ID único (UUID) que usa LiveKit internamente como nombre de sala
      participantName={`${participantName} (${label})`} // Nombre visible en la llamada
      isTechnician={isTechnician} 
    />
  );
}

export default App;