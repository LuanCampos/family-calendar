import type { Event } from '@/types/calendar';

export const UNTAGGED_FILTER_ID = '__untagged__';

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

  const includeUntagged = selectedTagIds.includes(UNTAGGED_FILTER_ID);
  const selectedRealTagIds = selectedTagIds.filter(
    (id) => id !== UNTAGGED_FILTER_ID
  );

  // Filter events that have at least one of the selected tags
  return events.filter((event) => {
    const hasTags = Array.isArray(event.tags) && event.tags.length > 0;

    // Include events with no tags when UNTAGGED is selected
    if (includeUntagged && !hasTags) {
      return true;
    }

    // If only UNTAGGED was selected, exclude tagged events
    if (includeUntagged && selectedRealTagIds.length === 0) {
      return false;
    }

    if (!hasTags) {
      return false;
    }

    return event.tags.some((tag) =>
      typeof tag === 'string'
        ? selectedRealTagIds.includes(tag)
        : selectedRealTagIds.includes(tag.id)
    );
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
