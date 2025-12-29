import type { Event, EventTag } from '@/types/calendar';

/**
 * Event utilities for tag enrichment and mapping
 */

/**
 * Check if tags is an array of EventTag objects (not strings)
 */
export const isEventTagArray = (tags: string[] | EventTag[]): tags is EventTag[] => {
  return tags.length > 0 && typeof tags[0] === 'object';
};

/**
 * Enrich events with EventTag objects by mapping tag IDs to tag data
 */
export const enrichEventsWithTags = (
  events: Event[],
  allTags: EventTag[]
): Event[] => {
  return events.map(event => {
    // Skip if already enriched
    if (isEventTagArray(event.tags)) {
      return event;
    }

    // Map tag IDs to EventTag objects
    const enrichedTags = (event.tags as string[])
      .map(tagId => allTags.find(tag => tag.id === tagId))
      .filter((tag): tag is EventTag => tag !== undefined);

    return {
      ...event,
      tags: enrichedTags,
    };
  });
};

/**
 * Get tag IDs from an event (handles both string[] and EventTag[] formats)
 */
export const getTagIds = (tags: string[] | EventTag[]): string[] => {
  if (tags.length === 0) return [];
  return isEventTagArray(tags) ? tags.map(t => t.id) : (tags as string[]);
};

/**
 * Get tag data from an event (converts to EventTag[] if needed)
 */
export const getTagData = (tags: string[] | EventTag[], allTags?: EventTag[]): EventTag[] => {
  if (isEventTagArray(tags)) {
    return tags;
  }

  if (!allTags) return [];

  return (tags as string[])
    .map(tagId => allTags.find(tag => tag.id === tagId))
    .filter((tag): tag is EventTag => tag !== undefined);
};
