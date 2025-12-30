import { supabase } from '@/lib/supabase';
import { generateRecurringInstances } from '@/lib/utils/recurrenceUtils';
import type { EventInput, EventTagInput, Event } from '@/types/calendar';
import type { EventRow, TagDefinitionRow, SupabaseChannel } from '@/types/database';

/**
 * Event Service - Direct Supabase API calls
 * No branching logic, pure data operations
 */

export const eventService = {
  /**
   * Get all events for a family within a date range
   */
  getEvents: async (familyId: string, startDate?: string, endDate?: string) => {
    let query = supabase
      .from('event')
      .select('*')
      .eq('family_id', familyId)
      .is('deleted_at', null);

    if (startDate) {
      query = query.gte('date', startDate);
    }
    if (endDate) {
      query = query.lte('date', endDate);
    }

    return query.order('date', { ascending: true });
  },

  /**
   * Get a single event with its tags
   */
  getEvent: async (eventId: string) => {
    const [eventRes, tagsRes] = await Promise.all([
      supabase
        .from('event')
        .select('*')
        .eq('id', eventId)
        .single(),
      supabase
        .from('event_tag')
        .select('tag_id')
        .eq('event_id', eventId),
    ]);

    if (eventRes.error) return { data: null, error: eventRes.error };

    return {
      data: {
        ...eventRes.data,
        tags: tagsRes.data?.map(t => t.tag_id) || [],
      },
      error: null,
    };
  },

  /**
   * Create a new event
   */
  createEvent: async (familyId: string, input: EventInput, userId: string) => {
    const { tags, ...eventData } = input;

    const response = await supabase
      .from('event')
      .insert({
        family_id: familyId,
        created_by: userId,
        ...eventData,
      } as EventRow)
      .select()
      .single();

    if (response.error) return response;

    // Add tags if provided
    if (tags && tags.length > 0) {
      const tagInserts = tags.map(tagId => ({
        event_id: response.data.id,
        tag_id: tagId,
      }));

      const tagRes = await supabase
        .from('event_tag')
        .insert(tagInserts);

      if (tagRes.error) {
        // Rollback event creation if tag insertion fails
        await supabase.from('event').delete().eq('id', response.data.id);
        return tagRes;
      }
    }

    return response;
  },

  /**
   * Update an event
   */
  updateEvent: async (eventId: string, input: Partial<EventInput>) => {
    const { tags, ...eventData } = input;

    // Update event fields
    const response = await supabase
      .from('event')
      .update(eventData)
      .eq('id', eventId)
      .select()
      .single();

    if (response.error) return response;

    // Update tags if provided
    if (tags !== undefined) {
      // Delete existing tags
      await supabase.from('event_tag').delete().eq('event_id', eventId);

      // Insert new tags
      if (tags.length > 0) {
        const tagInserts = tags.map(tagId => ({
          event_id: eventId,
          tag_id: tagId,
        }));

        const tagRes = await supabase
          .from('event_tag')
          .insert(tagInserts);

        if (tagRes.error) return tagRes;
      }
    }

    return response;
  },

  /**
   * Delete an event (soft delete)
   */
  deleteEvent: async (eventId: string) => {
    return supabase
      .from('event')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', eventId);
  },

  /**
   * Permanently delete an event
   */
  permanentlyDeleteEvent: async (eventId: string) => {
    // First delete all tags
    await supabase.from('event_tag').delete().eq('event_id', eventId);

    // Then delete the event
    return supabase.from('event').delete().eq('id', eventId);
  },

  // --- Tag Definitions ---

  /**
   * Get all tag definitions for a family
   */
  getEventTags: async (familyId: string) => {
    return supabase
      .from('tag_definition')
      .select('*')
      .eq('family_id', familyId)
      .order('name', { ascending: true });
  },

  /**
   * Create a new tag definition
   */
  createEventTag: async (familyId: string, input: EventTagInput, userId: string) => {
    return supabase
      .from('tag_definition')
      .insert({
        family_id: familyId,
        created_by: userId,
        name: input.name,
        color: input.color || '#3B82F6',
      } as TagDefinitionRow)
      .select()
      .single();
  },

  /**
   * Update a tag definition
   */
  updateEventTag: async (tagId: string, input: Partial<EventTagInput>) => {
    return supabase
      .from('tag_definition')
      .update(input)
      .eq('id', tagId)
      .select()
      .single();
  },

  /**
   * Delete a tag definition
   */
  deleteEventTag: async (tagId: string) => {
    // First delete all event_tag associations
    await supabase.from('event_tag').delete().eq('tag_id', tagId);

    // Then delete the tag definition
    return supabase.from('tag_definition').delete().eq('id', tagId);
  },

  // --- Realtime Subscriptions ---

  /**
   * Subscribe to events changes for a family
   */
  subscribeToEvents: (familyId: string, callback: (event: SupabaseChannel) => void) => {
    return supabase
      .channel(`event:${familyId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'event',
          filter: `family_id=eq.${familyId}`,
        },
        callback
      )
      .subscribe();
  },

  /**
   * Subscribe to tags changes for a family
   */
  subscribeToTags: (familyId: string, callback: (event: SupabaseChannel) => void) => {
    return supabase
      .channel(`tag_definition:${familyId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tag_definition',
          filter: `family_id=eq.${familyId}`,
        },
        callback
      )
      .subscribe();
  },

  /**
   * Unsubscribe from a channel
   */
  unsubscribe: async (channel: SupabaseChannel) => {
    await supabase.removeChannel(channel);
  },

  /**
   * Create a recurring event (store rule only)
   */
  createRecurringEvent: async (familyId: string, input: EventInput, userId: string) => {
    if (!input.isRecurring || !input.recurrenceRule) {
      return { data: null, error: 'Not a recurring event' };
    }

    try {
      const { tags, ...eventData } = input;

      // Create parent event with the recurrence rule
      const response = await supabase
        .from('event')
        .insert({
          family_id: familyId,
          created_by: userId,
          ...eventData,
        } as EventRow)
        .select()
        .single();

      if (response.error) return response;

      const parentEvent: Event = {
        id: response.data.id,
        title: response.data.title,
        description: response.data.description,
        date: response.data.date,
        time: response.data.time,
        duration: response.data.duration_minutes,
        isAllDay: false,
        familyId,
        createdBy: userId,
        tags: [],
        isRecurring: true,
        recurrenceRule: input.recurrenceRule,
      };

      // Add tags if provided
      if (tags && tags.length > 0) {
        const tagInserts = tags.map(tagId => ({
          event_id: response.data.id,
          tag_id: tagId,
        }));

        const tagRes = await supabase
          .from('event_tag')
          .insert(tagInserts);

        if (tagRes.error) {
          // Don't rollback - event was created, just tag insertion failed
          return { data: parentEvent, error: null };
        }
      }

      return { data: parentEvent, error: null };
    } catch (error) {
      return { data: null, error };
    }
  },
};
