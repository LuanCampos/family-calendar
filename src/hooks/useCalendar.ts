import { useState, useCallback } from 'react';

/**
 * useCalendar - Manage calendar view state
 */

export const useCalendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [viewType, setViewType] = useState<'month' | 'week'>('month');

  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();

  const goToNextMonth = useCallback(() => {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
  }, [currentYear, currentMonth]);

  const goToPreviousMonth = useCallback(() => {
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
  }, [currentYear, currentMonth]);

  const goToToday = useCallback(() => {
    setCurrentDate(new Date());
  }, []);

  const selectDate = useCallback((date: string) => {
    setSelectedDate(date);
  }, []);

  return {
    currentDate,
    currentYear,
    currentMonth,
    selectedDate,
    viewType,
    setViewType,
    goToNextMonth,
    goToPreviousMonth,
    goToToday,
    selectDate,
    setCurrentDate,
  };
};
