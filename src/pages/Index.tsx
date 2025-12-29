import { useState } from 'react';
import { useFamily } from '@/contexts/FamilyContext';
import { useAuth } from '@/contexts/AuthContext';
import { CalendarView } from '@/components/calendar';
import { TagManager } from '@/components/tags';
import { OnlineStatusBar } from '@/components/common';
import { FamilySetup } from '@/components/family';
import { useEventTags } from '@/hooks/useEventTags';

const CalendarContent = () => {
  const { user } = useAuth();
  const { currentFamilyId } = useFamily();
  const { tags, createTag, updateTag, deleteTag } = useEventTags();
  const [isTagManagerOpen, setIsTagManagerOpen] = useState(false);

  if (!currentFamilyId) {
    return <FamilySetup />;
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      <OnlineStatusBar />

      <div className="flex flex-1 overflow-hidden">
        {/* Main calendar */}
        <div className="flex-1 flex flex-col">
          <CalendarView
            userEmail={user?.email}
            onTagManager={() => setIsTagManagerOpen(true)}
            availableTags={tags}
          />
        </div>
      </div>
      {/* Modals */}
      <TagManager
        tags={tags}
        onCreateTag={createTag}
        onUpdateTag={updateTag}
        onDeleteTag={deleteTag}
        isOpen={isTagManagerOpen}
        onClose={() => setIsTagManagerOpen(false)}
      />
    </div>
  );
};

export default CalendarContent;
