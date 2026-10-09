import { supabase } from '../config/supabase';
import type { UserProfile } from '../models/user.model';

export const authService = {
  // --- Funciones para el Panel de Admin ---
  async getProfiles(): Promise<UserProfile[]> {
    const { data, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return data as UserProfile[];
  },

  async toggleUserStatus(id: string, currentStatus: boolean): Promise<void> {
    const { error } = await supabase.from('profiles').update({ is_active: !currentStatus }).eq('id', id);
    if (error) throw new Error(error.message);
  },

  // --- Funciones REALES de Autenticación (Para el Login) ---
  
  // 1. Crear la cuenta segura en Auth y guardar los datos en perfiles
  async registerUser(email: string, password: string, name: string, dni: string, phone: string): Promise<void> {
    // A. Registramos la credencial en el sistema de seguridad
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });
    if (authError) throw new Error(authError.message);
    if (!authData.user) throw new Error("No se pudo crear el usuario");

    // B. Guardamos los datos públicos en nuestra tabla usando el mismo ID seguro
    const { error: profileError } = await supabase.from('profiles').insert([{
      id: authData.user.id,
      email,
      name,
      dni,
      phone,
      role: 'cliente',
      is_active: true
    }]);
    
    if (profileError) throw new Error(profileError.message);
  },

  // 2. Iniciar sesión validando contraseña
  async loginUser(email: string, password: string) {
    // A. Validar credenciales
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (authError) throw new Error("Credenciales incorrectas");
    if (!authData.user) throw new Error("Usuario no encontrado");

    // B. Buscar el rol y si está activo en nuestra tabla
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    if (profileError || !profile) throw new Error("No se encontraron los datos del perfil");
    
    if (profile.is_active === false) {
      // Si está desactivado, lo deslogueamos por seguridad
      await supabase.auth.signOut();
      throw new Error("Tu cuenta está desactivada. Contactá al administrador.");
    }

    // Retornamos el perfil para saber si es admin o cliente
    return profile as UserProfile;
  },
  
  // 3. Cerrar sesión
  async logout() {
    await supabase.auth.signOut();
  },
  async resetPassword(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) throw new Error(error.message);
  },
  async updatePassword(newPassword: string) {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw new Error(error.message);
  }
};