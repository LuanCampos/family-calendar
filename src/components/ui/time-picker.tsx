import * as React from "react";
import { Clock, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface TimePickerProps {
  value?: string;
  onChange: (time: string) => void;
  disabled?: boolean;
  className?: string;
  label?: string;
}

export const TimePicker = React.forwardRef<HTMLDivElement, TimePickerProps>(
  ({ value, onChange, disabled = false, className, label }, ref) => {
    const [inputValue, setInputValue] = React.useState(value || "");
    const [hours, setHours] = React.useState(() => {
      if (value) {
        const [h] = value.split(":");
        return h || "00";
      }
      return "00";
    });
    const [minutes, setMinutes] = React.useState(() => {
      if (value) {
        const [, m] = value.split(":");
        return m || "00";
      }
      return "00";
    });

    React.useEffect(() => {
      setInputValue(value || "");
      if (value) {
        const [h, m] = value.split(":");
        setHours(h || "00");
        setMinutes(m || "00");
      }
    }, [value]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      setInputValue(val);

      // Validar formato HH:MM
      if (/^\d{2}:\d{2}$/.test(val)) {
        const [h, m] = val.split(":");
        const hNum = parseInt(h, 10);
        const mNum = parseInt(m, 10);
        if (hNum >= 0 && hNum < 24 && mNum >= 0 && mNum < 60) {
          onChange(val);
          setHours(h);
          setMinutes(m);
        }
      }
    };

    const handleHourChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      let h = e.target.value.padStart(2, "0");
      const hNum = parseInt(h, 10);
      if (hNum > 23) h = "23";
      if (hNum < 0) h = "00";
      setHours(h);
      const newTime = `${h}:${minutes}`;
      setInputValue(newTime);
      onChange(newTime);
    };

    const handleMinuteChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      let m = e.target.value.padStart(2, "0");
      const mNum = parseInt(m, 10);
      if (mNum > 59) m = "59";
      if (mNum < 0) m = "00";
      setMinutes(m);
      const newTime = `${hours}:${m}`;
      setInputValue(newTime);
      onChange(newTime);
    };

    const incrementHour = () => {
      let h = (parseInt(hours, 10) + 1) % 24;
      const hStr = String(h).padStart(2, "0");
      setHours(hStr);
      const newTime = `${hStr}:${minutes}`;
      setInputValue(newTime);
      onChange(newTime);
    };

    const decrementHour = () => {
      let h = (parseInt(hours, 10) - 1 + 24) % 24;
      const hStr = String(h).padStart(2, "0");
      setHours(hStr);
      const newTime = `${hStr}:${minutes}`;
      setInputValue(newTime);
      onChange(newTime);
    };

    const incrementMinute = () => {
      let m = (parseInt(minutes, 10) + 1) % 60;
      const mStr = String(m).padStart(2, "0");
      setMinutes(mStr);
      const newTime = `${hours}:${mStr}`;
      setInputValue(newTime);
      onChange(newTime);
    };

    const decrementMinute = () => {
      let m = (parseInt(minutes, 10) - 1 + 60) % 60;
      const mStr = String(m).padStart(2, "0");
      setMinutes(mStr);
      const newTime = `${hours}:${mStr}`;
      setInputValue(newTime);
      onChange(newTime);
    };

    return (
      <div ref={ref} className={cn("w-full", className)}>
        <Popover>
          <PopoverTrigger asChild disabled={disabled}>
            <Button
              variant="outline"
              size="sm"
              className={cn(
                "h-10 w-10 p-0 flex items-center justify-center",
                disabled && "opacity-50 cursor-not-allowed"
              )}
              title="Abrir seletor de hora"
            >
              <Clock className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-4">
            <div className="space-y-3">
              {/* Hour and Minute Pickers */}
              <div className="flex gap-3 justify-center">
                {/* Hours */}
                <div className="flex flex-col items-center space-y-2">
                  <label className="text-xs font-semibold text-foreground">Horas</label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={incrementHour}
                    className="h-8 w-8 p-0"
                  >
                    ▲
                  </Button>
                  <Input
                    type="number"
                    min="0"
                    max="23"
                    value={hours}
                    onChange={handleHourChange}
                    className="h-10 w-14 text-center text-sm font-mono font-bold"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={decrementHour}
                    className="h-8 w-8 p-0"
                  >
                    ▼
                  </Button>
                </div>

                {/* Separator */}
                <div className="flex items-center justify-center pt-4">
                  <span className="text-lg font-bold text-muted-foreground">:</span>
                </div>

                {/* Minutes */}
                <div className="flex flex-col items-center space-y-2">
                  <label className="text-xs font-semibold text-foreground">Minutos</label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={incrementMinute}
                    className="h-8 w-8 p-0"
                  >
                    ▲
                  </Button>
                  <Input
                    type="number"
                    min="0"
                    max="59"
                    value={minutes}
                    onChange={handleMinuteChange}
                    className="h-10 w-14 text-center text-sm font-mono font-bold"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={decrementMinute}
                    className="h-8 w-8 p-0"
                  >
                    ▼
                  </Button>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const now = new Date();
                    const h = String(now.getHours()).padStart(2, "0");
                    const m = String(now.getMinutes()).padStart(2, "0");
                    const newTime = `${h}:${m}`;
                    setInputValue(newTime);
                    setHours(h);
                    setMinutes(m);
                    onChange(newTime);
                  }}
                  className="flex-1 text-xs h-8"
                >
                  Agora
                </Button>
                {value && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setInputValue("");
                      setHours("00");
                      setMinutes("00");
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

TimePicker.displayName = "TimePicker";

export { type TimePickerProps };
