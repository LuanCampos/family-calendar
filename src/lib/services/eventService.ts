import { supabase } from '@/lib/supabase';
import type { EventInput, EventTagInput } from '@/types/calendar';
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
      .from('events')
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
        .from('events')
        .select('*')
        .eq('id', eventId)
        .single(),
      supabase
        .from('event_tags')
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
      .from('events')
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
        .from('event_tags')
        .insert(tagInserts);

      if (tagRes.error) {
        // Rollback event creation if tag insertion fails
        await supabase.from('events').delete().eq('id', response.data.id);
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
      .from('events')
      .update(eventData)
      .eq('id', eventId)
      .select()
      .single();

    if (response.error) return response;

    // Update tags if provided
    if (tags !== undefined) {
      // Delete existing tags
      await supabase.from('event_tags').delete().eq('event_id', eventId);

      // Insert new tags
      if (tags.length > 0) {
        const tagInserts = tags.map(tagId => ({
          event_id: eventId,
          tag_id: tagId,
        }));

        const tagRes = await supabase
          .from('event_tags')
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
      .from('events')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', eventId);
  },

  /**
   * Permanently delete an event
   */
  permanentlyDeleteEvent: async (eventId: string) => {
    // First delete all tags
    await supabase.from('event_tags').delete().eq('event_id', eventId);

    // Then delete the event
    return supabase.from('events').delete().eq('id', eventId);
  },

  // --- Tag Definitions ---

  /**
   * Get all tag definitions for a family
   */
  getEventTags: async (familyId: string) => {
    return supabase
      .from('tag_definitions')
      .select('*')
      .eq('family_id', familyId)
      .order('name', { ascending: true });
  },

  /**
   * Create a new tag definition
   */
  createEventTag: async (familyId: string, input: EventTagInput, userId: string) => {
    return supabase
      .from('tag_definitions')
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
      .from('tag_definitions')
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
    await supabase.from('event_tags').delete().eq('tag_id', tagId);

    // Then delete the tag definition
    return supabase.from('tag_definitions').delete().eq('id', tagId);
  },

  // --- Realtime Subscriptions ---

  /**
   * Subscribe to events changes for a family
   */
  subscribeToEvents: (familyId: string, callback: (event: SupabaseChannel) => void) => {
    return supabase
      .channel(`events:${familyId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'events',
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
      .channel(`tags:${familyId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tag_definitions',
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
};
