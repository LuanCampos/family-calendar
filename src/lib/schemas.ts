/**
 * Database Validation Schemas
 * 
 * Zod schemas for validating data from/to Supabase
 * These ensure type safety at runtime, catching issues early
 */

import { z } from 'zod';

/**
 * Event row from database
 */
export const EventRowSchema = z.object({
  id: z.string().min(1),
  family_id: z.string().min(1),
  title: z.string().min(1).max(255),
  description: z.string().max(2000).nullable(),
  date: z.string(), // YYYY-MM-DD
  time: z.string().nullable(), // HH:mm
  duration_minutes: z.number().int().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type EventRowValidated = z.infer<typeof EventRowSchema>;

/**
 * Tag definition row from database
 */
export const TagDefinitionRowSchema = z.object({
  id: z.string().min(1),
  family_id: z.string().min(1),
  name: z.string().min(1).max(100),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  created_at: z.string(),
});

export type TagDefinitionRowValidated = z.infer<typeof TagDefinitionRowSchema>;

/**
 * Event tag row from database
 */
export const EventTagRowSchema = z.object({
  event_id: z.string().min(1),
  tag_id: z.string().min(1),
});

export type EventTagRowValidated = z.infer<typeof EventTagRowSchema>;

/**
 * Validation utility to safely parse and validate data
 * Returns {success: true, data} or {success: false, error}
 */
export function validateEventRow(data: unknown) {
  try {
    return { success: true, data: EventRowSchema.parse(data) };
  } catch (error) {
    return { success: false, error };
  }
}

export function validateTagDefinitionRow(data: unknown) {
  try {
    return { success: true, data: TagDefinitionRowSchema.parse(data) };
  } catch (error) {
    return { success: false, error };
  }
}

export function validateEventTagRow(data: unknown) {
  try {
    return { success: true, data: EventTagRowSchema.parse(data) };
  } catch (error) {
    return { success: false, error };
  }
}

