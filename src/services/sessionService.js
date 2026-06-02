import supabase from '@/lib/supabase';

export const sessionService = {
  // Obtener todas las sesiones
  async getAll() {
    const { data, error } = await supabase
      .from('sessions')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  // Crear una nueva sesión
  async create(roomName, customerName, customerPhone) {
    const { data, error } = await supabase
      .from('sessions')
      .insert([
        {
          room_name: roomName,
          customer_name: customerName || 'Cliente General',
          customer_phone: customerPhone || null,
          status: 'waiting'
        }
      ])
      .select();

    if (error) throw error;
    return data[0];
  },

  // Finalizar una sesión
  async finish(id) {
    const { error } = await supabase
      .from('sessions')
      .update({ status: 'finished' })
      .eq('id', id);

    if (error) throw error;
    return true;
  }
};