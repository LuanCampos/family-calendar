import { supabase } from '@/lib/supabase';
import * as userService from '@/lib/services/userService';
import type { EventInput, EventTagInput, Event } from '@/types/calendar';
import type { EventRow, SupabaseChannel } from '@/types/database';
import { mapEventRow, mapEventRows } from '@/lib/mappers';

/**
 * Event Service - Direct Supabase API calls
 * 
 * IMPORTANT: Write operations (create, update, delete) must validate that
 * the auth session is ready and has a valid access token.
 * This prevents 403 RLS race condition errors during initial auth.
 * 
 * No branching logic, pure data operations.
 */

export const eventService = {
  /**
   * Get all events for a family within a date range
   */
  getEvents: async (familyId: string, startDate?: string, endDate?: string) => {
    // Debug API call
    const endpoint = `event${startDate || endDate ? '' : ''}`;
    const params: Record<string, any> = { familyId };
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    // Log the intent before performing the query
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (await import('@/lib/logger')).logger.apiCall('GET', endpoint, params);
    // First get all events for the family in the date range
    let query = supabase
      .from('event')
      .select('*')
      .eq('family_id', familyId);

    if (startDate) {
      query = query.gte('date', startDate);
    }
    if (endDate) {
      query = query.lte('date', endDate);
    }

    const eventsResult = await query.order('date', { ascending: true });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (await import('@/lib/logger')).logger.apiResponse('GET', endpoint, eventsResult.error ? 400 : 200, { count: eventsResult.data?.length || 0 });
    
    if (eventsResult.error || !eventsResult.data) {
      return eventsResult;
    }

    // Get all tags for these events
    const eventIds = eventsResult.data.map(e => e.id);
    if (eventIds.length === 0) {
      return { data: eventsResult.data, error: null };
    }

    const tagsResult = await supabase
      .from('event_tag')
      .select('event_id, tag_id')
      .in('event_id', eventIds);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (await import('@/lib/logger')).logger.apiResponse('GET', 'event_tag', tagsResult.error ? 400 : 200, { count: tagsResult.data?.length || 0 });

    if (tagsResult.error) {
      // Return events even if tags fail
      return eventsResult;
    }

    // Map tags to events
    const tagsByEventId = new Map<string, string[]>();
    tagsResult.data?.forEach(et => {
      if (!tagsByEventId.has(et.event_id)) {
        tagsByEventId.set(et.event_id, []);
      }
      tagsByEventId.get(et.event_id)!.push(et.tag_id);
    });

    // Map DB rows to application types with tags
    const mapped = mapEventRows(eventsResult.data as EventRow[], tagsByEventId);
    return { data: mapped, error: null };
  },

  /**
   * Get all recurring parent events for a family (no date filter)
   */
  getRecurringParents: async (familyId: string) => {
    // Debug API call
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (await import('@/lib/logger')).logger.apiCall('GET', 'event (recurring parents)', { familyId });
    const res = await supabase
      .from('event')
      .select('*')
      .eq('family_id', familyId)
      .eq('is_recurring', true)
      .order('date', { ascending: true });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (await import('@/lib/logger')).logger.apiResponse('GET', 'event (recurring parents)', res.error ? 400 : 200, { count: res.data?.length || 0 });

    if (res.error || !res.data) {
      return res;
    }

    // Fetch tags for these parent events so instances can inherit them
    const parentIds = (res.data as EventRow[]).map(e => e.id);
    let tagsByEventId: Map<string, string[]> | undefined = undefined;
    if (parentIds.length > 0) {
      const tagsRes = await supabase
        .from('event_tag')
        .select('event_id, tag_id')
        .in('event_id', parentIds);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (await import('@/lib/logger')).logger.apiResponse('GET', 'event_tag (parents)', tagsRes.error ? 400 : 200, { count: tagsRes.data?.length || 0 });

      if (!tagsRes.error && tagsRes.data) {
        tagsByEventId = new Map<string, string[]>();
        tagsRes.data.forEach(et => {
          if (!tagsByEventId!.has(et.event_id)) {
            tagsByEventId!.set(et.event_id, []);
          }
          tagsByEventId!.get(et.event_id)!.push(et.tag_id);
        });
      }
    }

    const mapped = mapEventRows(res.data as EventRow[], tagsByEventId);
    return { data: mapped, error: null };
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

    const tags = tagsRes.data?.map(t => t.tag_id) || [];
    const mapped = mapEventRow(eventRes.data as EventRow, tags);
    return { data: mapped, error: null };
  },

  /**
   * Create a new event
   * 
   * Note: Auth session MUST be validated by the caller or eventAdapter.
   * This protects against 403 RLS race condition on initial auth.
   */
  createEvent: async (familyId: string, input: EventInput, userId: string) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (await import('@/lib/logger')).logger.apiCall('POST', 'event', { familyId, isRecurring: input.isRecurring, hasRule: !!input.recurrenceRule });
    // Ensure session is ready before INSERT to prevent 403 RLS errors
    await userService.ensureSessionReady();
    
    const { tags, duration, isAllDay, isRecurring, recurrenceRule, ...eventData } = input;

    const payload: Partial<EventRow> & Record<string, any> = {
      family_id: familyId,
      created_by: userId,
      title: eventData.title,
      description: eventData.description ?? null,
      date: eventData.date,
      time: eventData.time ?? null,
      duration_minutes: duration ?? null,
      is_all_day: isAllDay ?? false,
      is_recurring: isRecurring ?? false,
      recurrence_rule: recurrenceRule ?? null,
    };

    const response = await supabase
      .from('event')
      .insert(payload)
      .select()
      .single();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (await import('@/lib/logger')).logger.apiResponse('POST', 'event', response.error ? 400 : 200, { id: response.data?.id });

    if (response.error) {
      console.error('[eventService] Event creation error:', {
        code: (response.error as any).code,
        message: response.error.message,
        details: (response.error as any).details,
        hint: (response.error as any).hint,
      });
      return response;
    }

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
        console.error('[eventService] Tag insertion error:', tagRes.error);
        // Rollback event creation if tag insertion fails
        await supabase.from('event').delete().eq('id', response.data.id);
        return tagRes;
      }
    }

    // Map DB row to application type
    const mapped = mapEventRow(response.data as EventRow, tags || []);
    return { data: mapped, error: null };
  },

  /**
   * Update an event
   */
  updateEvent: async (eventId: string, input: Partial<EventInput>) => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (await import('@/lib/logger')).logger.apiCall('PATCH', 'event', { eventId, touchesRecurrence: input.isRecurring !== undefined || input.recurrenceRule !== undefined });
      // Ensure session is ready before UPDATE to prevent 403 RLS errors
      await userService.ensureSessionReady();
      
      const { tags, ...eventData } = input;

      // Filter out undefined values and map field names
      const updatePayload: any = {};
      Object.entries(eventData).forEach(([key, value]) => {
        if (value !== undefined) {
          // Map camelCase to snake_case
          if (key === 'duration') {
            updatePayload.duration_minutes = value;
          } else if (key === 'isAllDay') {
            updatePayload.is_all_day = value;
          } else if (key === 'isRecurring') {
            updatePayload.is_recurring = value;
          } else if (key === 'recurrenceRule') {
            updatePayload.recurrence_rule = value;
          } else {
            updatePayload[key] = value;
          }
        }
      });

      // If toggling to all-day, explicitly clear time and duration
      if (input.isAllDay === true) {
        updatePayload.time = null;
        updatePayload.duration_minutes = null;
      }

      // Update event fields
      const response = await supabase
        .from('event')
        .update(updatePayload)
        .eq('id', eventId)
        .select()
        .single();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (await import('@/lib/logger')).logger.apiResponse('PATCH', 'event', response.error ? 400 : 200, { id: response.data?.id });

      if (response.error) return response;

      // Update tags if provided
      if (tags !== undefined) {
        
        // Delete existing tags
        const delRes = await supabase.from('event_tag').delete().eq('event_id', eventId);

        // Insert new tags
        if (tags.length > 0) {
          const tagInserts = tags.map(tagId => ({
            event_id: eventId,
            tag_id: tagId,
          }));
          
          const tagRes = await supabase
            .from('event_tag')
            .insert(tagInserts);

          if (tagRes.error) {
            console.error('[eventService] Tag update error:', tagRes.error);
            return tagRes;
          }
        }
      }

      // Map response row to application type
      const mapped = mapEventRow(response.data as EventRow, tags !== undefined ? tags : undefined as any);
      return { data: mapped, error: null };
    } catch (error) {
      console.error('[eventService] updateEvent error:', { error, eventId });
      return { error };
    }
  },

  /**
   * Delete an event (hard delete)
   */
  deleteEvent: async (eventId: string) => {
    // Ensure session is ready before DELETE to prevent 403 RLS errors
    await userService.ensureSessionReady();
    
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
   * 
   * Note: Auth session MUST be validated by the caller or eventAdapter.
   * This protects against 403 RLS race condition on initial auth.
   */
  createEventTag: async (familyId: string, input: EventTagInput, userId: string) => {
    // Ensure session is ready before INSERT to prevent 403 RLS errors
    await userService.ensureSessionReady();
    
    const payload = {
      family_id: familyId,
      created_by: userId,
      name: input.name,
      color: input.color || '#3B82F6',
    } as any;
    
    const result = await supabase
      .from('tag_definition')
      .insert(payload)
      .select()
      .single();
    
    if (result.error) {
      console.error('[eventService] Tag creation error:', {
        code: (result.error as any).code,
        message: result.error.message,
        details: (result.error as any).details,
        hint: (result.error as any).hint,
      });
    }
    
    return result;
  },

  /**
   * Update a tag definition
   */
  updateEventTag: async (tagId: string, input: Partial<EventTagInput>) => {
    // Ensure session is ready before UPDATE to prevent 403 RLS errors
    await userService.ensureSessionReady();
    
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
    // Ensure session is ready before DELETE to prevent 403 RLS errors
    await userService.ensureSessionReady();
    
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (await import('@/lib/logger')).logger.apiCall('POST', 'event (recurring)', { familyId, rule: input.recurrenceRule });
      const { tags, duration, isAllDay } = input;

      const response = await supabase
        .from('event')
        .insert({
          family_id: familyId,
          title: input.title,
          description: input.description ?? null,
          date: input.date,
          time: input.time ?? null,
          duration_minutes: duration ?? null,
          is_all_day: isAllDay ?? false,
          is_recurring: true,
          recurrence_rule: input.recurrenceRule,
          created_by: userId,
        } as any)
        .select()
        .single();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (await import('@/lib/logger')).logger.apiResponse('POST', 'event (recurring)', response.error ? 400 : 200, { id: response.data?.id });

      if (response.error) return response;

      const parentEvent = mapEventRow(response.data as EventRow, tags || []);

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
