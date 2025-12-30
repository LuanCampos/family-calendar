import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://okpdeaxwabkopkiqzhpc.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9rcGRlYXh3YWJrb3BraXF6aHBjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcwOTYwNDIsImV4cCI6MjA4MjY3MjA0Mn0.5fb1wlbkvjtlAkcaH7TJdiOfPctv-wn-HbLbeNTdMa8';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
