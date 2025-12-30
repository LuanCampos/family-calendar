import { eventService } from '@/lib/services/eventService';
import { offlineAdapter } from '@/lib/adapters/offlineAdapter';
import { logger } from '@/lib/logger';
import { generateRecurringInstances } from '@/lib/utils/recurrenceUtils';
import type { Event, EventInput, EventTag, EventTagInput } from '@/types/calendar';

/**
 * Helper: Expand recurring events for a date range
 * Generates instances for recurring events only for the requested period
 */
const expandRecurringEvents = (
  events: Event[],
  startDate?: string,
  endDate?: string
): Event[] => {
  const expanded: Event[] = [];

  for (const event of events) {
    if (event.isRecurring && event.recurrenceRule) {
      // Generate instances for this range
      const instances = generateRecurringInstances(event, event.recurrenceRule, startDate, endDate);
      expanded.push(...instances);
    } else {
      // Regular event
      expanded.push(event);
    }
  }

  return expanded;
};

/**
 * Event Adapter - Online/Offline branching for event operations
 * Coordinates between eventService (online) and offlineAdapter (offline)
 */

export const eventAdapter = {
  /**
   * Get events for a family, with online/offline fallback
   * Expands recurring events on demand for the requested date range
   */
  getEvents: async (familyId: string, startDate?: string, endDate?: string): Promise<Event[]> => {
    logger.debug('event.get.start', { familyId, startDate, endDate });

    try {
      if (offlineAdapter.isOfflineId(familyId) || !navigator.onLine) {
        logger.info('event.get.offline', { familyId });
        const events = await offlineAdapter.getEvents(familyId, startDate, endDate);
        return expandRecurringEvents(events || [], startDate, endDate);
      }

      // Online path
      const response = await eventService.getEvents(familyId, startDate, endDate);

      if (response.error) {
        logger.warn('event.get.online.failed', { error: response.error });
        // Fallback to offline
        const events = await offlineAdapter.getEvents(familyId, startDate, endDate);
        return expandRecurringEvents(events || [], startDate, endDate);
      }

      logger.info('event.get.success', { count: response.data?.length || 0 });

      // Sync to offline storage
      if (response.data && response.data.length > 0) {
        await offlineAdapter.syncEvents(response.data);
      }

      return expandRecurringEvents((response.data as Event[]) || [], startDate, endDate);
    } catch (error) {
      logger.error('event.get.exception', { error, familyId });
      const events = await offlineAdapter.getEvents(familyId, startDate, endDate);
      return expandRecurringEvents(events || [], startDate, endDate);
    }
  },

  /**
   * Get a single event with tags
   */
  getEvent: async (eventId: string): Promise<Event | null> => {
    logger.debug('event.getById.start', { eventId });

    try {
      if (!navigator.onLine) {
        const event = await offlineAdapter.getEventById(eventId);
        return event || null;
      }

      const response = await eventService.getEvent(eventId);

      if (response.error) {
        logger.warn('event.getById.online.failed', { error: response.error });
        const event = await offlineAdapter.getEventById(eventId);
        return event || null;
      }

      logger.info('event.getById.success', { eventId });

      // Sync to offline
      if (response.data) {
        await offlineAdapter.put('events', response.data);
      }

      return response.data as Event;
    } catch (error) {
      logger.error('event.getById.exception', { error, eventId });
      const event = await offlineAdapter.getEventById(eventId);
      return event || null;
    }
  },

  /**
   * Create a new event
   */
  createEvent: async (
    familyId: string,
    input: EventInput,
    userId: string
  ): Promise<{ data?: Event; error?: any }> => {
    console.log('[eventAdapter] createEvent called:', { familyId, userId, input });
    logger.debug('event.create.start', { familyId, title: input.title });

    try {
      const isOfflineFamily = offlineAdapter.isOfflineId(familyId);
      const isOffline = !navigator.onLine;
      
      console.log('[eventAdapter] Connection status:', { isOfflineFamily, isOffline, navigator_onLine: navigator.onLine });

      if (isOfflineFamily || isOffline) {
        console.log('[eventAdapter] Using offline path');
        logger.info('event.create.offline', { familyId });

        const offlineId = offlineAdapter.generateOfflineId();
        const event: Event = {
          id: offlineId,
          title: input.title,
          description: input.description,
          date: input.date,
          time: input.time,
          duration: input.duration,
          isAllDay: input.isAllDay,
          familyId,
          createdBy: userId,
          tags: input.tags || [],
          isPending: !isOfflineFamily, // Only pending if online family temporarily offline
        };

        await offlineAdapter.put('events', event);
        
        // Only add to sync queue if it's an online family temporarily offline
        // Offline families never sync
        if (!isOfflineFamily && isOffline) {
          await offlineAdapter.sync.add({
            type: 'event',
            action: 'insert',
            data: event,
            familyId,
          });
        }

        logger.info('event.create.offline.success', { eventId: offlineId });
        return { data: event };
      }

      // Online path
      const response = await eventService.createEvent(familyId, input, userId);

      if (response.error) {
        logger.warn('event.create.online.failed', { error: response.error });

        // Fallback to offline
        const offlineId = offlineAdapter.generateOfflineId();
        const event: Event = {
          id: offlineId,
          title: input.title,
          description: input.description,
          date: input.date,
          time: input.time,
          duration: input.duration,
          isAllDay: input.isAllDay,
          familyId,
          createdBy: userId,
          tags: input.tags || [],
          isPending: true,
        };

        await offlineAdapter.put('events', event);
        await offlineAdapter.sync.add({
          type: 'event',
          action: 'insert',
          data: event,
          familyId,
        });

        return { data: event };
      }

      logger.info('event.create.online.success', { eventId: response.data?.id });

      // Sync to offline
      await offlineAdapter.put('events', response.data);

      return { data: response.data as Event };
    } catch (error) {
      logger.error('event.create.exception', { error, familyId });

      // Fallback to offline
      const offlineId = offlineAdapter.generateOfflineId();
      const event: Event = {
        id: offlineId,
        title: input.title,
        description: input.description,
        date: input.date,
        time: input.time,
        duration: input.duration,
        isAllDay: input.isAllDay,
        familyId,
        createdBy: userId,
        tags: input.tags || [],
        isPending: true,
      };

      await offlineAdapter.put('events', event);
      await offlineAdapter.sync.add({
        type: 'event',
        action: 'insert',
        data: event,
        familyId,
      });

      return { data: event };
    }
  },

  /**
   * Update an event
   */
  updateEvent: async (
    eventId: string,
    input: Partial<EventInput>
  ): Promise<{ data?: Event; error?: any }> => {
    logger.debug('event.update.start', { eventId });

    try {
      // Get event to check family type
      const event = await offlineAdapter.getEventById(eventId);
      if (!event) {
        return { error: 'Event not found' };
      }

      const isOfflineFamily = offlineAdapter.isOfflineId(event.familyId);
      const isOffline = !navigator.onLine;

      if (isOfflineFamily || isOffline) {
        logger.info('event.update.offline', { eventId });

        const updated = { ...event, ...input };
        await offlineAdapter.put('events', updated);
        
        // Only sync if it's an online family temporarily offline
        if (!isOfflineFamily && isOffline) {
          await offlineAdapter.sync.add({
            type: 'event',
            action: 'update',
            data: updated,
            familyId: event.familyId,
          });
        }

        logger.info('event.update.offline.success', { eventId });
        return { data: updated };
      }

      // Online path
      const response = await eventService.updateEvent(eventId, input);

      if (response.error) {
        logger.warn('event.update.online.failed', { error: response.error });

        // Fallback to offline
        const event = await offlineAdapter.getEventById(eventId);
        if (!event) {
          return { error: 'Event not found' };
        }

        const updated = { ...event, ...input };
        await offlineAdapter.put('events', updated);
        await offlineAdapter.sync.add({
          type: 'event',
          action: 'update',
          data: updated,
          familyId: event.familyId,
        });

        return { data: updated };
      }

      logger.info('event.update.online.success', { eventId });

      // Sync to offline
      await offlineAdapter.put('events', response.data);

      return { data: response.data as Event };
    } catch (error) {
      logger.error('event.update.exception', { error, eventId });

      // Fallback to offline
      const event = await offlineAdapter.getEventById(eventId);
      if (!event) {
        return { error: 'Event not found' };
      }

      const updated = { ...event, ...input };
      await offlineAdapter.put('events', updated);
      await offlineAdapter.sync.add({
        type: 'event',
        action: 'update',
        data: updated,
        familyId: event.familyId,
      });

      return { data: updated };
    }
  },

  /**
   * Delete an event (soft delete)
   */
  deleteEvent: async (eventId: string, familyId: string): Promise<{ error?: any }> => {
    logger.debug('event.delete.start', { eventId });

    try {
      const isOfflineFamily = offlineAdapter.isOfflineId(familyId);
      const isOffline = !navigator.onLine;

      if (isOfflineFamily || isOffline) {
        logger.info('event.delete.offline', { eventId });

        await offlineAdapter.deleteEvent(eventId);
        
        // Only sync if it's an online family temporarily offline
        if (!isOfflineFamily && isOffline) {
          await offlineAdapter.sync.add({
            type: 'event',
            action: 'delete',
            data: { id: eventId },
            familyId,
          });
        }

        logger.info('event.delete.offline.success', { eventId });
        return {};
      }

      // Online path
      const response = await eventService.deleteEvent(eventId);

      if (response.error) {
        logger.warn('event.delete.online.failed', { error: response.error });

        // Fallback to offline
        await offlineAdapter.deleteEvent(eventId);
        await offlineAdapter.sync.add({
          type: 'event',
          action: 'delete',
          data: { id: eventId },
          familyId,
        });

        return {};
      }

      logger.info('event.delete.online.success', { eventId });

      // Sync deletion to offline
      await offlineAdapter.deleteEvent(eventId);

      return {};
    } catch (error) {
      logger.error('event.delete.exception', { error, eventId });

      // Fallback to offline
      await offlineAdapter.deleteEvent(eventId);
      await offlineAdapter.sync.add({
        type: 'event',
        action: 'delete',
        data: { id: eventId },
        familyId,
      });

      return {};
    }
  },

  // --- Tags ---

  /**
   * Get all tags for a family
   */
  getEventTags: async (familyId: string): Promise<EventTag[]> => {
    logger.debug('tag.getAll.start', { familyId });

    try {
      // Offline families (with offlineId) always use offline storage
      if (offlineAdapter.isOfflineId(familyId)) {
        logger.info('tag.getAll.offline-family', { familyId });
        const tags = await offlineAdapter.getEventTags(familyId);
        return tags || [];
      }

      // Online families: try online first, fallback to offline
      const response = await eventService.getEventTags(familyId);

      if (response.error) {
        logger.warn('tag.getAll.online.failed', { error: response.error });
        const tags = await offlineAdapter.getEventTags(familyId);
        return tags || [];
      }

      logger.info('tag.getAll.success', { count: response.data?.length || 0 });

      // Sync to offline
      if (response.data && response.data.length > 0) {
        for (const tag of response.data) {
          await offlineAdapter.put('tag_definitions', tag);
        }
      }

      return (response.data as EventTag[]) || [];
    } catch (error) {
      logger.error('tag.getAll.exception', { error, familyId });
      const tags = await offlineAdapter.getEventTags(familyId);
      return tags || [];
    }
  },

  /**
   * Create a new tag
   */
  createEventTag: async (
    familyId: string,
    input: EventTagInput,
    userId: string
  ): Promise<{ data?: EventTag; error?: any }> => {
    console.log('[eventAdapter] createEventTag called:', { familyId, userId, input });
    logger.debug('tag.create.start', { familyId, name: input.name });

    try {
      const isOfflineFamily = offlineAdapter.isOfflineId(familyId);
      
      console.log('[eventAdapter] Tag creation - Connection status:', { isOfflineFamily, familyId });

      // Offline families (with offlineId) always use offline storage
      if (isOfflineFamily) {
        console.log('[eventAdapter] Using offline path for offline family');
        logger.info('tag.create.offline-family', { familyId });

        const offlineId = offlineAdapter.generateOfflineId();
        const tag: EventTag = {
          id: offlineId,
          name: input.name,
          color: input.color || '#3B82F6',
          familyId,
          createdBy: userId,
        };

        await offlineAdapter.put('tag_definitions', tag);
        // Offline families NEVER sync - no sync.add here!

        logger.info('tag.create.offline.success', { tagId: offlineId });
        return { data: tag };
      }

      // Online families: try online first
      const response = await eventService.createEventTag(familyId, input, userId);

      if (response.error) {
        logger.warn('tag.create.online.failed', { error: response.error });

        const offlineId = offlineAdapter.generateOfflineId();
        const tag: EventTag = {
          id: offlineId,
          name: input.name,
          color: input.color || '#3B82F6',
          familyId,
          createdBy: userId,
        };

        await offlineAdapter.put('tag_definitions', tag);
        // Add to sync queue - this is an online family that failed to sync
        await offlineAdapter.sync.add({
          type: 'tag',
          action: 'insert',
          data: tag,
          familyId,
        });

        return { data: tag };
      }

      logger.info('tag.create.online.success', { tagId: response.data?.id });

      // Sync to offline
      await offlineAdapter.put('tag_definitions', response.data);

      return { data: response.data as EventTag };
    } catch (error) {
      logger.error('tag.create.exception', { error, familyId });

      const offlineId = offlineAdapter.generateOfflineId();
      const tag: EventTag = {
        id: offlineId,
        name: input.name,
        color: input.color || '#3B82F6',
        familyId,
        createdBy: userId,
      };

      await offlineAdapter.put('tag_definitions', tag);
      await offlineAdapter.sync.add({
        type: 'tag',
        action: 'insert',
        data: tag,
        familyId,
      });

      return { data: tag };
    }
  },

  /**
   * Update a tag
   */
  updateEventTag: async (
    tagId: string,
    input: Partial<EventTagInput>,
    familyId: string
  ): Promise<{ data?: EventTag; error?: any }> => {
    logger.debug('tag.update.start', { tagId });

    try {
      const tag = await offlineAdapter.getTagById(tagId);
      if (!tag) {
        return { error: 'Tag not found' };
      }

      const isOfflineFamily = offlineAdapter.isOfflineId(familyId);
      const isOffline = !navigator.onLine;

      if (isOfflineFamily || isOffline) {
        logger.info('tag.update.offline', { tagId });

        const updated = { ...tag, ...input };
        await offlineAdapter.put('tag_definitions', updated);
        
        // Only sync if it's an online family temporarily offline
        if (!isOfflineFamily && isOffline) {
          await offlineAdapter.sync.add({
            type: 'tag',
            action: 'update',
            data: updated,
            familyId,
          });
        }

        logger.info('tag.update.offline.success', { tagId });
        return { data: updated };
      }

      const response = await eventService.updateEventTag(tagId, input);

      if (response.error) {
        logger.warn('tag.update.online.failed', { error: response.error });

        const tag = await offlineAdapter.getTagById(tagId);
        if (!tag) {
          return { error: 'Tag not found' };
        }

        const updated = { ...tag, ...input };
        await offlineAdapter.put('tag_definitions', updated);
        await offlineAdapter.sync.add({
          type: 'tag',
          action: 'update',
          data: updated,
          familyId,
        });

        return { data: updated };
      }

      logger.info('tag.update.online.success', { tagId });

      await offlineAdapter.put('tag_definitions', response.data);

      return { data: response.data as EventTag };
    } catch (error) {
      logger.error('tag.update.exception', { error, tagId });

      const tag = await offlineAdapter.getTagById(tagId);
      if (!tag) {
        return { error: 'Tag not found' };
      }

      const updated = { ...tag, ...input };
      await offlineAdapter.put('tag_definitions', updated);
      await offlineAdapter.sync.add({
        type: 'tag',
        action: 'update',
        data: updated,
        familyId,
      });

      return { data: updated };
    }
  },

  /**
   * Delete a tag
   */
  deleteEventTag: async (tagId: string, familyId: string): Promise<{ error?: any }> => {
    logger.debug('tag.delete.start', { tagId });

    try {
      const isOfflineFamily = offlineAdapter.isOfflineId(familyId);
      const isOffline = !navigator.onLine;

      if (isOfflineFamily || isOffline) {
        logger.info('tag.delete.offline', { tagId });

        await offlineAdapter.deleteTag(tagId);
        
        // Only sync if it's an online family temporarily offline
        if (!isOfflineFamily && isOffline) {
          await offlineAdapter.sync.add({
            type: 'tag',
            action: 'delete',
            data: { id: tagId },
            familyId,
          });
        }

        logger.info('tag.delete.offline.success', { tagId });
        return {};
      }

      const response = await eventService.deleteEventTag(tagId);

      if (response.error) {
        logger.warn('tag.delete.online.failed', { error: response.error });

        await offlineAdapter.deleteTag(tagId);
        await offlineAdapter.sync.add({
          type: 'tag',
          action: 'delete',
          data: { id: tagId },
          familyId,
        });

        return {};
      }

      logger.info('tag.delete.online.success', { tagId });

      await offlineAdapter.deleteTag(tagId);

      return {};
    } catch (error) {
      logger.error('tag.delete.exception', { error, tagId });

      await offlineAdapter.deleteTag(tagId);
      await offlineAdapter.sync.add({
        type: 'tag',
        action: 'delete',
        data: { id: tagId },
        familyId,
      });

      return {};
    }
  },

  /**
   * Create a recurring event (store rule only, generate instances on demand)
   */
  createRecurringEvent: async (
    familyId: string,
    input: EventInput,
    userId: string
  ): Promise<{ data?: Event; error?: any }> => {
    if (!input.isRecurring || !input.recurrenceRule) {
      return { error: 'Not a recurring event' };
    }

    logger.debug('event.recurring.create.start', {
      familyId,
      title: input.title,
      frequency: input.recurrenceRule.frequency,
    });

    try {
      const isOfflineFamily = offlineAdapter.isOfflineId(familyId);
      const isOffline = !navigator.onLine;

      // Create the recurring event (parent) - store the rule, not instances
      const parentEventId = offlineAdapter.generateOfflineId();
      const parentEvent: Event = {
        id: parentEventId,
        title: input.title,
        description: input.description,
        date: input.date,
        time: input.time,
        duration: input.duration,
        isAllDay: input.isAllDay,
        familyId,
        createdBy: userId,
        tags: input.tags || [],
        isPending: !isOfflineFamily,
        isRecurring: true,
        recurrenceRule: input.recurrenceRule,
      };

      // Store only the parent event with the rule (no instances)
      await offlineAdapter.put('events', parentEvent);

      logger.info('event.recurring.create.success', {
        eventId: parentEventId,
        frequency: input.recurrenceRule.frequency,
      });

      // Only add to sync queue if online family temporarily offline
      if (!isOfflineFamily && isOffline) {
        await offlineAdapter.sync.add({
          type: 'event',
          action: 'insert',
          data: parentEvent,
          familyId,
        });
      }

      // If online, try to create in Supabase
      if (!isOfflineFamily && navigator.onLine) {
        const response = await eventService.createRecurringEvent(familyId, input, userId);

        if (response.error) {
          logger.warn('event.recurring.create.online.failed', { error: response.error });
        } else if (response.data) {
          // Sync successful response back to offline storage
          await offlineAdapter.put('events', response.data);
          logger.info('event.recurring.create.online.success', {
            eventId: response.data.id,
          });
        }
      }

      return { data: parentEvent };
    } catch (error) {
      logger.error('event.recurring.create.exception', { error, familyId });

      // Fallback to offline
      const parentEventId = offlineAdapter.generateOfflineId();
      const parentEvent: Event = {
        id: parentEventId,
        title: input.title,
        description: input.description,
        date: input.date,
        time: input.time,
        duration: input.duration,
        isAllDay: input.isAllDay,
        familyId,
        createdBy: userId,
        tags: input.tags || [],
        isPending: true,
        isRecurring: true,
        recurrenceRule: input.recurrenceRule,
      };

      await offlineAdapter.put('events', parentEvent);

      await offlineAdapter.sync.add({
        type: 'event',
        action: 'insert',
        data: parentEvent,
        familyId,
      });

      return { data: parentEvent };
    }
  },
};
