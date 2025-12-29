import type { Event } from '@/types/calendar';

/**
 * Filters events based on selected tag IDs
 * If selectedTagIds is empty, returns all events
 * If selectedTagIds has values, returns only events that have at least one of those tags
 */
export const filterEventsByTags = (
  events: Event[],
  selectedTagIds: string[]
): Event[] => {
  // If no filters, return all events
  if (selectedTagIds.length === 0) {
    return events;
  }

  // Filter events that have at least one of the selected tags
  return events.filter((event) => {
    if (!event.tags || event.tags.length === 0) {
      return false;
    }

    return event.tags.some((tag) => selectedTagIds.includes(tag.id));
  });
};

/**
 * Gets a summary of how many events match each tag
 */
export const getTagEventCounts = (
  events: Event[],
  tagIds: string[]
): Record<string, number> => {
  const counts: Record<string, number> = {};

  tagIds.forEach((tagId) => {
    counts[tagId] = events.filter((event) =>
      event.tags?.some((tag) => tag.id === tagId)
    ).length;
  });

  return counts;
};
