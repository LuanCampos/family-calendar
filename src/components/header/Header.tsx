import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Tag,
  Settings,
} from 'lucide-react';
import { format } from 'date-fns';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface HeaderProps {
  currentDate: Date;
  onPrevious: () => void;
  onNext: () => void;
  onToday: () => void;
  onDateChange?: (date: Date) => void;
  onTagManager?: () => void;
  onSettings?: () => void;
  syncProgress?: number;
  isSyncing?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  currentDate,
  onPrevious,
  onNext,
  onToday,
  onDateChange,
  onTagManager,
  onSettings,
  syncProgress = 0,
  isSyncing = false,
}) => {
  const { t } = useLanguage();
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());

  const months = [
    t('month-0'),
    t('month-1'),
    t('month-2'),
    t('month-3'),
    t('month-4'),
    t('month-5'),
    t('month-6'),
    t('month-7'),
    t('month-8'),
    t('month-9'),
    t('month-10'),
    t('month-11'),
  ];

  const monthYear = `${months[currentDate.getMonth()]} ${currentDate.getFullYear()}`;

  const handleMonthSelect = (monthIndex: number) => {
    if (onDateChange) {
      const newDate = new Date(selectedYear, monthIndex, 1);
      onDateChange(newDate);
      setIsCalendarOpen(false);
    }
  };

  const handleYearChange = (increment: number) => {
    setSelectedYear((prev) => prev + increment);
  };

  return (
    <header className="bg-card border-b border-border" role="banner">
      <div className="px-4 sm:px-6 md:px-4 py-3 md:py-2.5">
        {/* Single row header */}
        <div className="flex items-center justify-between gap-3 sm:gap-6 md:gap-4">
          {/* Left: Icon + Month/Year (Main focus) */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            {/* Calendar icon */}
            <div className="p-2 rounded-lg bg-primary/10 flex-shrink-0 flex items-center justify-center" aria-hidden="true">
              <CalendarIcon className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
            </div>

            {/* Month/Year selector */}
            <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  className="text-base sm:text-lg font-bold capitalize truncate border border-transparent hover:shadow-md hover:border-primary hover:scale-[1.02] px-2 sm:px-3 h-auto transition-all"
                  title="Select month/year"
                  aria-expanded={isCalendarOpen}
                  aria-haspopup="dialog"
                >
                  {monthYear}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-72" align="start">
                <div className="space-y-4">
                  {/* Year selector */}
                  <div className="flex items-center justify-between" role="group" aria-label="Year">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleYearChange(-1)}
                      aria-label="Previous year"
                    >
                      −
                    </Button>
                    <span className="font-semibold" aria-live="polite">{selectedYear}</span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleYearChange(1)}
                      aria-label="Next year"
                    >
                      +
                    </Button>
                  </div>

                  {/* Month grid */}
                  <div className="grid grid-cols-3 gap-2" role="group" aria-label="Month">
                    {months.map((month, index) => (
                      <Button
                        key={index}
                        size="sm"
                        variant={
                          index === currentDate.getMonth() &&
                          selectedYear === currentDate.getFullYear()
                            ? 'default'
                            : 'outline'
                        }
                        onClick={() => handleMonthSelect(index)}
                        className="text-xs"
                        aria-pressed={index === currentDate.getMonth() && selectedYear === currentDate.getFullYear()}
                        aria-label={month}
                      >
                        {month.slice(0, 3)}
                      </Button>
                    ))}
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>

          {/* Middle: Navigation buttons (Previous/Today/Next) */}
          <div className="flex items-center gap-1 flex-shrink-0" role="group" aria-label="Month navigation">
            <Button
              variant="ghost"
              size="sm"
              onClick={onPrevious}
              aria-label="Previous month"
              title="Previous month"
              className="border border-transparent transition-all hover:shadow-md hover:border-primary hover:scale-[1.02]"
            >
              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={onToday}
              className="text-xs font-medium transition-all hover:shadow-md hover:border-primary hover:scale-[1.02]"
              aria-label="Go to today"
              title={t('today')}
            >
              {t('today')}
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={onNext}
              aria-label="Next month"
              title="Next month"
              className="border border-transparent transition-all hover:shadow-md hover:border-primary hover:scale-[1.02]"
            >
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>

          {/* Right: Action buttons (Tags + Settings) */}
          <div className="flex items-center gap-1 flex-shrink-0" role="toolbar" aria-label="Actions">
            {/* Tags manager button */}
            {onTagManager && (
              <Button
                onClick={onTagManager}
                variant="ghost"
                size="sm"
                aria-label="Manage tags"
                title="Manage tags"
                className="border border-transparent transition-all hover:shadow-md hover:border-primary hover:scale-[1.02]"
              >
                <Tag className="h-4 w-4" aria-hidden="true" />
              </Button>
            )}

            {/* Settings button */}
            {onSettings && (
              <Button
                onClick={onSettings}
                variant="ghost"
                size="sm"
                aria-label="Settings"
                title="Settings"
                className="border border-transparent transition-all hover:shadow-md hover:border-primary hover:scale-[1.02]"
              >
                <Settings className="h-4 w-4" aria-hidden="true" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
