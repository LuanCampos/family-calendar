import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Tag,
  Settings,
  Filter,
  X,
  CalendarDays,
} from 'lucide-react';
import { format } from 'date-fns';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import type { EventTag } from '@/types/calendar';

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
  // Filter props
  availableTags?: EventTag[];
  selectedFilterTags?: string[];
  onToggleTagFilter?: (tagId: string) => void;
  onClearFilters?: () => void;
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
  availableTags = [],
  selectedFilterTags = [],
  onToggleTagFilter,
  onClearFilters,
}) => {
  const { t } = useLanguage();
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
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
      <div className="px-2 sm:px-4 md:px-4 py-2 md:py-2.5">
        {/* Mobile: Single row when space allows, Desktop: Single row */}
        <div className="flex flex-row items-center justify-between gap-1 sm:gap-3 md:gap-4">
          {/* Left: Icon + Month/Year (Main focus) */}
          <div className="flex items-center gap-1 sm:gap-3 min-w-0 flex-1">
            {/* Calendar icon */}
            <div className="p-1 sm:p-2 rounded-lg bg-primary/10 flex-shrink-0 flex items-center justify-center" aria-hidden="true">
              <CalendarIcon className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-primary" />
            </div>

            {/* Month/Year selector */}
            <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  className="text-xs sm:text-base md:text-lg font-bold capitalize truncate border border-transparent hover:shadow-md hover:border-primary hover:scale-[1.02] px-1 sm:px-2 md:px-3 h-auto transition-all"
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
                        className="text-xs hover:shadow-md hover:border-primary hover:scale-[1.02] transition-all"
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

          {/* Middle & Right: Responsive action bar - compact on mobile */}
          <div className="flex items-center gap-0 sm:gap-1 flex-nowrap justify-end flex-shrink-0" role="group" aria-label="Controls">
            {/* Navigation buttons (Previous/Today/Next) */}
            <div className="flex items-center gap-0 sm:gap-1 flex-shrink-0" role="group" aria-label="Month navigation">
              <Button
                variant="ghost"
                size="sm"
                onClick={onPrevious}
                aria-label="Previous month"
                title="Previous month"
                className="hidden sm:inline-flex border border-transparent transition-all hover:shadow-md hover:border-primary hover:scale-[1.02] p-0.5 h-7 w-7 sm:h-auto sm:w-auto sm:px-2"
              >
                <ChevronLeft className="h-3 w-3 sm:h-4 sm:w-4" aria-hidden="true" />
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={onToday}
                className="border border-transparent transition-all hover:shadow-md hover:border-primary hover:scale-[1.02] p-0.5 h-7 w-7 sm:h-auto sm:w-auto sm:px-2"
                aria-label="Go to today"
                title={t('today')}
              >
                <CalendarDays className="h-3 w-3 sm:h-4 sm:w-4" aria-hidden="true" />
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={onNext}
                aria-label="Next month"
                title="Next month"
                className="hidden sm:inline-flex border border-transparent transition-all hover:shadow-md hover:border-primary hover:scale-[1.02] p-0.5 h-7 w-7 sm:h-auto sm:w-auto sm:px-2"
              >
                <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4" aria-hidden="true" />
              </Button>
            </div>

            {/* Action buttons (Filter + Tags + Settings) */}
            <div className="flex items-center gap-0.5 sm:gap-1 flex-shrink-0" role="toolbar" aria-label="Actions">
            {/* Filter button */}
            {availableTags && availableTags.length > 0 && (
              <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant={selectedFilterTags.length > 0 ? 'default' : 'ghost'}
                    size="sm"
                    aria-label="Filter events by tags"
                    title={selectedFilterTags.length > 0 ? `Filtering by ${selectedFilterTags.length} tag(s)` : 'Filter events'}
                    className="border border-transparent transition-all hover:shadow-md hover:border-primary hover:scale-[1.02] p-0.5 h-7 w-7 sm:h-auto sm:w-auto sm:px-2"
                  >
                    <Filter className="h-3 w-3 sm:h-4 sm:w-4" aria-hidden="true" />
                    {selectedFilterTags.length > 0 && (
                      <span className="ml-0.5 sm:ml-1.5 text-xs font-semibold hidden sm:inline">{selectedFilterTags.length}</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80" align="end">
                  <div className="space-y-3">
                    <div className="font-semibold text-sm">{t('tags')}</div>
                    <div className="flex flex-wrap gap-1.5">
                      {availableTags.map((tag) => {
                        const isSelected = selectedFilterTags.includes(tag.id);
                        return (
                          <button
                            key={tag.id}
                            onClick={() => onToggleTagFilter?.(tag.id)}
                            className="px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full border transition-all text-xs sm:text-sm font-medium whitespace-nowrap hover:shadow-md hover:scale-[1.05]"
                            style={{
                              borderColor: isSelected ? tag.color : tag.color + '40',
                              backgroundColor: isSelected ? tag.color : tag.color + '15',
                              color: isSelected ? tag.color : 'hsl(var(--foreground))',
                            }}
                            title={tag.name}
                          >
                            {isSelected && <span className="mr-1">✓</span>}
                            {tag.name}
                          </button>
                        );
                      })}
                    </div>
                    {selectedFilterTags.length > 0 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          onClearFilters?.();
                          setIsFilterOpen(false);
                        }}
                        className="w-full text-xs"
                      >
                        <X className="h-3 w-3 mr-1.5" />
                        {t('clear')}
                      </Button>
                    )}
                  </div>
                </PopoverContent>
              </Popover>
            )}

            {/* Tags manager button */}
            {onTagManager && (
              <Button
                onClick={onTagManager}
                variant="ghost"
                size="sm"
                aria-label="Manage tags"
                title="Manage tags"
                className="border border-transparent transition-all hover:shadow-md hover:border-primary hover:scale-[1.02] p-0.5 h-7 w-7 sm:h-auto sm:w-auto sm:px-2"
              >
                <Tag className="h-3 w-3 sm:h-4 sm:w-4" aria-hidden="true" />
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
                className="border border-transparent transition-all hover:shadow-md hover:border-primary hover:scale-[1.02] p-0.5 h-7 w-7 sm:h-auto sm:w-auto sm:px-2"
              >
                <Settings className="h-3 w-3 sm:h-4 sm:w-4" aria-hidden="true" />
              </Button>
            )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
