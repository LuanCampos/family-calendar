/**
 * Input Validators
 * 
 * Validates user input before database operations
 * Ensures data integrity at application boundaries
 */

import { z } from 'zod';

/**
 * Validate event creation input
 */
export const CreateEventInputSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().max(2000).optional(),
  date: z.string().date(), // YYYY-MM-DD format
  time: z.string().regex(/^\d{2}:\d{2}$/).optional(), // HH:mm format
  duration: z.number().int().min(0).optional(), // in minutes
  tags: z.array(z.string()).optional(),
  isPending: z.boolean().optional(),
});

export type CreateEventInput = z.infer<typeof CreateEventInputSchema>;

/**
 * Validate event update input (all fields optional)
 */
export const UpdateEventInputSchema = CreateEventInputSchema.partial();

export type UpdateEventInput = z.infer<typeof UpdateEventInputSchema>;

/**
 * Validate event tag creation input
 */
export const CreateEventTagInputSchema = z.object({
  name: z.string().min(1).max(100),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(), // hex color
});

export type CreateEventTagInput = z.infer<typeof CreateEventTagInputSchema>;

/**
 * Validate event tag update input
 */
export const UpdateEventTagInputSchema = CreateEventTagInputSchema.partial();

export type UpdateEventTagInput = z.infer<typeof UpdateEventTagInputSchema>;

/**
 * Safe validation helper
 * Returns {success: true, data} or {success: false, error}
 */
export function validateInput<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: boolean; data?: T; error?: unknown } {
  try {
    return { success: true, data: schema.parse(data) };
  } catch (error) {
    return { success: false, error };
  }
}

