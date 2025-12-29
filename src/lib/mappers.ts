/**
 * Type Mappers
 * 
 * Transforms database row types (snake_case) to application types (camelCase)
 * Centralizes all transformations to avoid duplication across storage layers
 */

import type { EventRow, TagDefinitionRow } from '@/types/database';
import type { Event, EventTag } from '@/types/calendar';

/**
 * Map database EventRow to application Event
 */
export const mapEventRow = (row: EventRow, tags: string[] = []): Event => ({
  id: row.id,
  title: row.title,
  description: row.description ?? undefined,
  date: row.date,
  time: row.time ?? undefined,
  duration: row.duration_minutes ?? undefined,
  familyId: row.family_id,
  createdBy: row.created_by,
  tags,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  isPending: false,
});

/**
 * Map database TagDefinitionRow to application EventTag
 */
export const mapTagDefinitionRow = (row: TagDefinitionRow): EventTag => ({
  id: row.id,
  name: row.name,
  color: row.color,
  familyId: row.family_id,
  createdBy: row.created_by,
  createdAt: row.created_at,
});

/**
 * Batch map event rows
 */
export const mapEventRows = (rows: EventRow[], tagMap?: Map<string, string[]>): Event[] =>
  rows.map(row => mapEventRow(row, tagMap?.get(row.id) || []));

/**
 * Batch map tag definition rows
 */
export const mapTagDefinitionRows = (rows: TagDefinitionRow[]): EventTag[] =>
  rows.map(mapTagDefinitionRow);

