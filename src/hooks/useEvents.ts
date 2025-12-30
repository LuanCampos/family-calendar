import { useState, useCallback, useEffect } from 'react';
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

  // Load events
  const loadEvents = useCallback(async () => {
    if (!currentFamilyId) return;

    setLoading(true);
    setError(null);

    try {
      const data = await storageAdapter.getEvents(currentFamilyId, startDate, endDate);
      setEvents(data);
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
      console.log('[useEvents] createEvent called:', { currentFamilyId, user: user?.id, input });
      
      if (!currentFamilyId) {
        console.error('[useEvents] Missing currentFamilyId:', { currentFamilyId });
        setError('Family not loaded');
        return { error: 'Family not loaded' };
      }

      // For offline families, user can be undefined - use default userId
      const userId = user?.id || 'offline-user';

      try {
        // Check if this is a recurring event
        if (input.isRecurring && input.recurrenceRule) {
          console.log('[useEvents] Calling storageAdapter.createRecurringEvent...');
          const response = await storageAdapter.createRecurringEvent(currentFamilyId, input, userId);

          console.log('[useEvents] createRecurringEvent response:', response);

          if (response.data) {
            // For recurring events, we store only the parent
            // Instances will be generated on demand when fetching events
            setEvents(prev => [...prev, response.data]);
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
          console.log('[useEvents] Calling storageAdapter.createEvent...');
          const response = await storageAdapter.createEvent(currentFamilyId, input, userId);

          console.log('[useEvents] createEvent response:', response);

          if (response.data) {
            setEvents(prev => [...prev, response.data]);
            logger.info('event.created', { eventId: response.data.id });
          }

          if (response.error) {
            logger.error('event.create.error', { error: response.error });
            setError('Failed to create event');
          }

          return response;
        }
      } catch (err) {
        console.error('[useEvents] createEvent exception:', err);
        logger.error('event.create.exception', { error: err });
        setError('Failed to create event');
        return { error: err };
      }
    },
    [currentFamilyId, user]
  );

  // Update event
  const updateEvent = useCallback(
    async (eventId: string, input: Partial<EventInput>) => {
      try {
        const response = await storageAdapter.updateEvent(eventId, input);

        if (response.data) {
          setEvents(prev =>
            prev.map(e => (e.id === eventId ? response.data : e))
          );
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
    []
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
          setEvents(prev => prev.filter(e => e.id !== eventId));
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
