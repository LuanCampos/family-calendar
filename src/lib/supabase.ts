import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (typeof supabaseUrl !== 'string' || !supabaseUrl) {
  throw new Error('VITE_SUPABASE_URL is not set');
}

if (typeof supabaseAnonKey !== 'string' || !supabaseAnonKey) {
  throw new Error('VITE_SUPABASE_ANON_KEY is not set');
}

/**
 * Single Supabase client for the entire application
 * 
 * CRITICAL: All parts of the app MUST use this client instance.
 * This ensures:
 * 1. Session is shared across all services and contexts
 * 2. Auth token is automatically included in all requests
 * 3. Auto-refresh keeps the session valid
 * 4. Persistent session survives page reloads
 * 
 * NO other supabase clients should be created anywhere in the codebase.
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,      // Keep session in localStorage
    autoRefreshToken: true,    // Auto-refresh expired tokens
    detectSessionInUrl: true,  // Detect auth token in URL hash (email confirmations, etc)
  },
});
