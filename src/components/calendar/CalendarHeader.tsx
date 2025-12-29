import React from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Settings, Tag, LogOut } from 'lucide-react';
import { useState } from 'react';
import { SettingsPanel } from '@/components/settings';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface CalendarHeaderProps {
  currentDate: Date;
  onPrevious: () => void;
  onNext: () => void;
  onToday: () => void;
  onDateChange?: (date: Date) => void;
  onTagManager?: () => void;
  userEmail?: string;
}

export const CalendarHeader: React.FC<CalendarHeaderProps> = ({
  currentDate,
  onPrevious,
  onNext,
  onToday,
  onDateChange,
  onTagManager,
  userEmail,
}) => {
  const { signOut } = useAuth();
  const { t } = useLanguage();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());

  const months = [
    t('month-0'), t('month-1'), t('month-2'), t('month-3'),
    t('month-4'), t('month-5'), t('month-6'), t('month-7'),
    t('month-8'), t('month-9'), t('month-10'), t('month-11'),
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
    setSelectedYear(prev => prev + increment);
  };

  return (
    <div className="border-b bg-card">
      <div className="px-4 sm:px-6 py-3 sm:py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
        <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
          <div className="p-2 rounded-lg bg-primary/10">
            <CalendarIcon className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
          </div>
          <Popover open={isCalendarOpen} onOpenChange={(open) => {
            setIsCalendarOpen(open);
            if (open) {
              // Sync selected year with current date when opening
              setSelectedYear(currentDate.getFullYear());
            }
          }}>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                className="text-lg sm:text-2xl font-semibold capitalize truncate hover:bg-accent p-2 h-auto"
                title="Selecionar mês/ano"
              >
                {monthYear}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-4" align="start">
              {/* Year selector */}
              <div className="flex items-center justify-between mb-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleYearChange(-1)}
                  className="h-8 w-8 p-0"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-lg font-semibold">{selectedYear}</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleYearChange(1)}
                  className="h-8 w-8 p-0"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              
              {/* Month grid */}
              <div className="grid grid-cols-3 gap-2">
                {months.map((month, index) => {
                  const isCurrentMonth = 
                    index === currentDate.getMonth() && 
                    selectedYear === currentDate.getFullYear();
                  
                  return (
                    <Button
                      key={month}
                      variant={isCurrentMonth ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleMonthSelect(index)}
                      className="h-12 text-sm font-medium"
                    >
                      {month.substring(0, 3)}
                    </Button>
                  );
                })}
              </div>
            </PopoverContent>
          </Popover>
        </div>

        <div className="flex items-center gap-1 sm:gap-2 flex-wrap justify-end sm:justify-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={onToday}
            className="text-xs sm:text-sm hidden sm:inline-flex"
            title={t('today')}
          >
            {t('today')}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onPrevious}
            className="gap-1 h-9 px-2 sm:px-3"
            title={t('previous')}
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="hidden sm:inline text-xs sm:text-sm">{t('previous')}</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onNext}
            className="gap-1 h-9 px-2 sm:px-3"
            title={t('next')}
          >
            <span className="hidden sm:inline text-xs sm:text-sm">{t('next')}</span>
            <ChevronRight className="h-4 w-4" />
          </Button>

          <div className="w-px h-6 bg-border mx-1 hidden sm:block" />

          {/* Right side actions */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onTagManager}
            title={t('manageTags')}
            className="h-9 w-9 sm:h-auto sm:w-auto px-2 sm:px-3"
          >
            <Tag className="h-4 w-4" />
            <span className="hidden sm:inline text-xs sm:text-sm ml-1">{t('tags')}</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsSettingsOpen(true)}
            title={t('settings')}
            className="h-9 w-9 sm:h-auto sm:w-auto px-2 sm:px-3"
          >
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline text-xs sm:text-sm ml-1">{t('settings')}</span>
          </Button>

          {userEmail && (
            <div className="text-xs text-muted-foreground hidden md:flex items-center gap-2 px-2 sm:px-3 py-1 border-l ml-1 pl-2 sm:pl-3">
              <span className="truncate max-w-[150px]">{userEmail}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => signOut()}
                title={t('logout')}
                className="h-7 w-7 p-0"
              >
                <LogOut className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Settings Modal */}
      <SettingsPanel isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </div>
  );
};
