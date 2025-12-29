import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xkjvmqpwbztnrhfgdlcp.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhranZtcXB3Ynp0bnJoZmdkbGNwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc5NTIzNDUsImV4cCI6MjA4MzUyODM0NX0.a7qKf9mNpzXwRxFyVsQ2jHbTdLmKcwEpGhJ3zNvWqYk';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
