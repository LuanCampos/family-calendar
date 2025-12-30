import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://okpdeaxwabkopkiqzhpc.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9rcGRlYXh3YWJrb3BraXF6aHBjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcwOTYwNDIsImV4cCI6MjA4MjY3MjA0Mn0.5fb1wlbkvjtlAkcaH7TJdiOfPctv-wn-HbLbeNTdMa8';

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
