import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

// Este cliente se usa específicamente para registrar usuarios sin sobrescribir la sesión actual
export const adminClient = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    persistSession: false, // CRITICAL: Esto evita el logout del admin
    autoRefreshToken: false,
    detectSessionInUrl: false
  }
});
