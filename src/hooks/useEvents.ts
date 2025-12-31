import { useState, useCallback, useEffect, useRef } from 'react';
import { storageAdapter } from '@/lib/adapters/storageAdapter';
import { useFamily } from '@/contexts/FamilyContext';
import { useAuth } from '@/contexts/AuthContext';
import type { Event, EventInput } from '@/types/calendar';
import { logger } from '@/lib/logger';

/**
 * useEvents - Manage events for a family
 */

export const useEvents = (startDate?: string, endDate?: string) => {
  const { currentFamilyId } = useFamily();
  const { user } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const cacheRef = useRef<Map<string, Event[]>>(new Map());

  // Load events
  const loadEvents = useCallback(async () => {
    if (!currentFamilyId) return;

    setLoading(true);
    setError(null);

    try {
      const key = `${currentFamilyId}:${startDate || ''}:${endDate || ''}`;
      if (cacheRef.current.has(key)) {
        const cached = cacheRef.current.get(key)!;
        setEvents(cached);
        logger.debug('events.cache.hit', { key, count: cached.length });
      } else {
        logger.debug('events.cache.miss', { key });
      }

      const data = await storageAdapter.getEvents(currentFamilyId, startDate, endDate);
      setEvents(data);
      cacheRef.current.set(key, data);
      logger.info('events.loaded', { count: data.length });
    } catch (err) {
      logger.error('events.load.error', { error: err });
      setError('Failed to load events');
    } finally {
      setLoading(false);
    }
  }, [currentFamilyId, startDate, endDate]);

  // Load events on mount and when dependencies change
  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  // Create event
  const createEvent = useCallback(
    async (input: EventInput) => {
      logger.debug('useEvents.create.called', { currentFamilyId, user: user?.id, input });
      
      if (!currentFamilyId) {
        logger.error('useEvents.create.missingFamilyId', { currentFamilyId });
        setError('Family not loaded');
        return { error: 'Family not loaded' };
      }

      // For offline families, user can be undefined - use default userId
      const userId = user?.id || 'offline-user';

      try {
        // Check if this is a recurring event
        if (input.isRecurring && input.recurrenceRule) {
          logger.debug('useEvents.storageAdapter.createRecurringEvent.start');
          const response = await storageAdapter.createRecurringEvent(currentFamilyId, input, userId);
          logger.debug('useEvents.storageAdapter.createRecurringEvent.result', { response });

          if (response.data) {
            // Recurring events: refresh list to include generated instances
            await loadEvents();
            logger.info('event.recurring.created', { 
              parentId: response.data.id
            });
          }

          if (response.error) {
            logger.error('event.recurring.create.error', { error: response.error });
            setError('Failed to create recurring event');
          }

          return response;
        } else {
          logger.debug('useEvents.storageAdapter.createEvent.start');
          const response = await storageAdapter.createEvent(currentFamilyId, input, userId);
          logger.debug('useEvents.storageAdapter.createEvent.result', { response });

          if (response.data) {
            setEvents(prev => {
              const next = [...prev, response.data!];
              const key = `${currentFamilyId}:${startDate || ''}:${endDate || ''}`;
              cacheRef.current.set(key, next);
              return next;
            });
            logger.info('event.created', { eventId: response.data.id });
          }

          if (response.error) {
            logger.error('event.create.error', { error: response.error });
            setError('Failed to create event');
          }

          return response;
        }
      } catch (err) {
        logger.error('event.create.exception', { error: err });
        setError('Failed to create event');
        return { error: err };
      }
    },
    [currentFamilyId, user, loadEvents]
  );

  // Update event
  const updateEvent = useCallback(
    async (eventId: string, input: Partial<EventInput>) => {
      try {
        const response = await storageAdapter.updateEvent(eventId, input);

        if (response.data) {
          const touchesRecurrence = input.isRecurring !== undefined || input.recurrenceRule !== undefined;
          if (touchesRecurrence) {
            // If recurrence toggled/changed, reload to expand instances
            await loadEvents();
          } else {
            setEvents(prev => {
              const next = prev.map(e => (e.id === eventId ? response.data! : e));
              const key = `${currentFamilyId || ''}:${startDate || ''}:${endDate || ''}`;
              if (currentFamilyId) cacheRef.current.set(key, next);
              return next;
            });
          }
          logger.info('event.updated', { eventId });
        }

        if (response.error) {
          logger.error('event.update.error', { error: response.error });
          setError('Failed to update event');
        }

        return response;
      } catch (err) {
        logger.error('event.update.exception', { error: err });
        setError('Failed to update event');
        return { error: err };
      }
    },
    [loadEvents, currentFamilyId, startDate, endDate]
  );

  // Delete event
  const deleteEvent = useCallback(
    async (eventId: string) => {
      if (!currentFamilyId) {
        setError('Family not loaded');
        return { error: 'Family not loaded' };
      }

      try {
        const response = await storageAdapter.deleteEvent(eventId, currentFamilyId);

        if (!response.error) {
          setEvents(prev => {
            const next = prev.filter(e => e.id !== eventId);
            const key = `${currentFamilyId}:${startDate || ''}:${endDate || ''}`;
            cacheRef.current.set(key, next);
            return next;
          });
          logger.info('event.deleted', { eventId });
        } else {
          logger.error('event.delete.error', { error: response.error });
          setError('Failed to delete event');
        }

        return response;
      } catch (err) {
        logger.error('event.delete.exception', { error: err });
        setError('Failed to delete event');
        return { error: err };
      }
    },
    [currentFamilyId]
  );

  return {
    events,
    loading,
    error,
    createEvent,
    updateEvent,
    deleteEvent,
    reloadEvents: loadEvents,
  };
};
