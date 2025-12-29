import { useState } from 'react';
import { useFamily } from '@/contexts/FamilyContext';
import { useAuth } from '@/contexts/AuthContext';
import { CalendarView } from '@/components/calendar';
import { TagManager } from '@/components/tags';
import { SettingsPanel } from '@/components/settings';
import { FamilySetup } from '@/components/family';
import { useEventTags } from '@/hooks/useEventTags';
import { useOnline } from '@/contexts/OnlineContext';

const CalendarContent = () => {
  const { user } = useAuth();
  const { currentFamilyId } = useFamily();
  const { tags, createTag, updateTag, deleteTag } = useEventTags();
  const { isOnline, isSyncing, syncProgress } = useOnline();
  const [isTagManagerOpen, setIsTagManagerOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  if (!currentFamilyId) {
    return <FamilySetup />;
  }

  return (
    <div className="h-screen bg-background flex flex-col">
      <CalendarView
        userEmail={user?.email}
        onTagManager={() => setIsTagManagerOpen(true)}
        onSettings={() => setIsSettingsOpen(true)}
        availableTags={tags}
        isOnline={isOnline}
        isSyncing={isSyncing}
        syncProgress={syncProgress}
      />

      {/* Modals */}
      <TagManager
        tags={tags}
        onCreateTag={createTag}
        onUpdateTag={updateTag}
        onDeleteTag={deleteTag}
        isOpen={isTagManagerOpen}
        onClose={() => setIsTagManagerOpen(false)}
      />

      <SettingsPanel
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  );
};

export default CalendarContent;
