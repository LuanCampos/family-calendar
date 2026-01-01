import * as React from "react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

interface MaskedTimeInputProps {
  value?: string;
  onChange: (time: string) => void; // Called with complete "HH:MM" or empty string
  disabled?: boolean;
  className?: string;
  id?: string;
  placeholder?: string;
}

// A lightweight masked time input with immediate visual feedback.
// Behavior:
// - Accepts only digits; auto-inserts ':' after two digits
// - Shows partial input clearly (e.g., "12:" while waiting for minutes)
// - Calls onChange only when input is complete and valid (HH:MM) or cleared
export const MaskedTimeInput = React.forwardRef<HTMLInputElement, MaskedTimeInputProps>(
  ({ value, onChange, disabled = false, className, id, placeholder = "HH:MM" }, ref) => {
    const [display, setDisplay] = React.useState<string>(value || "");
    const [invalid, setInvalid] = React.useState<boolean>(false);

    React.useEffect(() => {
      setDisplay(value || "");
      setInvalid(false);
    }, [value]);

    const validateComplete = (hh: string, mm: string) => {
      const h = parseInt(hh, 10);
      const m = parseInt(mm, 10);
      return h >= 0 && h <= 23 && m >= 0 && m <= 59;
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value;
      const digits = raw.replace(/\D/g, "").slice(0, 4);

      if (digits.length === 0) {
        setDisplay("");
        setInvalid(false);
        onChange("");
        return;
      }

      if (digits.length <= 2) {
        const next = digits.length === 2 ? `${digits}:` : digits;
        setDisplay(next);
        setInvalid(false);
        return;
      }

      const hh = digits.slice(0, 2);
      const mm = digits.slice(2, 4);
      const next = `${hh}:${mm}`;
      const isValid = mm.length === 2 && validateComplete(hh, mm);
      setDisplay(next);
      setInvalid(!isValid);
      if (isValid) {
        onChange(next);
      }
    };

    const handleBlur = () => {
      // If user leaves with partial or invalid input, keep visual but don't propagate
      const match = display.match(/^(\d{2}):(\d{2})$/);
      if (match) {
        const [_, hh, mm] = match;
        const isValid = validateComplete(hh, mm);
        setInvalid(!isValid);
        if (isValid) onChange(`${hh}:${mm}`);
      } else if (display === "") {
        setInvalid(false);
        onChange("");
      } else {
        // Partial like "12:" or "1" remains visually, marked invalid
        setInvalid(true);
      }
    };

    return (
      <Input
        ref={ref}
        id={id}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        placeholder={placeholder}
        value={display}
        onChange={handleChange}
        onBlur={handleBlur}
        disabled={disabled}
        aria-invalid={invalid || undefined}
        className={cn(
          "font-mono text-sm h-9",
          invalid && "border-destructive focus-visible:ring-destructive",
          className
        )}
      />
    );
  }
);

MaskedTimeInput.displayName = "MaskedTimeInput";

export type { MaskedTimeInputProps };
