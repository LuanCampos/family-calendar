import React from 'react';
import { cn } from '@/lib/utils';
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
  const [monthAnimDir, setMonthAnimDir] = React.useState<'none' | 'left' | 'right'>('none');
  const animatingRef = React.useRef(false);

  // Haptic feedback helper, only vibrates when user activation is active
  const canHaptic = () => {
    try {
      const ua = (navigator as any).userActivation;
      const isActive = ua ? !!ua.isActive : true;
      return isActive && document.visibilityState === 'visible' && document.hasFocus();
    } catch {
      return false;
    }
  };

  const triggerHaptic = (duration = 10) => {
    try {
      if (!('vibrate' in navigator)) return;
      if (!canHaptic()) return;
      navigator.vibrate(duration);
    } catch {
      // ignore blocked vibrations
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartRef.current = e.targetTouches[0].clientX;
    touchStartYRef.current = e.targetTouches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartRef.current || !touchStartYRef.current) return;
    if (animatingRef.current) return; // prevent repeated triggers during animation

    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    const distanceX = touchStartRef.current - touchEndX;
    const distanceY = Math.abs(touchStartYRef.current - touchEndY);

    // Only trigger swipe if horizontal movement is dominant
    if (distanceY < 60) {
      const isLeftSwipe = distanceX > 40;
      const isRightSwipe = distanceX < -40;

      if (isLeftSwipe) {
        setMonthAnimDir('left');
        animatingRef.current = true;
        goToNextMonth();
        triggerHaptic(10);
        setTimeout(() => {
          animatingRef.current = false;
          setMonthAnimDir('none');
        }, 300);
      }
      if (isRightSwipe) {
        setMonthAnimDir('right');
        animatingRef.current = true;
        goToPreviousMonth();
        triggerHaptic(10);
        setTimeout(() => {
          animatingRef.current = false;
          setMonthAnimDir('none');
        }, 300);
      }
    }

    // Reset touch
    touchStartRef.current = null;
    touchStartYRef.current = null;
  };

  const startDate = format(startOfMonth(currentDate), 'yyyy-MM-dd');
  const endDate = format(endOfMonth(currentDate), 'yyyy-MM-dd');

  const { events, createEvent: createNewEvent, updateEvent: updateExistingEvent, deleteEvent: deleteExistingEvent, reloadEvents } = useEvents(startDate, endDate);
  const { tags: loadedTags } = useEventTags();
  
  // Use tags from props if available, otherwise use loaded tags
  const tags = availableTags || loadedTags;

  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [isDayListOpen, setIsDayListOpen] = React.useState(false);
  const [editingEvent, setEditingEvent] = React.useState<Event | undefined>();
  const { selectedFilterTags, toggleTagFilter, clearFilters } = useFilterTags();
  // Track when we're opening the modal as a result of clicking "New Event" in the day list.
  // This avoids a race where closing the day list clears `selectedDate` before the modal reads it.
  const openingModalRef = React.useRef(false);
  React.useEffect(() => {
    if (isModalOpen) {
      // Modal is now open; clear the transitional flag
      openingModalRef.current = false;
    }
  }, [isModalOpen]);

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
        // Ensure UI reflects latest tag colors and expansions
        await reloadEvents();
      } else {
        const result = await createNewEvent(input);
        if (result.error) {
          toast.error(t('eventError'));
          return;
        }
        toast.success(t('eventCreated'));
        // Refresh view to apply tag color mapping
        await reloadEvents();
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
    // Set flag before opening modal to prevent `selectedDate` from being cleared by day list close
    openingModalRef.current = true;
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
        onPrevious={() => {
          if (animatingRef.current) return;
          setMonthAnimDir('right');
          animatingRef.current = true;
          goToPreviousMonth();
          triggerHaptic(10);
          setTimeout(() => {
            animatingRef.current = false;
            setMonthAnimDir('none');
          }, 300);
        }}
        onNext={() => {
          if (animatingRef.current) return;
          setMonthAnimDir('left');
          animatingRef.current = true;
          goToNextMonth();
          triggerHaptic(10);
          setTimeout(() => {
            animatingRef.current = false;
            setMonthAnimDir('none');
          }, 300);
        }}
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
      <div className={cn(
        'flex-1 overflow-y-auto min-h-0',
        monthAnimDir === 'left' && 'month-slide-left',
        monthAnimDir === 'right' && 'month-slide-right'
      )}>
        <CalendarGrid
          key={format(currentDate, 'yyyy-MM')}
          currentDate={currentDate}
          events={filteredEvents}
          selectedDate={selectedDate}
          onSelectDate={(d) => selectDate(d)}
          onDateClick={handleDateClick}
        />
      </div>

      <DayEventsList
        isOpen={isDayListOpen}
        onClose={() => {
          setIsDayListOpen(false);
          // Only clear selection if we're truly closing the day list without opening the modal
          if (!isModalOpen && !openingModalRef.current) {
            selectDate(null);
          }
          const el = document.activeElement as HTMLElement | null;
          if (el && typeof el.blur === 'function') el.blur();
        }}
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
          // Clear selected date to remove highlight after closing any event modal
          selectDate(null);
          const el = document.activeElement as HTMLElement | null;
          if (el && typeof el.blur === 'function') el.blur();
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
