/**
 * Input Validators
 * 
 * Validates user input before database operations
 * Ensures data integrity at application boundaries
 */

import { z } from 'zod';

// ============================================================================
// SEC-010: Centralized ID Validators
// ============================================================================

/**
 * Valid UUID format (standard UUID v4)
 */
export const isValidUUID = (id: string): boolean => {
  return /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(id);
};

/**
 * Valid offline ID format (prefix + UUID)
 */
export const isOfflineId = (id: string): boolean => {
  return id.startsWith('offline:') && isValidUUID(id.slice(8));
};

/**
 * Valid event/family/tag ID (either UUID or offline ID)
 */
export const isValidId = (id: string): boolean => {
  if (!id || typeof id !== 'string') return false;
  return isValidUUID(id) || isOfflineId(id);
};

/**
 * Zod schema for UUID validation
 */
export const UUIDSchema = z.string().refine(isValidUUID, {
  message: 'Invalid UUID format',
});

/**
 * Zod schema for ID validation (UUID or offline ID)
 */
export const IdSchema = z.string().refine(isValidId, {
  message: 'Invalid ID format',
});

// ============================================================================
// SEC-006: Password Validation
// ============================================================================

/**
 * Check if password meets security requirements
 * - Minimum 8 characters
 * - At least one uppercase letter
 * - At least one number
 */
export const isStrongPassword = (password: string): boolean => {
  return (
    password.length >= 8 &&
    /[A-Z]/.test(password) &&
    /[0-9]/.test(password)
  );
};

/**
 * Get password validation errors
 */
export const getPasswordErrors = (password: string): string[] => {
  const errors: string[] = [];
  if (password.length < 8) errors.push('min8chars');
  if (!/[A-Z]/.test(password)) errors.push('needsUppercase');
  if (!/[0-9]/.test(password)) errors.push('needsNumber');
  return errors;
};

/**
 * Zod schema for strong password
 */
export const PasswordSchema = z.string().refine(isStrongPassword, {
  message: 'Password must be at least 8 characters with uppercase and number',
});

// ============================================================================
// Event Validators
// ============================================================================

/**
 * Recurrence rule schema for recurring events
 */
export const RecurrenceRuleSchema = z.object({
  frequency: z.enum(['daily', 'weekly', 'monthly', 'yearly']),
  interval: z.number().int().min(1).max(365).optional(),
  daysOfWeek: z.array(z.number().int().min(0).max(6)).optional(),
  endDate: z.string().date().optional(),
  count: z.number().int().min(1).max(999).optional(),
}).optional();

/**
 * Validate event creation input
 */
export const CreateEventInputSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().max(2000).optional(),
  date: z.string().date(), // YYYY-MM-DD format
  time: z.string().regex(/^\d{2}:\d{2}$/).optional(), // HH:mm format
  duration: z.number().int().min(0).max(1440).optional(), // in minutes, max 24h
  tags: z.array(z.string()).optional(),
  isPending: z.boolean().optional(),
  isAllDay: z.boolean().optional(),
  isRecurring: z.boolean().optional(),
  recurrenceRule: RecurrenceRuleSchema,
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

