import React from 'react';
import type { Event, EventInput, EventTag } from '@/types/calendar';
import { enrichEventsWithTags } from '@/lib/utils/eventUtils';
import { filterEventsByTags } from '@/lib/utils/filterUtils';
import { Header } from '../header';
import { CalendarGrid } from './CalendarGrid';
import { EventModal } from './EventModal';
import { DayEventsList } from './DayEventsList';
import { useCalendar } from '@/hooks/useCalendar';
import { useEvents } from '@/hooks/useEvents';
import { useEventTags } from '@/hooks/useEventTags';
import { useFilterTags } from '@/hooks/useFilterTags';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';
import { logger } from '@/lib/logger';

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

  // Swipe gesture handling with refs to avoid stale state
  const touchStartRef = React.useRef<number | null>(null);
  const touchStartYRef = React.useRef<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartRef.current = e.targetTouches[0].clientX;
    touchStartYRef.current = e.targetTouches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartRef.current || !touchStartYRef.current) return;
    
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    const distanceX = touchStartRef.current - touchEndX;
    const distanceY = Math.abs(touchStartYRef.current - touchEndY);
    
    // Only trigger swipe if horizontal movement is dominant
    if (distanceY < 50) {
      const isLeftSwipe = distanceX > 75;
      const isRightSwipe = distanceX < -75;

      if (isLeftSwipe) {
        goToNextMonth();
      }
      if (isRightSwipe) {
        goToPreviousMonth();
      }
    }

    // Reset touch
    touchStartRef.current = null;
    touchStartYRef.current = null;
  };

  const startDate = format(startOfMonth(currentDate), 'yyyy-MM-dd');
  const endDate = format(endOfMonth(currentDate), 'yyyy-MM-dd');

  const { events, createEvent: createNewEvent, updateEvent: updateExistingEvent, deleteEvent: deleteExistingEvent } = useEvents(startDate, endDate);
  const { tags: loadedTags } = useEventTags();
  
  // Use tags from props if available, otherwise use loaded tags
  const tags = availableTags || loadedTags;

  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [isDayListOpen, setIsDayListOpen] = React.useState(false);
  const [editingEvent, setEditingEvent] = React.useState<Event | undefined>();
  const { selectedFilterTags, toggleTagFilter, clearFilters } = useFilterTags();

  const handleDateClick = (date: string) => {
    logger.debug('ui.date.click', { date });
    selectDate(date);
    setEditingEvent(undefined);
    setIsDayListOpen(true);
  };

  const handleEventClick = (event: Event) => {
    logger.debug('ui.event.click', { eventId: event.id });
    selectDate(event.date);
    setEditingEvent(event);
    setIsDayListOpen(false);
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
      logger.error('ui.event.save.error', { error });
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
      logger.error('ui.event.delete.error', { error });
      toast.error(t('eventError'));
    }
  };

  const handleAddNewEvent = () => {
    setEditingEvent(undefined);
    setIsModalOpen(true);
  };

  // Enrich events with tag data
  const enrichedEvents = enrichEventsWithTags(events, tags);

  // Filter events based on selected tags
  const filteredEvents = filterEventsByTags(enrichedEvents, selectedFilterTags);

  // Get events for selected date
  const dateForList = selectedDate || format(new Date(), 'yyyy-MM-dd');
  const selectedDateEvents = filteredEvents.filter(e => e.date === dateForList);

  return (
    <div 
      className="flex flex-col h-full bg-background overflow-hidden"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
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

      <div className="flex-1 overflow-y-auto min-h-0">
        <CalendarGrid
          key={format(currentDate, 'yyyy-MM')}
          currentDate={currentDate}
          events={filteredEvents}
          selectedDate={selectedDate}
          onSelectDate={selectDate}
          onDateClick={handleDateClick}
        />
      </div>

      <DayEventsList
        isOpen={isDayListOpen}
        onClose={() => setIsDayListOpen(false)}
        selectedDate={dateForList}
        events={selectedDateEvents}
        onEventClick={handleEventClick}
        onAddNewEvent={handleAddNewEvent}
      />

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
