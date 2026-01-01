import React from 'react';
import {
  Dialog,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ModalContent } from '@/components/ui/modal-content';
import { Button } from '@/components/ui/button';
import { Plus, Clock, Sun } from 'lucide-react';
import { format, parse } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { Event } from '@/types/calendar';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import { isEventTagArray } from '@/lib/utils/eventUtils';
import { getContrastColor } from '@/lib/utils/colorUtils';
import { formatTimeHHMM } from '@/utils/formatters';

interface DayEventsListProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: string;
  events: Event[];
  onEventClick: (event: Event) => void;
  onAddNewEvent: () => void;
}

export const DayEventsList: React.FC<DayEventsListProps> = ({
  isOpen,
  onClose,
  selectedDate,
  events,
  onEventClick,
  onAddNewEvent,
}) => {
  const { t } = useLanguage();

  // Sort events by display type: all-day (explicit or no time) first, then by time
  const sortedEvents = [...events].sort((a, b) => {
    const aAll = !!a.isAllDay || !a.time;
    const bAll = !!b.isAllDay || !b.time;
    if (aAll && !bAll) return -1;
    if (!aAll && bAll) return 1;
    if (a.time && b.time) {
      return formatTimeHHMM(a.time).localeCompare(formatTimeHHMM(b.time));
    }
    return 0;
  });

  const handleAddNew = () => {
    onAddNewEvent();
    onClose();
  };

  const handleEventClick = (event: Event) => {
    onEventClick(event);
    onClose();
  };

  const displayDate = selectedDate
    ? format(parse(selectedDate, 'yyyy-MM-dd', new Date()), "d 'de' MMMM, EEEE", { locale: ptBR })
    : '';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <ModalContent size="md">
        <DialogHeader className="border-b bg-gradient-to-br from-card to-muted/30 px-4 sm:px-5 pt-4 sm:pt-4 pb-3 sm:pb-3 flex-shrink-0">
          <DialogTitle className="text-lg sm:text-xl font-semibold">
            {displayDate}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-2 sm:space-y-2 p-3 sm:p-4 min-h-0">
          {sortedEvents.length === 0 ? (
            <div className="border-2 border-dashed border-border rounded-xl p-6 sm:p-8 bg-muted/30 text-center">
              <p className="text-sm sm:text-base text-muted-foreground font-medium">
                Nenhum evento para este dia
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {sortedEvents.map((event) => (
                <EventListItem 
                  key={event.id} 
                  event={event} 
                  onClick={() => handleEventClick(event)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="border-t bg-gradient-to-br from-muted/30 to-card px-4 sm:px-5 py-3 sm:py-3">
          <Button 
            onClick={handleAddNew}
            size="sm"
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            {t('newEvent')}
          </Button>
        </div>
      </ModalContent>
    </Dialog>
  );
};

// Event List Item Component
interface EventListItemProps {
  event: Event;
  onClick: () => void;
}

const EventListItem: React.FC<EventListItemProps> = ({ event, onClick }) => {
  const { t } = useLanguage();
  const tagColor =
    Array.isArray(event.tags) && event.tags.length > 0
      ? isEventTagArray(event.tags)
        ? event.tags[0].color
        : 'hsl(var(--primary))'
      : 'hsl(var(--primary))';

  const isAllDayDisplay = !!event.isAllDay || !event.time;
  const labelText = isAllDayDisplay ? t('eventAllDay') : formatTimeHHMM(event.time || '');

  return (
    <div className="flex items-stretch gap-2 group">
      <button
        onClick={onClick}
        className={cn(
          'flex-1 px-3 sm:px-4 py-3 sm:py-3.5 rounded-xl border-2 transition-all w-full',
          'text-sm sm:text-base text-left',
          'hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-primary/60 focus:ring-offset-2',
          'bg-card border-border min-h-[64px] sm:min-h-0'
        )}
        title={event.title}
      >
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-full border bg-muted/40 text-muted-foreground flex-shrink-0">
            {isAllDayDisplay ? (
              <Sun className="h-4 w-4 text-amber-500" />
            ) : (
              <>
                <Clock className="h-4 w-4 text-primary" />
                <span className={cn('text-xs font-medium text-primary')}>{labelText}</span>
              </>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="font-semibold text-sm sm:text-base truncate">
                {event.title}
              </div>
              {Array.isArray(event.tags) && event.tags.length > 0 && (
                <div className="flex items-center gap-1.5 flex-wrap">
                  {event.tags.slice(0, 2).map((tag) => (
                    <span
                      key={isEventTagArray(event.tags) ? tag.id : 'tag'}
                      className="px-2 py-1 rounded-md text-xs font-semibold flex-shrink-0"
                      style={{
                        backgroundColor: isEventTagArray(event.tags) ? tag.color : tagColor,
                        color: getContrastColor(isEventTagArray(event.tags) ? tag.color : tagColor),
                      }}
                    >
                      {isEventTagArray(event.tags) ? tag.name : 'Tag'}
                    </span>
                  ))}
                  {Array.isArray(event.tags) && event.tags.length > 2 && (
                    <span className="px-2 py-1 rounded-md text-xs font-semibold bg-muted text-muted-foreground flex-shrink-0">
                      +{event.tags.length - 2}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </button>
    </div>
  );
};


