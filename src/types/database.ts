/**
 * Database Types
 * 
 * These types represent rows from Supabase tables exactly as they come from the database.
 * They use snake_case naming to match database schema.
 */

export interface EventRow {
  id: string;
  family_id: string;
  title: string;
  description: string | null;
  date: string; // YYYY-MM-DD
  time: string | null; // HH:mm
  duration_minutes: number | null;
  created_at: string;
  updated_at: string;
}

export interface EventTagRow {
  event_id: string;
  tag_id: string;
}

export interface TagDefinitionRow {
  id: string;
  family_id: string;
  name: string;
  color: string;
  created_at: string;
}

/**
 * Supabase Channel types
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type SupabaseChannel = any;
