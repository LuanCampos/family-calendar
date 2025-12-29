import React from 'react';
import type { Event, EventInput, EventTag } from '@/types/calendar';
import { enrichEventsWithTags } from '@/lib/utils/eventUtils';
import { filterEventsByTags } from '@/lib/utils/filterUtils';
import { Header } from '../header';
import { CalendarGrid } from './CalendarGrid';
import { EventModal } from './EventModal';
import { useCalendar } from '@/hooks/useCalendar';
import { useEvents } from '@/hooks/useEvents';
import { useEventTags } from '@/hooks/useEventTags';
import { useFilterTags } from '@/hooks/useFilterTags';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';

interface CalendarViewProps {
  onTagManager?: () => void;
  onSettings?: () => void;
  userEmail?: string;
  availableTags?: EventTag[];
  isOnline?: boolean;
  isSyncing?: boolean;
  syncProgress?: number;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  onTagManager,
  onSettings,
  userEmail,
  availableTags,
  isOnline = true,
  isSyncing = false,
  syncProgress = 0,
}) => {
  const { t } = useLanguage();
  const {
    currentDate,
    selectedDate,
    goToNextMonth,
    goToPreviousMonth,
    goToToday,
    selectDate,
    setCurrentDate,
  } = useCalendar();

  const startDate = format(startOfMonth(currentDate), 'yyyy-MM-dd');
  const endDate = format(endOfMonth(currentDate), 'yyyy-MM-dd');

  const { events, createEvent: createNewEvent, updateEvent: updateExistingEvent, deleteEvent: deleteExistingEvent } = useEvents(startDate, endDate);
  const { tags: loadedTags } = useEventTags();
  
  // Use tags from props if available, otherwise use loaded tags
  const tags = availableTags || loadedTags;

  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [editingEvent, setEditingEvent] = React.useState<Event | undefined>();
  const { selectedFilterTags, toggleTagFilter, clearFilters } = useFilterTags();

  const handleDateClick = (date: string) => {
    console.log('Date clicked:', date);
    selectDate(date);
    setEditingEvent(undefined);
    setIsModalOpen(true);
  };

  const handleEventClick = (event: Event) => {
    console.log('Event clicked:', event);
    selectDate(event.date);
    setEditingEvent(event);
    setIsModalOpen(true);
  };

  const handleSaveEvent = async (input: EventInput) => {
    try {
      if (editingEvent) {
        const result = await updateExistingEvent(editingEvent.id, input);
        if (result.error) {
          toast.error(t('eventError'));
          return;
        }
        toast.success(t('eventUpdated'));
      } else {
        const result = await createNewEvent(input);
        if (result.error) {
          toast.error(t('eventError'));
          return;
        }
        toast.success(t('eventCreated'));
      }
      setIsModalOpen(false);
    } catch (error) {
      console.error('Error saving event:', error);
      toast.error(t('eventError'));
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    try {
      const result = await deleteExistingEvent(eventId);
      if (result.error) {
        toast.error(t('eventError'));
        return;
      }
      toast.success(t('eventDeleted'));
      setIsModalOpen(false);
    } catch (error) {
      console.error('Error deleting event:', error);
      toast.error(t('eventError'));
    }
  };

  // Enrich events with tag data
  const enrichedEvents = enrichEventsWithTags(events, tags);

  // Filter events based on selected tags
  const filteredEvents = filterEventsByTags(enrichedEvents, selectedFilterTags);

  // Get events for selected date
  const selectedDateEvents = selectedDate ? filteredEvents.filter(e => e.date === selectedDate) : [];

  return (
    <div className="flex flex-col h-full bg-background">
      <Header
        currentDate={currentDate}
        onPrevious={goToPreviousMonth}
        onNext={goToNextMonth}
        onToday={goToToday}
        onDateChange={setCurrentDate}
        onTagManager={onTagManager}
        onSettings={onSettings}
        syncProgress={syncProgress}
        isSyncing={isSyncing}
        availableTags={tags}
        selectedFilterTags={selectedFilterTags}
        onToggleTagFilter={toggleTagFilter}
        onClearFilters={clearFilters}
      />

      <div className="flex-1 overflow-y-auto">
        <CalendarGrid
          currentDate={currentDate}
          events={filteredEvents}
          selectedDate={selectedDate}
          onSelectDate={selectDate}
          onDateClick={handleDateClick}
          onEventClick={handleEventClick}
        />
      </div>

      <EventModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingEvent(undefined);
        }}
        onSave={handleSaveEvent}
        onDelete={handleDeleteEvent}
        selectedDate={selectedDate || format(new Date(), 'yyyy-MM-dd')}
        editingEvent={editingEvent}
        availableTags={tags}
      />
    </div>
  );
};
