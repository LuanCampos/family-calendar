import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://iambwblptokdiwjkztss.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlhbWJ3YmxwdG9rZGl3amt6dHNzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU5OTg3MTYsImV4cCI6MjA4MTU3NDcxNn0.w_il9JwSo8NFscHQ6aaJ9LNlpy06fbBh54sgg9FU1tw';

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
