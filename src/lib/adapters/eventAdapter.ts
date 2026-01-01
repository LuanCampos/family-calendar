import { eventService } from '@/lib/services/eventService';
import * as userService from '@/lib/services/userService';
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
        const eventsInRange = await offlineAdapter.getEvents(familyId, startDate, endDate);
        const recurringParents = await offlineAdapter.getRecurringParents(familyId);

        // Deduplicate parents by id
        const parentMap = new Map<string, Event>();
        for (const p of recurringParents) parentMap.set(p.id, p);
        // If any parent is already in-range list, ensure single expansion
        for (const e of eventsInRange) {
          if (e.isRecurring && e.recurrenceRule) parentMap.set(e.id, e);
        }

        // Expand recurring parents for the requested range
        const expandedParents = expandRecurringEvents(Array.from(parentMap.values()), startDate, endDate);

        // Include non-recurring events in range
        const nonRecurring = (eventsInRange || []).filter(e => !e.isRecurring || !e.recurrenceRule);

        logger.debug('event.get.offline.expand.debug', {
          parentsCount: parentMap.size,
          expandedCount: expandedParents.length,
          nonRecurringCount: nonRecurring.length,
        });

        return [...nonRecurring, ...expandedParents];
      }

      // Online path
      const [response, parentsRes] = await Promise.all([
        eventService.getEvents(familyId, startDate, endDate),
        eventService.getRecurringParents(familyId),
      ]);

      if (response.error) {
        logger.warn('event.get.online.failed', { error: response.error });
        // Fallback to offline
        try {
          const eventsInRange = await offlineAdapter.getEvents(familyId, startDate, endDate);
          const recurringParents = await offlineAdapter.getRecurringParents(familyId);
          const parentMap = new Map<string, Event>();
          for (const p of recurringParents) parentMap.set(p.id, p);
          for (const e of eventsInRange) { if (e.isRecurring && e.recurrenceRule) parentMap.set(e.id, e); }
          const expandedParents = expandRecurringEvents(Array.from(parentMap.values()), startDate, endDate);
          const nonRecurring = (eventsInRange || []).filter(e => !e.isRecurring || !e.recurrenceRule);
          return [...nonRecurring, ...expandedParents];
        } catch (offlineError) {
          logger.warn('event.get.offlineFallback.failed', { error: offlineError, familyId });
          return [];
        }
      }

      logger.info('event.get.success', { count: response.data?.length || 0, parents: parentsRes.data?.length || 0 });

      // Sync to offline storage
      try {
        const toSync = [ ...(response.data as Event[] || []), ...(parentsRes.data as Event[] || []) ];
        if (toSync.length > 0) {
          await offlineAdapter.syncEvents(toSync);
        }
      } catch (syncError) {
        // IndexedDB can be unavailable (private mode, blocked, quota, etc.).
        // Do not fail the online read path just because offline sync failed.
        logger.warn('event.get.offlineSync.failed', { error: syncError, familyId });
      }

      const eventsInRange = (response.data as Event[]) || [];
      const recurringParents = (parentsRes.data as Event[]) || [];
      const parentMap = new Map<string, Event>();
      for (const p of recurringParents) parentMap.set(p.id, p);
      for (const e of eventsInRange) { if (e.isRecurring && e.recurrenceRule) parentMap.set(e.id, e); }
      const expandedParents = expandRecurringEvents(Array.from(parentMap.values()), startDate, endDate);
      const nonRecurring = eventsInRange.filter(e => !e.isRecurring || !e.recurrenceRule);
      logger.debug('event.get.online.expand.debug', {
        parentsCount: parentMap.size,
        expandedCount: expandedParents.length,
        nonRecurringCount: nonRecurring.length,
      });
      return [...nonRecurring, ...expandedParents];
    } catch (error) {
      logger.error('event.get.exception', { error, familyId });
      try {
        const eventsInRange = await offlineAdapter.getEvents(familyId, startDate, endDate);
        const recurringParents = await offlineAdapter.getRecurringParents(familyId);
        const parentMap = new Map<string, Event>();
        for (const p of recurringParents) parentMap.set(p.id, p);
        for (const e of eventsInRange) { if (e.isRecurring && e.recurrenceRule) parentMap.set(e.id, e); }
        const expandedParents = expandRecurringEvents(Array.from(parentMap.values()), startDate, endDate);
        const nonRecurring = (eventsInRange || []).filter(e => !e.isRecurring || !e.recurrenceRule);
        logger.debug('event.get.exception.expand.debug', {
          parentsCount: parentMap.size,
          expandedCount: expandedParents.length,
          nonRecurringCount: nonRecurring.length,
        });
        return [...nonRecurring, ...expandedParents];
      } catch (offlineError) {
        logger.error('event.get.offlineFallback.failed', { error: offlineError, familyId });
        return [];
      }
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
        try {
          await offlineAdapter.put('events', response.data);
        } catch (syncError) {
          logger.warn('event.getById.offlineSync.failed', { error: syncError, eventId });
        }
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
    logger.debug('event.create.called', { familyId, userId, input });
    logger.debug('event.create.start', { familyId, title: input.title });

    try {
      const isOfflineFamily = offlineAdapter.isOfflineId(familyId);
      const isOffline = !navigator.onLine;
      
      logger.debug('event.create.connection', { isOfflineFamily, isOffline, navigator_onLine: navigator.onLine });

      if (isOfflineFamily || isOffline) {
        logger.debug('event.create.path.offline');
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
      // CRITICAL: Validate session before write operation (prevents 403 RLS race conditions)
      try {
        await userService.ensureSessionReady();
      } catch (sessionError) {
        logger.warn('event.create.session.not.ready', { error: sessionError });
        // Fallback to offline with pending sync
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
      // Get event to check family type; fallback to online if not cached
      let event = await offlineAdapter.getEventById(eventId);

      // If not found, try to resolve parent for recurring instance IDs
      if (!event) {
        const maybeDate = eventId.slice(-10);
        const hasDatePattern = /\d{4}-\d{2}-\d{2}/.test(maybeDate);
        if (hasDatePattern) {
          const parentId = eventId.slice(0, eventId.length - 11);
          const parent = await offlineAdapter.getEventById(parentId);
          if (parent) {
            event = parent;
            logger.debug('event.update.recurringInstance.parentResolved', { instanceId: eventId, parentId });
          }
        }
      }

      // If still not found, fetch from online service when possible
      if (!event && navigator.onLine) {
        const online = await eventService.getEvent(eventId);
        if (online && online.data) {
          event = online.data as Event;
          // Cache to offline for consistency
          await offlineAdapter.put('events', event);
          logger.debug('event.update.onlineFetched.cached', { eventId });
        }
      }

      if (!event) {
        logger.warn('event.update.eventNotFound', { eventId });
        return { error: 'Event not found' };
      }

      const isOfflineFamily = offlineAdapter.isOfflineId(event.familyId);
      const isOffline = !navigator.onLine;

      if (isOfflineFamily || isOffline) {
        logger.info('event.update.offline', { eventId });

        const updated = { ...event, ...input };
        // If recurrence is being turned off, clear the stored rule.
        // Spreading partial input cannot remove existing properties.
        if (input.isRecurring === false) {
          delete (updated as any).recurrenceRule;
        }
        // If toggling to all-day, clear time and duration locally
        if (input.isAllDay === true) {
          delete (updated as any).time;
          delete (updated as any).duration;
          (updated as any).isAllDay = true;
        }
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
      // CRITICAL: Validate session before write operation
      try {
        await userService.ensureSessionReady();
      } catch (sessionError) {
        logger.warn('event.update.session.not.ready', { error: sessionError });
        // Fallback to offline with pending sync
        const updated = { ...event, ...input };
        if (input.isRecurring === false) {
          delete (updated as any).recurrenceRule;
        }
        if (input.isAllDay === true) {
          delete (updated as any).time;
          delete (updated as any).duration;
          (updated as any).isAllDay = true;
        }
        // Ensure familyId is preserved
        if (!updated.familyId) {
          updated.familyId = event.familyId;
        }
        await offlineAdapter.put('events', updated);
        await offlineAdapter.sync.add({
          type: 'event',
          action: 'update',
          data: updated,
          familyId: updated.familyId,
        });
        return { data: updated };
      }

      // Ensure we update the real UUID row in Supabase.
      // If eventId is a synthetic recurring instance id, target the parent UUID.
      let targetEventId = eventId;
      const maybeDateForTarget = eventId.slice(-10);
      const isSyntheticInstance = /\d{4}-\d{2}-\d{2}$/.test(maybeDateForTarget);
      if (isSyntheticInstance) {
        targetEventId = event.id; // resolved parent above
      }

      const response = await eventService.updateEvent(targetEventId, input);

      if (response.error) {
        logger.warn('event.update.online.failed', { error: response.error });

        // Fallback to offline
        let fallbackEvent = await offlineAdapter.getEventById(eventId);
        // Resolve parent if instance id
        if (!fallbackEvent) {
          const maybeDate = eventId.slice(-10);
          const hasDatePattern = /\d{4}-\d{2}-\d{2}/.test(maybeDate);
          if (hasDatePattern) {
            const parentId = eventId.slice(0, eventId.length - 11);
            fallbackEvent = await offlineAdapter.getEventById(parentId);
          }
        }
        if (!fallbackEvent) {
          return { error: 'Event not found' };
        }

        const updated = { ...fallbackEvent, ...input };
        if (input.isRecurring === false) {
          delete (updated as any).recurrenceRule;
        }
        if (input.isAllDay === true) {
          delete (updated as any).time;
          delete (updated as any).duration;
          (updated as any).isAllDay = true;
        }
        // Ensure familyId is preserved
        if (!updated.familyId) {
          updated.familyId = fallbackEvent.familyId;
        }
        await offlineAdapter.put('events', updated);
        await offlineAdapter.sync.add({
          type: 'event',
          action: 'update',
          data: updated,
          familyId: updated.familyId,
        });

        return { data: updated };
      }

      logger.info('event.update.online.success', { eventId });

      // Sync to offline
      await offlineAdapter.put('events', response.data);

      return { data: response.data as Event };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : '';
      logger.error('event.update.exception', { error: errorMsg, stack: errorStack, eventId, input });

      // Fallback to offline
      let finalEvent = await offlineAdapter.getEventById(eventId);
      if (!finalEvent) {
        const maybeDate = eventId.slice(-10);
        const hasDatePattern = /\d{4}-\d{2}-\d{2}/.test(maybeDate);
        if (hasDatePattern) {
          const parentId = eventId.slice(0, eventId.length - 11);
          finalEvent = await offlineAdapter.getEventById(parentId);
        }
      }
      if (!finalEvent) {
        return { error: 'Event not found' };
      }

      const updated = { ...finalEvent, ...input };
      if (input.isRecurring === false) {
        delete (updated as any).recurrenceRule;
      }
      if (input.isAllDay === true) {
        delete (updated as any).time;
        delete (updated as any).duration;
        (updated as any).isAllDay = true;
      }
      await offlineAdapter.put('events', updated);
      await offlineAdapter.sync.add({
        type: 'event',
        action: 'update',
        data: updated,
        familyId: finalEvent.familyId,
      });

      return { data: updated };
    }
  },

  /**
   * Delete an event (hard delete)
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
      // CRITICAL: Validate session before write operation
      try {
        await userService.ensureSessionReady();
      } catch (sessionError) {
        logger.warn('event.delete.session.not.ready', { error: sessionError });
        // Fallback to offline with pending sync
        await offlineAdapter.deleteEvent(eventId);
        await offlineAdapter.sync.add({
          type: 'event',
          action: 'delete',
          data: { id: eventId },
          familyId,
        });
        return {};
      }

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
      try {
        if (response.data && response.data.length > 0) {
          for (const tag of response.data) {
            await offlineAdapter.put('tag_definitions', tag);
          }
        }
      } catch (syncError) {
        logger.warn('tag.getAll.offlineSync.failed', { error: syncError, familyId });
      }

      return (response.data as EventTag[]) || [];
    } catch (error) {
      logger.error('tag.getAll.exception', { error, familyId });
      try {
        const tags = await offlineAdapter.getEventTags(familyId);
        return tags || [];
      } catch (offlineError) {
        logger.error('tag.getAll.offlineFallback.failed', { error: offlineError, familyId });
        return [];
      }
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
    logger.debug('tag.create.called', { familyId, userId, input });
    logger.debug('tag.create.start', { familyId, name: input.name });

    try {
      const isOfflineFamily = offlineAdapter.isOfflineId(familyId);
      
      logger.debug('tag.create.connection', { isOfflineFamily, familyId });

      // Offline families (with offlineId) always use offline storage
      if (isOfflineFamily) {
        logger.debug('tag.create.path.offline');
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
      // CRITICAL: Validate session before write operation
      try {
        await userService.ensureSessionReady();
      } catch (sessionError) {
        logger.warn('tag.create.session.not.ready', { error: sessionError });
        // Fallback to offline with pending sync
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

      // Online path
      // CRITICAL: Validate session before write operation
      try {
        await userService.ensureSessionReady();
      } catch (sessionError) {
        logger.warn('tag.update.session.not.ready', { error: sessionError });
        // Fallback to offline with pending sync
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

      // Online path
      // CRITICAL: Validate session before write operation
      try {
        await userService.ensureSessionReady();
      } catch (sessionError) {
        logger.warn('tag.delete.session.not.ready', { error: sessionError });
        // Fallback to offline with pending sync
        await offlineAdapter.deleteTag(tagId);
        await offlineAdapter.sync.add({
          type: 'tag',
          action: 'delete',
          data: { id: tagId },
          familyId,
        });
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
        recurrenceExceptions: [],
        recurrenceOverrides: {},
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
      // CRITICAL: Validate session before write operation
      if (!isOfflineFamily && navigator.onLine) {
        try {
          await userService.ensureSessionReady();
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
        } catch (sessionError) {
          logger.warn('event.recurring.create.session.not.ready', { error: sessionError });
          // Session not ready - keep offline version with pending flag for later sync
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
        recurrenceExceptions: [],
        recurrenceOverrides: {},
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
