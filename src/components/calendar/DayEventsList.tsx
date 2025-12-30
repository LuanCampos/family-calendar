import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Plus, Pencil, Trash2, Clock, Sun } from 'lucide-react';
import { format, parse } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { Event } from '@/types/calendar';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import { isEventTagArray } from '@/lib/utils/eventUtils';
import { getContrastColor } from '@/lib/utils/colorUtils';

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

  // Sort events by time (all-day first, then by time)
  const sortedEvents = [...events].sort((a, b) => {
    if (a.isAllDay && !b.isAllDay) return -1;
    if (!a.isAllDay && b.isAllDay) return 1;
    if (a.time && b.time) {
      return a.time.localeCompare(b.time);
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
    ? format(parse(selectedDate, 'yyyy-MM-dd', new Date()), 'dd MMMM, EEEE', { locale: ptBR })
    : '';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] sm:w-[90vw] sm:max-w-md max-h-[95vh] sm:max-h-[90vh] flex flex-col gap-0 p-0 rounded-lg sm:rounded-xl overflow-hidden">
        <DialogHeader className="border-b px-3 sm:px-4 pt-2.5 sm:pt-3 pb-2 sm:pb-2.5 flex-shrink-0">
          <DialogTitle className="text-sm sm:text-base font-bold">
            {displayDate}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-1.5 sm:space-y-2 p-2.5 sm:p-3 min-h-0">
          {sortedEvents.length === 0 ? (
            <div className="border border-dashed border-border rounded-lg p-4 sm:p-5 bg-muted/20 text-center">
              <p className="text-xs sm:text-sm text-muted-foreground mb-2">
                {t('noTags')}
              </p>
              <p className="text-xs text-muted-foreground mb-4">
                Nenhum evento para este dia
              </p>
              <Button 
                size="sm" 
                onClick={handleAddNew}
                className="w-full text-xs sm:text-sm"
              >
                <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                {t('newEvent')}
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {/* All-day events */}
              {sortedEvents.filter(e => e.isAllDay).length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-xs sm:text-sm font-semibold text-muted-foreground px-1">
                    {t('eventAllDay')}
                  </p>
                  <div className="space-y-1.5">
                    {sortedEvents.filter(e => e.isAllDay).map((event) => (
                      <EventListItem 
                        key={event.id} 
                        event={event} 
                        onClick={() => handleEventClick(event)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Separator if both types */}
              {sortedEvents.filter(e => e.isAllDay).length > 0 && 
               sortedEvents.filter(e => !e.isAllDay).length > 0 && (
                <div className="h-px bg-border my-2"></div>
              )}

              {/* Timed events */}
              {sortedEvents.filter(e => !e.isAllDay).length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-xs sm:text-sm font-semibold text-muted-foreground px-1">
                    {t('eventTime')}
                  </p>
                  <div className="space-y-1.5">
                    {sortedEvents.filter(e => !e.isAllDay).map((event) => (
                      <EventListItem 
                        key={event.id} 
                        event={event} 
                        onClick={() => handleEventClick(event)}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="border-t px-4 sm:px-5 py-2.5 sm:py-3">
          <Button 
            onClick={handleAddNew}
            size="sm"
            className="w-full text-xs sm:text-sm"
          >
            <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
            {t('newEvent')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Event List Item Component
interface EventListItemProps {
  event: Event;
  onClick: () => void;
}

const EventListItem: React.FC<EventListItemProps> = ({ event, onClick }) => {
  const tagColor =
    Array.isArray(event.tags) && event.tags.length > 0
      ? isEventTagArray(event.tags)
        ? event.tags[0].color
        : 'hsl(var(--primary))'
      : 'hsl(var(--primary))';

  const timeDisplay = event.isAllDay ? '—' : event.time;

  return (
    <div className="flex items-center gap-2 group">
      <button
        onClick={onClick}
        className={cn(
          'flex-1 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-md border transition-all',
          'text-xs sm:text-sm text-left',
          'hover:shadow-md hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-primary',
          'bg-card border-border'
        )}
        title={event.title}
      >
        <div className="flex items-center gap-2">
          {event.isAllDay ? (
            <Sun className="h-3 w-3 sm:h-4 sm:w-4 text-amber-500 flex-shrink-0" />
          ) : (
            <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-primary flex-shrink-0" />
          )}
          <div className="flex-1 min-w-0">
            {!event.isAllDay && (
              <div className="font-semibold text-primary text-xs sm:text-sm">
                {timeDisplay}
              </div>
            )}
            <div className="flex items-center gap-2 flex-wrap">
              <div className={cn(
                'truncate font-medium',
                event.isAllDay ? 'text-xs sm:text-sm' : 'text-xs sm:text-sm'
              )}>
                {event.title}
              </div>
              {/* Tags inline */}
              {Array.isArray(event.tags) && event.tags.length > 0 && (
                <div className="flex gap-1 flex-wrap">
                  {event.tags.slice(0, 2).map((tag) => (
                    <span
                      key={isEventTagArray(event.tags) ? tag.id : 'tag'}
                      className="px-1.5 py-0.5 rounded text-xs font-medium flex-shrink-0"
                      style={{
                        backgroundColor: isEventTagArray(event.tags) ? tag.color : tagColor,
                        color: getContrastColor(isEventTagArray(event.tags) ? tag.color : tagColor),
                      }}
                    >
                      {isEventTagArray(event.tags) ? tag.name : 'Tag'}
                    </span>
                  ))}
                  {Array.isArray(event.tags) && event.tags.length > 2 && (
                    <span className="px-1.5 py-0.5 rounded text-xs font-medium bg-muted text-muted-foreground flex-shrink-0">
                      +{event.tags.length - 2}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </button>
      <Button
        variant="ghost"
        size="sm"
        onClick={onClick}
        className="h-7 px-1.5 text-xs opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
        title="Editar evento"
      >
        <Pencil className="h-4 w-4" />
      </Button>
    </div>
  );
};


