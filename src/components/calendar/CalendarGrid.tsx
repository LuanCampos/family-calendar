import React from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, startOfWeek, endOfWeek } from 'date-fns';
import type { Event, EventTag } from '@/types/calendar';
import { isEventTagArray } from '@/lib/utils/eventUtils';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';

interface CalendarGridProps {
  currentDate: Date;
  events: Event[];
  selectedDate: string | null;
  onSelectDate: (date: string) => void;
  onDateClick: (date: string) => void;
  onEventClick?: (event: Event) => void;
}

export const CalendarGrid: React.FC<CalendarGridProps> = ({
  currentDate,
  events,
  selectedDate,
  onSelectDate,
  onDateClick,
  onEventClick,
}) => {
  const { t } = useLanguage();
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
  const daysInCalendar = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  // Group events by date
  const eventsByDate = events.reduce((acc, event) => {
    if (!acc[event.date]) {
      acc[event.date] = [];
    }
    acc[event.date].push(event);
    return acc;
  }, {} as Record<string, Event[]>);

  const weekDays = [
    t('day-short-0'),
    t('day-short-1'),
    t('day-short-2'),
    t('day-short-3'),
    t('day-short-4'),
    t('day-short-5'),
    t('day-short-6'),
  ];

  return (
    <div className="flex-1 overflow-auto bg-background p-3">
      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-2 mb-2">
        {weekDays.map((day) => (
          <div
            key={day}
            className="text-center font-semibold text-sm text-muted-foreground py-2"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-2 auto-rows-[110px]">
        {daysInCalendar.map((day) => {
          const dateStr = format(day, 'yyyy-MM-dd');
          const dayEvents = eventsByDate[dateStr] || [];
          const isCurrentMonth = isSameMonth(day, currentDate);
          const isTodayDate = isToday(day);
          const isSelected = dateStr === selectedDate;

          return (
            <div
              key={dateStr}
              onClick={() => {
                onSelectDate(dateStr);
                onDateClick(dateStr);
              }}
              className={cn(
                'rounded-lg border transition-all cursor-pointer flex flex-col overflow-hidden',
                'hover:shadow-md hover:border-primary',
                !isCurrentMonth && 'bg-muted/30 opacity-50',
                isCurrentMonth && 'bg-card',
                isTodayDate && 'border-primary bg-primary/5 shadow-sm',
                isSelected && 'ring-2 ring-primary'
              )}
            >
              {/* Day number */}
              <div className={cn(
                'px-3 py-2 font-semibold text-sm flex items-center justify-between',
                !isCurrentMonth && 'text-muted-foreground',
                isCurrentMonth && isTodayDate && 'bg-primary/10 text-primary',
              )}>
                <span>{day.getDate()}</span>
              </div>

              {/* Events */}
              <div className="flex-1 px-2 pb-2 overflow-hidden flex flex-col gap-1">
                {dayEvents.length > 0 ? (
                  <>
                    {dayEvents.slice(0, 2).map((event) => {
                      const tagColor = 
                        Array.isArray(event.tags) && event.tags.length > 0
                          ? isEventTagArray(event.tags)
                            ? event.tags[0].color
                            : 'hsl(var(--primary))'
                          : 'hsl(var(--primary))';

                      return (
                        <div
                          key={event.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            onEventClick?.(event);
                          }}
                          className={cn(
                            'text-xs px-2 py-1 rounded truncate font-medium text-white',
                            'cursor-pointer hover:opacity-80 transition-opacity hover:scale-105'
                          )}
                          style={{
                            backgroundColor: tagColor,
                          }}
                          title={`Clique para editar: ${event.title}`}
                        >
                          {event.isAllDay ? (
                            <>📅 {event.title}</>
                          ) : (
                            <>
                              {event.time && (
                                <span className="font-semibold">{event.time}</span>
                              )}
                              {event.time && ' '}{event.title}
                            </>
                          )}
                        </div>
                      );
                    })}
                    {dayEvents.length > 2 && (
                      <div className="text-xs text-muted-foreground px-2 py-1 font-medium">
                        +{dayEvents.length - 2} mais
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-xs text-muted-foreground/40">
                    {isCurrentMonth ? '—' : ''}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
