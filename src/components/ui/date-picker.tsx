import * as React from "react";
import { Calendar, ChevronLeft, ChevronRight, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format, parse, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, isSameDay, addMonths, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";

interface DatePickerProps {
  value?: string;
  onChange: (date: string) => void;
  disabled?: boolean;
  className?: string;
  label?: string;
  minDate?: string;
  maxDate?: string;
}

export const DatePicker = React.forwardRef<HTMLDivElement, DatePickerProps>(
  ({ value, onChange, disabled = false, className, label, minDate, maxDate }, ref) => {
    const [displayMonth, setDisplayMonth] = React.useState(() => {
      if (value) {
        return parse(value, "yyyy-MM-dd", new Date());
      }
      return new Date();
    });

    const [inputValue, setInputValue] = React.useState(value || "");

    React.useEffect(() => {
      setInputValue(value || "");
    }, [value]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      setInputValue(val);
      
      // Validar formato DD/MM/YYYY
      if (/^\d{2}\/\d{2}\/\d{4}$/.test(val)) {
        const parsed = parse(val, "dd/MM/yyyy", new Date());
        if (!isNaN(parsed.getTime())) {
          const isoDate = format(parsed, "yyyy-MM-dd");
          onChange(isoDate);
          setDisplayMonth(parsed);
        }
      }
    };

    const handleDayClick = (day: Date) => {
      const isoDate = format(day, "yyyy-MM-dd");
      setInputValue(format(day, "dd/MM/yyyy"));
      onChange(isoDate);
      setDisplayMonth(day);
    };

    const handlePrevMonth = () => {
      setDisplayMonth((prev) => subMonths(prev, 1));
    };

    const handleNextMonth = () => {
      setDisplayMonth((prev) => addMonths(prev, 1));
    };

    const daysInMonth = eachDayOfInterval({
      start: startOfMonth(displayMonth),
      end: endOfMonth(displayMonth),
    });

    const firstDayOfMonth = startOfMonth(displayMonth);
    const startingDayOfWeek = firstDayOfMonth.getDay();
    const emptyDays = Array(startingDayOfWeek).fill(null);

    const selectedDate = value ? parse(value, "yyyy-MM-dd", new Date()) : null;

    const isDateDisabled = (date: Date) => {
      const isoDate = format(date, "yyyy-MM-dd");
      if (minDate && isoDate < minDate) return true;
      if (maxDate && isoDate > maxDate) return true;
      return false;
    };

    const displayValue = value ? format(parse(value, "yyyy-MM-dd", new Date()), "dd/MM/yyyy") : "";

    return (
      <div ref={ref} className={cn("w-full", className)}>
        <Popover>
          <PopoverTrigger asChild disabled={disabled}>
            <Button
              variant="outline"
              className={cn(
                "w-full h-10 px-3 py-2 justify-start text-left font-normal",
                !value && "text-muted-foreground",
                disabled && "opacity-50 cursor-not-allowed"
              )}
            >
              <div className="flex items-center gap-3 w-full">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="flex-1">{displayValue || "Selecione uma data"}</span>
              </div>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-4">
            <div className="space-y-3">
              {/* Header with Label */}
              <div>
                <label className="text-xs font-semibold text-foreground">
                  {label || "Data"}
                </label>
              </div>

              {/* Input Manual */}
              <div className="space-y-1">
                <label htmlFor="date-input" className="text-xs text-muted-foreground">
                  Formato: DD/MM/YYYY
                </label>
                <Input
                  id="date-input"
                  type="text"
                  value={inputValue}
                  onChange={handleInputChange}
                  placeholder="DD/MM/YYYY"
                  className="h-9 text-sm"
                  maxLength={10}
                />
              </div>

              {/* Calendar Navigation */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handlePrevMonth}
                    className="h-8 w-8 p-0"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <div className="text-sm font-semibold">
                    {format(displayMonth, "MMMM yyyy", { locale: ptBR })}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleNextMonth}
                    className="h-8 w-8 p-0"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>

                {/* Calendar Grid */}
                <div className="space-y-2">
                  {/* Day Headers */}
                  <div className="grid grid-cols-7 gap-1">
                    {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"].map((day) => (
                      <div
                        key={day}
                        className="h-8 flex items-center justify-center text-xs font-semibold text-muted-foreground"
                      >
                        {day}
                      </div>
                    ))}
                  </div>

                  {/* Day Cells */}
                  <div className="grid grid-cols-7 gap-1">
                    {emptyDays.map((_, idx) => (
                      <div key={`empty-${idx}`} className="h-8" />
                    ))}
                    {daysInMonth.map((day) => {
                      const isDisabled = isDateDisabled(day);
                      const isSelected = selectedDate && isSameDay(day, selectedDate);
                      const isTodayDate = isToday(day);

                      return (
                        <Button
                          key={day.toISOString()}
                          variant="ghost"
                          size="sm"
                          onClick={() => !isDisabled && handleDayClick(day)}
                          disabled={isDisabled}
                          className={cn(
                            "h-8 w-8 p-0 text-xs font-medium transition-all",
                            !isSameMonth(day, displayMonth) && "text-muted-foreground/30",
                            isTodayDate && !isSelected && "border border-primary",
                            isSelected &&
                              "bg-primary text-primary-foreground hover:bg-primary/90",
                            isDisabled && "opacity-50 cursor-not-allowed",
                            !isSelected && !isTodayDate && !isDisabled &&
                              "hover:bg-accent hover:text-accent-foreground"
                          )}
                        >
                          {day.getDate()}
                        </Button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDayClick(new Date())}
                  className="flex-1 text-xs h-8"
                >
                  Hoje
                </Button>
                {value && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setInputValue("");
                      onChange("");
                    }}
                    className="text-xs h-8 px-2"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    );
  }
);

DatePicker.displayName = "DatePicker";

export { type DatePickerProps };
