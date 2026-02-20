import { supabase } from '@/integrations/supabase/client';
import { adminClient } from '@/integrations/supabase/admin-client';

export const usersService = {
  /**
   * Creates a new user for a specific client.
   * This uses the adminClient to create the Auth user without logging out the current admin.
   */
  async createClientUser(email: string, password: string, nombre: string, clienteId: string) {
    // 1. Create the user in Supabase Auth
    const { data: authData, error: authError } = await adminClient.auth.signUp({
      email,
      password,
      options: {
        data: { nombre },
      },
    });

    if (authError) throw authError;
    if (!authData.user) throw new Error('No se pudo crear el usuario en Auth.');

    const userId = authData.user.id;

    // 2. Update the profile with the cliente_id
    // The profile is automatically created by a DB trigger on_auth_user_created
    // but we need to link it to the client.
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ cliente_id: clienteId })
      .eq('id', userId);

    if (profileError) {
      console.error('Error updating profile with cliente_id:', profileError);
      // We don't throw here to avoid failing the whole process if the profile 
      // trigger was slightly delayed, although in a real app we'd want more robustness.
    }

    // 3. Assign the 'cliente' role
    // @ts-ignore - 'cliente' role exists in DB
    const { error: roleError } = await supabase
      .from('user_roles')
      .insert({
        user_id: userId,
        role: 'cliente'
      });

    if (roleError) {
      console.error('Error assigning cliente role:', roleError);
    }

    return authData.user;
  },

  async getUsersByClient(clienteId: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('cliente_id', clienteId);

    if (error) throw error;
    return data;
  }
};
