import React, { createContext, useContext, useState } from 'react';

interface CalendarContextType {
  currentDate: Date;
  selectedDate: string | null;
  viewType: 'month' | 'week';
  setCurrentDate: (date: Date) => void;
  setSelectedDate: (date: string | null) => void;
  setViewType: (view: 'month' | 'week') => void;
}

const CalendarContext = createContext<CalendarContextType | undefined>(undefined);

export const CalendarProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [viewType, setViewType] = useState<'month' | 'week'>('month');

  return (
    <CalendarContext.Provider
      value={{
        currentDate,
        selectedDate,
        viewType,
        setCurrentDate,
        setSelectedDate,
        setViewType,
      }}
    >
      {children}
    </CalendarContext.Provider>
  );
};

export const useCalendarContext = () => {
  const context = useContext(CalendarContext);
  if (!context) {
    throw new Error(
      'useCalendarContext must be used within CalendarProvider'
    );
  }
  return context;
};
