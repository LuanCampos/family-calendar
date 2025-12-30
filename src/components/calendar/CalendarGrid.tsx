import React from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, startOfWeek, endOfWeek } from 'date-fns';
import type { Event, EventTag } from '@/types/calendar';
import { isEventTagArray } from '@/lib/utils/eventUtils';
import { getContrastColor } from '@/lib/utils/colorUtils';
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
    <div className="flex-1 overflow-auto bg-background p-1 sm:p-2 md:p-2 lg:p-2.5 h-full" role="main">
      {/* Weekday headers - responsive text size */}
      <div className="grid grid-cols-7 gap-0.5 sm:gap-1 md:gap-1.5 mb-0.5 sm:mb-1" role="row">
        {weekDays.map((day) => (
          <div
            key={day}
            className="text-center font-semibold text-xs sm:text-sm text-muted-foreground py-0.5 sm:py-1"
            role="columnheader"
            aria-label={day}
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid - Responsive row heights, auto-fill remaining space */}
      <div className="grid grid-cols-7 gap-0.5 sm:gap-1 md:gap-1.5 lg:gap-2 auto-rows-fr" role="grid">
        {daysInCalendar.map((day) => {
          const dateStr = format(day, 'yyyy-MM-dd');
          const dayEvents = eventsByDate[dateStr] || [];
          const isCurrentMonth = isSameMonth(day, currentDate);
          const isTodayDate = isToday(day);
          const isSelected = dateStr === selectedDate;
          const dayLabel = format(day, 'EEEE, MMMM d, yyyy');

          return (
            <div
              key={dateStr}
              onClick={() => {
                onSelectDate(dateStr);
                onDateClick(dateStr);
              }}
              role="gridcell"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSelectDate(dateStr);
                  onDateClick(dateStr);
                }
              }}
              aria-label={`${dayLabel}${dayEvents.length > 0 ? `, ${dayEvents.length} ${dayEvents.length === 1 ? 'event' : 'events'}` : ''}`}
              className={cn(
                'rounded text-xs sm:text-sm border border-border transition-all cursor-pointer flex flex-col overflow-hidden focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1',
                'hover:shadow-md hover:border-primary hover:scale-[1.02] md:hover:scale-[1.01]',
                !isCurrentMonth && 'bg-muted/30 opacity-50',
                isCurrentMonth && 'bg-card',
                isTodayDate && 'border-primary bg-primary/5 shadow-sm md:shadow-md',
                isSelected && 'ring-2 ring-primary',
                'min-h-[100px] sm:min-h-[100px] md:min-h-[80px] lg:min-h-[100px]'
              )}
            >
              {/* Day number - Responsive font size */}
              <div
                className={cn(
                  'px-0.5 sm:px-1 md:px-1.5 py-0.5 sm:py-1 font-semibold text-xs sm:text-sm flex items-center justify-between flex-shrink-0',
                  !isCurrentMonth && 'text-muted-foreground',
                  isCurrentMonth && isTodayDate && 'bg-primary/10 text-primary'
                )}
              >
                <span aria-label={isTodayDate ? `Today, ${day.getDate()}` : day.getDate().toString()}>
                  {day.getDate()}
                </span>
              </div>

              {/* Events - Responsive with overflow handling, flex to fill space */}
              <div className="flex-1 px-0.5 sm:px-1 md:px-1.5 overflow-hidden flex flex-col gap-0.5" role="list">
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
                          role="listitem"
                          className={cn(
                            'text-xs px-1 sm:px-1.5 py-0.5 rounded truncate font-medium',
                            'transition-opacity hover:opacity-90 cursor-pointer'
                          )}
                          style={{
                            backgroundColor: tagColor,
                            color: getContrastColor(tagColor),
                          }}
                          title={event.title}
                          aria-label={`${event.title}${event.time ? ` at ${event.time}` : ''}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            onEventClick?.(event);
                          }}
                        >
                          {event.isAllDay ? (
                            <>📅 {event.title}</>
                          ) : (
                            <>
                              {event.time && (
                                <span className="font-semibold">{event.time}</span>
                              )}
                              {event.time && ' '}
                              <span className="hidden sm:inline">{event.title}</span>
                            </>
                          )}
                        </div>
                      );
                    })}
                    {dayEvents.length > 2 && (
                      <div className="text-xs text-muted-foreground px-1 md:px-2 font-medium" role="listitem">
                        +{dayEvents.length - 2}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-xs text-muted-foreground/40 hidden md:block" aria-hidden="true">
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
