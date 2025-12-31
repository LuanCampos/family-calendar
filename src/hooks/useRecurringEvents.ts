import { useState, useCallback, useEffect } from 'react';
import { storageAdapter } from '@/lib/adapters/storageAdapter';
import { useFamily } from '@/contexts/FamilyContext';
import { useAuth } from '@/contexts/AuthContext';
import type { Event, EventInput, RecurrenceRule } from '@/types/calendar';
import { logger } from '@/lib/logger';

/**
 * useRecurringEvents - Manage recurring events for a family
 */

export const useRecurringEvents = () => {
  const { currentFamilyId } = useFamily();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Create a recurring event with instances
   */
  const createRecurringEvent = useCallback(
    async (input: EventInput) => {
      logger.debug('useRecurringEvents.create.called', {
        currentFamilyId,
        user: user?.id,
        input,
      });

      if (!currentFamilyId) {
        console.error('[useRecurringEvents] Missing currentFamilyId');
        setError('Family not loaded');
        return { error: 'Family not loaded' };
      }

      if (!input.isRecurring || !input.recurrenceRule) {
        setError('Not a recurring event');
        return { error: 'Not a recurring event' };
      }

      const userId = user?.id || 'offline-user';

      try {
        setLoading(true);
        setError(null);

        logger.debug('useRecurringEvents.storageAdapter.createRecurringEvent.start');
        const response = await storageAdapter.createRecurringEvent(
          currentFamilyId,
          input,
          userId
        );
        logger.debug('useRecurringEvents.storageAdapter.createRecurringEvent.result', { response });

        if (response.data) {
          logger.info('event.recurring.created', {
            parentId: response.data.id,
          });
        }

        if (response.error) {
          logger.error('event.recurring.create.error', { error: response.error });
          setError('Failed to create recurring event');
        }

        return response;
      } catch (err) {
        logger.error('event.recurring.create.exception', { error: err });
        setError('Failed to create recurring event');
        return { error: err };
      } finally {
        setLoading(false);
      }
    },
    [currentFamilyId, user]
  );

  /**
   * Delete a recurring event and all its instances
   */
  const deleteRecurringEvent = useCallback(
    async (parentEventId: string) => {
      if (!currentFamilyId) {
        setError('Family not loaded');
        return { error: 'Family not loaded' };
      }

      try {
        setLoading(true);
        setError(null);

        logger.debug('event.recurring.delete.start', { parentEventId });

        // Get all events to find instances
        const allEvents = await storageAdapter.getEvents(currentFamilyId);
        const instanceIds = allEvents
          .filter(e => e.recurringEventId === parentEventId)
          .map(e => e.id);

        // Delete parent event
        await storageAdapter.deleteEvent(parentEventId, currentFamilyId);

        // Delete instances
        for (const instanceId of instanceIds) {
          await storageAdapter.deleteEvent(instanceId, currentFamilyId);
        }

        logger.info('event.recurring.deleted', {
          parentEventId,
          instanceCount: instanceIds.length,
        });

        return { data: { parentEventId, instanceCount: instanceIds.length } };
      } catch (err) {
        logger.error('event.recurring.delete.exception', { error: err });
        setError('Failed to delete recurring event');
        return { error: err };
      } finally {
        setLoading(false);
      }
    },
    [currentFamilyId]
  );

  /**
   * Delete a single instance of a recurring event
   */
  const deleteRecurringInstance = useCallback(
    async (instanceId: string) => {
      if (!currentFamilyId) {
        setError('Family not loaded');
        return { error: 'Family not loaded' };
      }

      try {
        setLoading(true);
        setError(null);

        logger.debug('event.recurring.instance.delete.start', { instanceId });

        await storageAdapter.deleteEvent(instanceId, currentFamilyId);

        logger.info('event.recurring.instance.deleted', { instanceId });

        return { data: { instanceId } };
      } catch (err) {
        logger.error('event.recurring.instance.delete.exception', { error: err });
        setError('Failed to delete recurring instance');
        return { error: err };
      } finally {
        setLoading(false);
      }
    },
    [currentFamilyId]
  );

  return {
    loading,
    error,
    createRecurringEvent,
    deleteRecurringEvent,
    deleteRecurringInstance,
  };
};

export default useRecurringEvents;
