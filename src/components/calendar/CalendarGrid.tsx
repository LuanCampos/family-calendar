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
}

export const CalendarGrid: React.FC<CalendarGridProps> = ({
  currentDate,
  events,
  selectedDate,
  onSelectDate,
  onDateClick,
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
    <div className="flex-1 overflow-auto bg-background p-2 sm:p-3 md:p-4 h-full" role="main">
      {/* Weekday headers - responsive text size */}
      <div className="grid grid-cols-7 gap-1 sm:gap-1.5 md:gap-2 mb-1.5 sm:mb-2" role="row">
        {weekDays.map((day) => (
          <div
            key={day}
            className="text-center font-bold text-sm sm:text-sm text-muted-foreground py-1 sm:py-1.5"
            role="columnheader"
            aria-label={day}
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid - Responsive row heights, auto-fill remaining space */}
      <div className="grid grid-cols-7 gap-1 sm:gap-1.5 md:gap-2 auto-rows-fr" role="grid">
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
                'rounded-lg text-sm sm:text-sm border-2 transition-all cursor-pointer flex flex-col overflow-hidden',
                'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
                'hover:shadow-lg hover:border-primary hover:scale-[1.03] active:scale-[0.98]',
                !isCurrentMonth && 'bg-muted/40 opacity-60',
                isCurrentMonth && 'bg-card shadow-sm',
                isTodayDate && 'border-primary bg-primary/10 shadow-md ring-1 ring-primary/20',
                isSelected && 'ring-2 ring-primary ring-offset-2 shadow-xl',
                'h-[75px] sm:h-[85px] md:h-[80px] lg:h-[95px]'
              )}
            >
              {/* Day number - Responsive font size */}
              <div
                className={cn(
                  'px-1.5 sm:px-2 md:px-2.5 py-1 sm:py-1.5 font-bold text-sm sm:text-base flex items-center justify-between flex-shrink-0',
                  !isCurrentMonth && 'text-muted-foreground',
                  isCurrentMonth && !isTodayDate && 'text-foreground',
                  isCurrentMonth && isTodayDate && 'bg-primary text-primary-foreground rounded-t-md'
                )}
              >
                <span aria-label={isTodayDate ? `Hoje, ${day.getDate()}` : day.getDate().toString()}
                  className={cn(
                    isTodayDate && 'font-extrabold'
                  )}
                >
                  {day.getDate()}
                </span>
              </div>

              {/* Events - Faixinhas pequenas */}
              <div className="flex-1 px-0.5 sm:px-1 pb-0.5 overflow-hidden flex flex-col gap-0.5" role="list">
                {dayEvents.length > 0 ? (
                  <>
                    {dayEvents.slice(0, 4).map((event) => {
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
                          className="px-0.5 py-0.5 rounded truncate transition-all text-[0.5rem] font-medium h-3.5 leading-[0.75rem] pointer-events-none"
                          style={{
                            backgroundColor: tagColor,
                            color: getContrastColor(tagColor),
                          }}
                          title={`${event.title}${event.time ? ` - ${event.time}` : ''}`}
                          aria-label={`${event.title}${event.time ? ` às ${event.time}` : ''}`}
                        >
                          {event.title}
                        </div>
                      );
                    })}
                    {dayEvents.length > 4 && (
                      <div className="text-[0.5rem] text-primary font-bold px-0.5" role="listitem">
                        +{dayEvents.length - 4}
                      </div>
                    )}
                  </>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
