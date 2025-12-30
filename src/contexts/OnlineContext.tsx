import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { offlineAdapter } from '@/lib/adapters/offlineAdapter';
import * as familyService from '@/lib/services/familyService';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface SyncProgress {
  step: string;
  current: number;
  total: number;
  details?: string;
}

interface OnlineContextType {
  isOnline: boolean;
  isSyncing: boolean;
  syncProgress: SyncProgress | null;
  pendingSyncCount: number;
  syncNow: () => Promise<void>;
  syncFamily: (familyId: string) => Promise<{ newFamilyId?: string; error?: Error }>;
}

const OnlineContext = createContext<OnlineContextType | undefined>(undefined);

export const useOnline = () => {
  const context = useContext(OnlineContext);
  if (!context) {
    throw new Error('useOnline must be used within an OnlineProvider');
  }
  return context;
};

export const OnlineProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { session } = useAuth();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState<SyncProgress | null>(null);
  const [pendingSyncCount, setPendingSyncCount] = useState(0);

  // Monitor online status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast.success('Conexão restaurada');
    };
    const handleOffline = () => {
      setIsOnline(false);
      toast.warning('Você está offline. Alterações serão salvas localmente.');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Count pending sync items
  const updatePendingCount = useCallback(async () => {
    const items = await offlineAdapter.sync.getAll();
    setPendingSyncCount(items.length);
  }, []);

  useEffect(() => {
    updatePendingCount();
    const interval = setInterval(updatePendingCount, 5000);
    return () => clearInterval(interval);
  }, [updatePendingCount]);

  // Sync a specific offline family to cloud
  // Note: Old expense/income/category features have been removed
  // This function is now simplified for the calendar-only data model
  const syncFamily = async (familyId: string): Promise<{ newFamilyId?: string; error?: Error }> => {
    if (!session?.user) {
      return { error: new Error('Você precisa estar logado para sincronizar') };
    }

    if (!isOnline) {
      return { error: new Error('Você está offline') };
    }

    setIsSyncing(true);
    setSyncProgress({ step: 'Preparando...', current: 0, total: 100 });

    let newFamilyId: string | null = null;
    const createdCloudIds: { table: string; id: string }[] = [];

    // Rollback function to clean up partially synced data
    const rollback = async () => {
      setSyncProgress({ step: 'Revertendo alterações...', current: 0, total: createdCloudIds.length });
      
      for (let i = createdCloudIds.length - 1; i >= 0; i--) {
        const { table, id } = createdCloudIds[i];
        try {
          await familyService.deleteByIdFromTable(table, id);
          setSyncProgress({ step: 'Revertendo alterações...', current: createdCloudIds.length - i, total: createdCloudIds.length });
        } catch (e) {
          console.error(`Failed to rollback ${table}:${id}`, e);
        }
      }

      // Delete family member and family if they were created
      if (newFamilyId) {
        try {
          await familyService.deleteMembersByFamily(newFamilyId);
          await familyService.deleteFamily(newFamilyId);
        } catch (e) {
          console.error('Failed to rollback family', e);
        }
      }
    };

    try {
      // Get offline family
      const offlineFamily = await offlineAdapter.get<any>('families', familyId);
      if (!offlineFamily) {
        return { error: new Error('Família não encontrada') };
      }

      // Count total items for progress (only family + events + tags)
      const events = await offlineAdapter.getAllByIndex<any>('events', 'family_id', familyId);
      const tags = await offlineAdapter.getAll<any>('tag_definitions');
      const eventTags = await offlineAdapter.getAll<any>('event_tags');

      const totalItems = 1 + events.length + tags.length + eventTags.length;
      let syncedItems = 0;

      const updateProgress = (step: string, details?: string) => {
        syncedItems++;
        setSyncProgress({ step, current: syncedItems, total: totalItems, details });
      };

      // Step 1: Create family in cloud
      setSyncProgress({ step: 'Criando família na nuvem...', current: 0, total: totalItems });
      
      const { data: cloudFamily, error: familyError } = await familyService.insertFamily(
        offlineFamily.name,
        session.user.id
      );

      if (familyError) {
        throw new Error(`Erro ao criar família: ${familyError.message}`);
      }

      newFamilyId = cloudFamily.id;
      updateProgress('Família criada', offlineFamily.name);

      // Create owner membership
      const { error: memberError } = await familyService.insertFamilyMember({
        family_id: newFamilyId,
        user_id: session.user.id,
        role: 'owner',
      });

      if (memberError) {
        throw new Error(`Erro ao criar membro: ${memberError.message}`);
      }

      // ID mapping for related records
      const idMap: Record<string, string> = { [familyId]: newFamilyId };

      // Step 2: Sync events
      for (const event of events) {
        const { data, error } = await familyService.insertEventForSync({
          family_id: newFamilyId,
          title: event.title,
          date: event.date,
          is_recurring: event.is_recurring,
          recurrence_rule: event.recurrence_rule,
        });
        
        if (error) {
          throw new Error(`Erro ao sincronizar evento "${event.title}": ${error.message}`);
        }
        
        if (data) {
          idMap[event.id] = data.id;
          createdCloudIds.push({ table: 'event', id: data.id });
        }
        updateProgress('Sincronizando eventos', event.title);
      }

      // Step 3: Sync tags
      for (const tag of tags) {
        const { data, error } = await familyService.insertTagDefinitionForSync({
          family_id: newFamilyId,
          name: tag.name,
          color: tag.color,
        });
        
        if (error) {
          throw new Error(`Erro ao sincronizar tag "${tag.name}": ${error.message}`);
        }
        
        if (data) {
          idMap[tag.id] = data.id;
          createdCloudIds.push({ table: 'tag', id: data.id });
        }
        updateProgress('Sincronizando tags', tag.name);
      }

      // Step 4: Sync event tags
      for (const eventTag of eventTags) {
        const { data, error } = await familyService.insertEventTagForSync({
          event_id: idMap[eventTag.event_id] || eventTag.event_id,
          tag_id: idMap[eventTag.tag_id] || eventTag.tag_id,
        });
        
        if (error) {
          throw new Error(`Erro ao sincronizar tags de evento: ${error.message}`);
        }
        
        if (data) {
          createdCloudIds.push({ table: 'event_tag', id: data.id });
        }
        updateProgress('Sincronizando tags de evento');
      }

      // Step 5: Clean up local offline data
      setSyncProgress({ step: 'Limpando dados locais...', current: totalItems, total: totalItems });
      
      for (const event of events) await offlineAdapter.delete('events', event.id);
      for (const tag of tags) await offlineAdapter.delete('tag_definitions', tag.id);
      for (const eventTag of eventTags) await offlineAdapter.delete('event_tags', eventTag.id);
      await offlineAdapter.delete('families', familyId);

      // Clear sync queue for this family
      const queueItems = await offlineAdapter.sync.getByFamily(familyId);
      for (const item of queueItems) await offlineAdapter.sync.remove(item.id);

      await updatePendingCount();
      
      setSyncProgress({ step: 'Concluído!', current: totalItems, total: totalItems });
      toast.success('Família sincronizada com sucesso!');

      return { newFamilyId };
    } catch (error) {
      console.error('Sync error:', error);
      
      // Attempt rollback
      if (createdCloudIds.length > 0 || newFamilyId) {
        toast.error('Erro na sincronização. Revertendo alterações...');
        await rollback();
        toast.info('Alterações revertidas. Seus dados locais foram preservados.');
      }
      
      return { error: error as Error };
    } finally {
      setIsSyncing(false);
      // Clear progress after a short delay to show completion
      setTimeout(() => setSyncProgress(null), 2000);
    }
  };

  // Sync all pending changes
  const syncNow = async () => {
    if (!session?.user || !isOnline) return;

    setIsSyncing(true);
    try {
      const items = await offlineAdapter.sync.getAll();
      
      for (const item of items) {
        try {
          if (offlineAdapter.isOfflineId(item.familyId)) {
            // Skip items for offline families - they need full family sync
            continue;
          }

          if (item.action === 'insert') {
            await familyService.insertToTable(item.type, item.data);
          } else if (item.action === 'update') {
            await familyService.updateInTable(item.type, item.data.id, item.data);
          } else if (item.action === 'delete') {
            await familyService.deleteByIdFromTable(item.type, item.data.id);
          }

          await offlineAdapter.sync.remove(item.id);
        } catch (error) {
          console.error('Error syncing item:', item, error);
        }
      }

      await updatePendingCount();
      if (items.length > 0) {
        toast.success('Dados sincronizados!');
      }
    } finally {
      setIsSyncing(false);
    }
  };

  // Auto-sync when coming online
  useEffect(() => {
    if (isOnline && session?.user) {
      syncNow();
    }
  }, [isOnline, session]);

  return (
    <OnlineContext.Provider
      value={{
        isOnline,
        isSyncing,
        syncProgress,
        pendingSyncCount,
        syncNow,
        syncFamily,
      }}
    >
      {children}
    </OnlineContext.Provider>
  );
};
