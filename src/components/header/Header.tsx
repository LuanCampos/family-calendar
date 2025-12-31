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
  const today = new Date();
  const todayMonth = today.getMonth();
  const todayYear = today.getFullYear();

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
    <header className="bg-card border-b border-border shadow-sm" role="banner">
      <div className="px-3 sm:px-4 md:px-6 py-2.5 sm:py-3">
        {/* Mobile-first responsive layout */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 sm:gap-4">
          {/* Top row: Icon + Month/Year + Today button (mobile) */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            {/* Calendar icon */}
            <div className="p-2 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex-shrink-0 flex items-center justify-center shadow-sm" aria-hidden="true">
              <CalendarIcon className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
            </div>

            {/* Month/Year selector */}
            <Popover open={isCalendarOpen} onOpenChange={(open) => {
              setIsCalendarOpen(open);
              if (open) {
                // Sync the year selector to the currently viewed year
                setSelectedYear(currentDate.getFullYear());
              }
            }}>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  className="text-base sm:text-lg md:text-xl font-bold capitalize truncate border border-transparent hover:shadow-md hover:border-primary hover:scale-[1.02] px-2 sm:px-3 md:px-4 py-2 h-auto transition-all min-h-[44px] sm:min-h-0"
                  title="Selecionar mês/ano"
                  aria-expanded={isCalendarOpen}
                  aria-haspopup="dialog"
                >
                  {monthYear}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 sm:w-72" align="start" sideOffset={8}>
                <div className="space-y-4 p-2">
                  {/* Year selector */}
                  <div className="flex items-center justify-between" role="group" aria-label="Ano">
                    <Button
                      size="default"
                      variant="outline"
                      onClick={() => handleYearChange(-1)}
                      aria-label="Ano anterior"
                      className="h-11 w-11 p-0 text-lg"
                    >
                      −
                    </Button>
                    <span className="font-bold text-lg" aria-live="polite">{selectedYear}</span>
                    <Button
                      size="default"
                      variant="outline"
                      onClick={() => handleYearChange(1)}
                      aria-label="Próximo ano"
                      className="h-11 w-11 p-0 text-lg"
                    >
                      +
                    </Button>
                  </div>

                  {/* Month grid */}
                  <div className="grid grid-cols-3 gap-2.5" role="group" aria-label="Mês">
                    {months.map((month, index) => {
                      const isHighlighted = index === todayMonth && selectedYear === todayYear;
                      return (
                        <Button
                          key={index}
                          size="default"
                          variant={isHighlighted ? 'default' : 'outline'}
                          onClick={() => handleMonthSelect(index)}
                          className="text-sm h-12 hover:shadow-md hover:border-primary hover:scale-[1.05] transition-all font-medium"
                          aria-pressed={isHighlighted}
                          aria-label={month}
                        >
                          {month.slice(0, 3)}
                        </Button>
                      );
                    })}
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>

          {/* Bottom row (mobile) / Right side (desktop): Action buttons */}
          <div className="flex items-center gap-2 sm:gap-2 flex-nowrap justify-between sm:justify-end flex-shrink-0" role="group" aria-label="Controles">
            {/* Navigation buttons - Visible on mobile */}
            <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0" role="group" aria-label="Navegação do mês">
              <Button
                variant="outline"
                size="default"
                onClick={onPrevious}
                aria-label="Mês anterior"
                title="Mês anterior"
                className="border border-border transition-all hover:shadow-md hover:border-primary hover:scale-[1.05] h-11 w-11 p-0 sm:h-9 sm:w-9"
              >
                <ChevronLeft className="h-5 w-5 sm:h-4 sm:w-4" aria-hidden="true" />
              </Button>

              <Button
                variant="default"
                size="default"
                onClick={onToday}
                className="transition-all hover:shadow-md hover:scale-[1.05] h-11 w-11 p-0 sm:h-9 sm:w-9"
                aria-label="Ir para hoje"
                title={t('today')}
              >
                <CalendarDays className="h-5 w-5 sm:h-4 sm:w-4" aria-hidden="true" />
              </Button>

              <Button
                variant="outline"
                size="default"
                onClick={onNext}
                aria-label="Próximo mês"
                title="Próximo mês"
                className="border border-border transition-all hover:shadow-md hover:border-primary hover:scale-[1.05] h-11 w-11 p-0 sm:h-9 sm:w-9"
              >
                <ChevronRight className="h-5 w-5 sm:h-4 sm:w-4" aria-hidden="true" />
              </Button>
            </div>

            {/* Action buttons (Filter + Tags + Settings) */}
            <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0" role="toolbar" aria-label="Ações">
            {/* Filter button */}
            {availableTags && availableTags.length > 0 && (
              <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant={selectedFilterTags.length > 0 ? 'default' : 'outline'}
                    size="default"
                    aria-label="Filtrar eventos por tags"
                    title={selectedFilterTags.length > 0 ? `Filtrando por ${selectedFilterTags.length} tag(s)` : 'Filtrar eventos'}
                    className="border border-border transition-all hover:shadow-md hover:border-primary hover:scale-[1.05] h-11 w-11 p-0 sm:h-9 sm:w-9"
                  >
                    <Filter className="h-5 w-5 sm:h-4 sm:w-4" aria-hidden="true" />
                    {selectedFilterTags.length > 0 && (
                      <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive text-destructive-foreground text-xs font-bold flex items-center justify-center shadow-md">{selectedFilterTags.length}</span>
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
                variant="outline"
                size="default"
                aria-label="Gerenciar tags"
                title="Gerenciar tags"
                className="border border-border transition-all hover:shadow-md hover:border-primary hover:scale-[1.05] h-11 w-11 p-0 sm:h-9 sm:w-9"
              >
                <Tag className="h-5 w-5 sm:h-4 sm:w-4" aria-hidden="true" />
              </Button>
            )}

            {/* Settings button */}
            {onSettings && (
              <Button
                onClick={onSettings}
                variant="outline"
                size="default"
                aria-label="Configurações"
                title="Configurações"
                className="border border-border transition-all hover:shadow-md hover:border-primary hover:scale-[1.05] h-11 w-11 p-0 sm:h-9 sm:w-9"
              >
                <Settings className="h-5 w-5 sm:h-4 sm:w-4" aria-hidden="true" />
              </Button>
            )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
