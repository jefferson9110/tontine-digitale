import { createClient } from '@supabase/supabase-js';

const supabaseUrl  = import.meta.env.VITE_SUPABASE_URL  as string;
const supabaseKey  = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    '❌ Variables VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY manquantes dans .env'
  );
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession:   true,
    detectSessionInUrl: true,
  },
  realtime: {
    params: { eventsPerSecond: 10 },
  },
});

// Helper : récupérer l'utilisateur actuel ou null
export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

// Helper : récupérer la session ou null
export async function getSession() {
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}
