import { useState, useEffect } from "react";
import supabase from "@/lib/supabase";
import { sessionService } from "@/services/sessionService";

export function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("create"); // 'create', 'active', 'history'
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(false);

  // Estados del formulario de creación
  const [roomName, setRoomName] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");

  // Cargar las sesiones de Supabase
  const fetchSessions = async () => {
    setLoading(true);
    try {
      const data = await sessionService.getAll();
      setSessions(data);
    } catch (error) {
      console.error("Error:", error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  // Crear nueva sesión en Supabase
  const handleCreateSession = async (e) => {
    e.preventDefault();
    if (!roomName) return alert("El identificador/placas es obligatorio");

    setLoading(true);
    const { data, error } = await supabase
      .from("sessions")
      .insert([
        {
          room_name: roomName,
          customer_name: customerName || "Cliente General",
          customer_phone: customerPhone || null,
          status: "waiting",
        },
      ])
      .select();

    if (error) {
      alert("Error al guardar en Supabase: " + error.message);
    } else {
      const newSession = data[0];
      alert("Sesión registrada en la base de datos.");

      // Limpiar formulario y recargar lista
      setRoomName("");
      setCustomerName("");
      setCustomerPhone("");
      fetchSessions();
      setActiveTab("active"); // Mover a la pestaña de sesiones activas

      // Si se proporcionó teléfono, abrimos WhatsApp
      if (newSession.customer_phone) {
        shareViaWhatsApp(newSession);
      }
    }
    setLoading(false);
  };

  // Cambiar estado a finalizado
  const handleFinishSession = async (id) => {
    if (
      !confirm(
        "¿Estás seguro de que deseas finalizar esta sesión? El cliente ya no podrá ver la transmisión.",
      )
    )
      return;

    const { error } = await supabase
      .from("sessions")
      .update({ status: "finished" })
      .eq("id", id);

    if (error) {
      alert("Error al actualizar estado: " + error.message);
    } else {
      fetchSessions();
    }
  };

  // Generar enlaces para compartir
  const getUrls = (session) => {
    const baseUri = window.location.origin;
    // Usamos el ID (UUID) como nombre de sala físico para evitar colisiones
    return {
      techUrl: `${baseUri}/?role=technician&room=${session.id}&label=${encodeURIComponent(session.room_name)}`,
      clientUrl: `${baseUri}/?role=client&room=${session.id}&label=${encodeURIComponent(session.room_name)}`,
    };
  };

  // Compartir por WhatsApp
  const shareViaWhatsApp = (session) => {
    const { clientUrl } = getUrls(session);
    const message = `Hola ${session.customer_name}, te comparto el enlace para que puedas observar el servicio de tu vehículo en tiempo real: ${clientUrl}`;
    const whatsappUrl = `https://wa.me/${session.customer_phone}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, "_blank");
  };

  // Filtrar sesiones según la pestaña activa
  const activeSessions = sessions.filter(
    (s) => s.status === "waiting" || s.status === "active",
  );
  const finishedSessions = sessions.filter((s) => s.status === "finished");

  return (
    <div className="min-h-screen bg-slate-950 text-white p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Encabezado */}
        <header className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-800 pb-6 mb-8 gap-4">
          <div>
            <div className="bg-red-600 inline-block px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider mb-2">
              Toyota Posventa
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
              Panel de Control de Transmisiones
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Monitoreo y administración de mantenimiento en vivo
            </p>
          </div>
          <button
            onClick={fetchSessions}
            className="self-start md:self-auto bg-slate-800 hover:bg-slate-700 text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
          >
            Refrescar Datos
          </button>
        </header>

        {/* Navegación por pestañas */}
        <div className="flex border-b border-slate-800 mb-8 gap-2">
          <button
            onClick={() => setActiveTab("create")}
            className={`pb-3 px-4 font-semibold text-sm border-b-2 transition-all ${
              activeTab === "create"
                ? "border-red-600 text-white"
                : "border-transparent text-slate-400 hover:text-white"
            }`}
          >
            Nueva Sesión
          </button>
          <button
            onClick={() => setActiveTab("active")}
            className={`pb-3 px-4 font-semibold text-sm border-b-2 transition-all relative ${
              activeTab === "active"
                ? "border-red-600 text-white"
                : "border-transparent text-slate-400 hover:text-white"
            }`}
          >
            Sesiones Activas
            {activeSessions.length > 0 && (
              <span className="ml-2 bg-red-600 text-[10px] text-white px-2 py-0.5 rounded-full">
                {activeSessions.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`pb-3 px-4 font-semibold text-sm border-b-2 transition-all ${
              activeTab === "history"
                ? "border-red-600 text-white"
                : "border-transparent text-slate-400 hover:text-white"
            }`}
          >
            Historial
          </button>
        </div>

        {/* Contenido de Pestañas */}
        {activeTab === "create" && (
          <div className="max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
            <h2 className="text-lg font-bold mb-4 text-slate-200">
              Registrar Nuevo Servicio
            </h2>
            <form onSubmit={handleCreateSession} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-400 mb-1.5">
                  Placas / Identificador (Obligatorio)
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: PLACA-XYZ123"
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-red-600"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-400 mb-1.5">
                  Nombre del Cliente
                </label>
                <input
                  type="text"
                  placeholder="Ej: Sr. Mario Gómez"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-red-600"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-400 mb-1.5">
                  Teléfono Cliente (WhatsApp)
                </label>
                <input
                  type="tel"
                  placeholder="Ej: 5215512345678"
                  value={customerPhone} // <-- Cambiado de clientPhone a customerPhone
                  onChange={(e) => setCustomerPhone(e.target.value)} // <-- Cambiado de setClientPhone a setCustomerPhone
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-red-600"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Código país + número sin espacios (ej. 521 para MX).
                </span>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-red-600 hover:bg-red-700 disabled:bg-red-800 font-semibold py-2.5 rounded-lg transition-colors cursor-pointer"
              >
                {loading ? "Guardando..." : "Crear Sesión"}
              </button>
            </form>
          </div>
        )}

        {activeTab === "active" && (
          <div className="overflow-x-auto bg-slate-900 border border-slate-800 rounded-2xl shadow-xl">
            {activeSessions.length === 0 ? (
              <p className="p-8 text-center text-slate-500">
                No hay sesiones activas en este momento.
              </p>
            ) : (
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950 text-slate-400 text-xs uppercase font-bold">
                    <th className="p-4">Identificador</th>
                    <th className="p-4">Cliente</th>
                    <th className="p-4">Fecha Creación</th>
                    <th className="p-4">Enlaces de Acceso</th>
                    <th className="p-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {activeSessions.map((session) => {
                    const { techUrl, clientUrl } = getUrls(session);
                    return (
                      <tr key={session.id} className="hover:bg-slate-800/40">
                        <td className="p-4 font-semibold text-white">
                          {session.room_name}
                        </td>
                        <td className="p-4 text-slate-300">
                          {session.customer_name}
                        </td>
                        <td className="p-4 text-slate-400">
                          {new Date(session.created_at).toLocaleString()}
                        </td>
                        <td className="p-4 space-y-1.5">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-slate-400 w-16">
                              Técnico
                            </span>
                            <a
                              href={techUrl}
                              target="_blank"
                              className="text-red-500 hover:underline text-xs"
                            >
                              Entrar a transmitir
                            </a>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-slate-400 w-16">
                              Cliente
                            </span>
                            <a
                              href={clientUrl}
                              target="_blank"
                              className="text-red-500 hover:underline text-xs truncate max-w-50"
                            >
                              Ver como cliente
                            </a>
                          </div>
                        </td>
                        <td className="p-4 text-right space-x-2">
                          {session.customer_phone && (
                            <button
                              onClick={() => shareViaWhatsApp(session)}
                              className="bg-green-700 hover:bg-green-800 text-xs px-3 py-1.5 rounded transition-colors"
                            >
                              WhatsApp
                            </button>
                          )}
                          <button
                            onClick={() => handleFinishSession(session.id)}
                            className="bg-slate-800 hover:bg-red-950 hover:text-red-300 text-xs px-3 py-1.5 rounded transition-all"
                          >
                            Finalizar
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}

        {activeTab === "history" && (
          <div className="overflow-x-auto bg-slate-900 border border-slate-800 rounded-2xl shadow-xl">
            {finishedSessions.length === 0 ? (
              <p className="p-8 text-center text-slate-500">
                El historial está vacío.
              </p>
            ) : (
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950 text-slate-400 text-xs uppercase font-bold">
                    <th className="p-4">Identificador</th>
                    <th className="p-4">Cliente</th>
                    <th className="p-4">Fecha Creación</th>
                    <th className="p-4">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {finishedSessions.map((session) => (
                    <tr
                      key={session.id}
                      className="hover:bg-slate-800/20 text-slate-400"
                    >
                      <td className="p-4 font-semibold text-slate-300">
                        {session.room_name}
                      </td>
                      <td className="p-4">{session.customer_name}</td>
                      <td className="p-4">
                        {new Date(session.created_at).toLocaleString()}
                      </td>
                      <td className="p-4">
                        <span className="bg-slate-800 text-slate-500 text-[10px] px-2.5 py-1 rounded-full font-semibold uppercase">
                          Finalizado
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
