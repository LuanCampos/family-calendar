/**
 * Calendar and Event types
 */

export interface Event {
  id: string;
  title: string;
  description?: string;
  date: string; // YYYY-MM-DD format
  time?: string; // HH:mm format
  duration?: number; // in minutes
  isAllDay?: boolean; // true if it's an all-day event
  familyId: string;
  createdBy: string; // userId
  tags: string[] | EventTag[]; // array of tag IDs or EventTag objects
  isPending?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface EventTag {
  id: string;
  name: string;
  color: string; // hex color like #3B82F6
  familyId: string;
  createdBy: string;
  createdAt?: string;
}

export interface EventInput {
  title: string;
  description?: string;
  date: string;
  time?: string;
  duration?: number;
  isAllDay?: boolean;
  tags?: string[];
  isPending?: boolean;
}

export interface EventTagInput {
  name: string;
  color?: string;
}
