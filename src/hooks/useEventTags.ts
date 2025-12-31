import { useState, useCallback, useEffect } from 'react';
import { storageAdapter } from '@/lib/adapters/storageAdapter';
import { useFamily } from '@/contexts/FamilyContext';
import { useAuth } from '@/contexts/AuthContext';
import type { EventTag, EventTagInput } from '@/types/calendar';
import { logger } from '@/lib/logger';

/**
 * useEventTags - Manage event tags for a family
 */

export const useEventTags = () => {
  const { currentFamilyId } = useFamily();
  const { user } = useAuth();
  const [tags, setTags] = useState<EventTag[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load tags
  const loadTags = useCallback(async () => {
    if (!currentFamilyId) return;

    setLoading(true);
    setError(null);

    try {
      const data = await storageAdapter.getEventTags(currentFamilyId);
      setTags(data);
      logger.info('tags.loaded', { count: data.length });
    } catch (err) {
      logger.error('tags.load.error', { error: err });
      setError('Failed to load tags');
    } finally {
      setLoading(false);
    }
  }, [currentFamilyId]);

  // Load tags on mount and when currentFamilyId changes
  useEffect(() => {
    loadTags();
  }, [loadTags]);

  // Create tag
  const createTag = useCallback(
    async (input: EventTagInput) => {
      logger.debug('useEventTags.create.called', { currentFamilyId, user: user?.id, input });
      
      if (!currentFamilyId) {
        logger.error('useEventTags.create.missingFamilyId', { currentFamilyId });
        setError('Family not loaded');
        return { error: 'Family not loaded' };
      }

      // For offline families, user can be undefined - use default userId
      const userId = user?.id || 'offline-user';

      try {
        logger.debug('useEventTags.storageAdapter.createEventTag.start');
        const response = await storageAdapter.createEventTag(
          currentFamilyId,
          input,
          userId
        );
        logger.debug('useEventTags.storageAdapter.createEventTag.result', { response });

        if (response.data) {
          setTags(prev => {
            const newTags = [...prev, response.data];
            return newTags;
          });
          logger.info('tag.created', { tagId: response.data.id });
        }

        if (response.error) {
          logger.error('tag.create.error', { error: response.error });
          setError('Failed to create tag');
        }

        return response;
      } catch (err) {
        logger.error('tag.create.exception', { error: err });
        setError('Failed to create tag');
        return { error: err };
      }
    },
    [currentFamilyId, user]
  );

  // Update tag
  const updateTag = useCallback(
    async (tagId: string, input: Partial<EventTagInput>) => {
      if (!currentFamilyId) {
        setError('Family not loaded');
        return { error: 'Family not loaded' };
      }

      try {
        const response = await storageAdapter.updateEventTag(
          tagId,
          input,
          currentFamilyId
        );

        if (response.data) {
          setTags(prev =>
            prev.map(t => (t.id === tagId ? response.data : t))
          );
          logger.info('tag.updated', { tagId });
        }

        if (response.error) {
          logger.error('tag.update.error', { error: response.error });
          setError('Failed to update tag');
        }

        return response;
      } catch (err) {
        logger.error('tag.update.exception', { error: err });
        setError('Failed to update tag');
        return { error: err };
      }
    },
    [currentFamilyId]
  );

  // Delete tag
  const deleteTag = useCallback(
    async (tagId: string) => {
      if (!currentFamilyId) {
        setError('Family not loaded');
        return { error: 'Family not loaded' };
      }

      try {
        const response = await storageAdapter.deleteEventTag(tagId, currentFamilyId);

        if (!response.error) {
          setTags(prev => prev.filter(t => t.id !== tagId));
          logger.info('tag.deleted', { tagId });
        } else {
          logger.error('tag.delete.error', { error: response.error });
          setError('Failed to delete tag');
        }

        return response;
      } catch (err) {
        logger.error('tag.delete.exception', { error: err });
        setError('Failed to delete tag');
        return { error: err };
      }
    },
    [currentFamilyId]
  );

  return {
    tags,
    loading,
    error,
    createTag,
    updateTag,
    deleteTag,
    reloadTags: loadTags,
  };
};
