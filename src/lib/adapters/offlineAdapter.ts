import { offlineDB, syncQueue, generateOfflineId, isOfflineId } from '../storage/offlineStorage';
import type { Event, EventTag } from '@/types/calendar';
import type { SyncQueueItem } from '../storage/offlineStorage';

// Adapter layer to abstract the offline storage implementation. Use this when
// interacting with local persistence or the sync queue so the rest of the code
// can be mocked or swapped later.

export const offlineAdapter = {
  getAll: <T,>(storeName: string) => offlineDB.getAll<T>(storeName),
  getAllByIndex: <T,>(storeName: string, indexName: string, value: string) => 
    offlineDB.getAllByIndex<T>(storeName, indexName, value),
  get: <T,>(storeName: string, id: string) => offlineDB.get<T>(storeName, id),
  put: <T,>(storeName: string, data: T) => offlineDB.put<T>(storeName, data),
  delete: (storeName: string, id: string) => offlineDB.delete(storeName, id),
  clear: (storeName: string) => offlineDB.clear(storeName),
  
  sync: {
    add: (item: Omit<SyncQueueItem, 'id' | 'createdAt'>) => syncQueue.add(item),
    getAll: () => syncQueue.getAll(),
    getByFamily: (familyId: string) => syncQueue.getByFamily(familyId),
    remove: (id: string) => syncQueue.remove(id),
    clear: () => syncQueue.clear(),
  },
  
  generateOfflineId,
  isOfflineId,

  // ===== Event-specific methods =====
  
  getEvents: async (familyId: string, startDate?: string, endDate?: string): Promise<Event[]> => {
    const all = await offlineDB.getAllByIndex<Event>('events', 'family_id', familyId);
    
    if (!all) return [];
    
    return all.filter(event => {
      if (startDate && event.date < startDate) return false;
      if (endDate && event.date > endDate) return false;
      return true;
    }).sort((a, b) => a.date.localeCompare(b.date));
  },

  getEventById: async (eventId: string): Promise<Event | null> => {
    return offlineDB.get<Event>('events', eventId) || null;
  },

  getRecurringParents: async (familyId: string): Promise<Event[]> => {
    const all = await offlineDB.getAllByIndex<Event>('events', 'family_id', familyId);
    if (!all) return [];
    return all.filter(e => e.isRecurring && e.recurrenceRule);
  },

  getEventTags: async (familyId: string): Promise<EventTag[]> => {
    const tags = await offlineDB.getAllByIndex<EventTag>('tag_definitions', 'family_id', familyId);
    return tags ? tags.sort((a, b) => a.name.localeCompare(b.name)) : [];
  },

  getTagById: async (tagId: string): Promise<EventTag | null> => {
    return offlineDB.get<EventTag>('tag_definitions', tagId) || null;
  },

  deleteEvent: async (eventId: string): Promise<void> => {
    // Delete event tags first
    const tagAssocs = await offlineDB.getAll<any>('event_tags');
    if (tagAssocs) {
      for (const assoc of tagAssocs) {
        if (assoc.event_id === eventId) {
          await offlineDB.delete('event_tags', `${eventId}_${assoc.tag_id}`);
        }
      }
    }
    // Delete event
    await offlineDB.delete('events', eventId);
  },

  deleteTag: async (tagId: string): Promise<void> => {
    // Delete event_tag associations first
    const tagAssocs = await offlineDB.getAll<any>('event_tags');
    if (tagAssocs) {
      for (const assoc of tagAssocs) {
        if (assoc.tag_id === tagId) {
          await offlineDB.delete('event_tags', `${assoc.event_id}_${tagId}`);
        }
      }
    }
    // Delete tag
    await offlineDB.delete('tag_definitions', tagId);
  },

  syncEvents: async (events: Event[]): Promise<void> => {
    for (const event of events) {
      await offlineDB.put<Event>('events', event);
    }
  },
};

export type OfflineAdapter = typeof offlineAdapter;
