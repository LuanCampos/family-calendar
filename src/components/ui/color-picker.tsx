import * as React from "react";
import { Pipette } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
  disabled?: boolean;
  className?: string;
  label?: string;
}

const PRESET_COLORS = [
  "#3B82F6", // Blue
  "#EF4444", // Red
  "#10B981", // Green
  "#F59E0B", // Amber
  "#8B5CF6", // Purple
  "#EC4899", // Pink
  "#14B8A6", // Teal
  "#F97316", // Orange
  "#6366F1", // Indigo
  "#06B6D4", // Cyan
  "#84CC16", // Lime
  "#A78BFA", // Violet
];

// Convert HEX to HSL
const hexToHsl = (hex: string): [number, number, number] => {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0,
    s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  return [h * 360, s * 100, l * 100];
};

// Convert HSL to HEX
const hslToHex = (h: number, s: number, l: number): string => {
  h = h / 360;
  s = s / 100;
  l = l / 100;

  let r, g, b;

  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }

  const toHex = (x: number) => {
    const hex = Math.round(x * 255).toString(16);
    return hex.length === 1 ? "0" + hex : hex;
  };

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
};

export const ColorPicker = React.forwardRef<HTMLDivElement, ColorPickerProps>(
  ({ value, onChange, disabled = false, className, label }, ref) => {
    const [inputValue, setInputValue] = React.useState(value);
    const [hsl, setHsl] = React.useState(() => hexToHsl(value));
    const [tempColor, setTempColor] = React.useState(value);
    const [tempHsl, setTempHsl] = React.useState(() => hexToHsl(value));
    const [isOpen, setIsOpen] = React.useState(false);
    const gradientRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
      setInputValue(value);
      setHsl(hexToHsl(value));
      setTempColor(value);
      setTempHsl(hexToHsl(value));
    }, [value]);

    const handleOpenChange = (open: boolean) => {
      setIsOpen(open);
      if (open) {
        // Ao abrir, resetar temp para valores atuais
        setTempColor(value);
        setTempHsl(hexToHsl(value));
      }
    };

    const handleConfirm = () => {
      setInputValue(tempColor);
      setHsl(tempHsl);
      onChange(tempColor);
      setIsOpen(false);
    };

    const handleCancel = () => {
      setTempColor(value);
      setTempHsl(hexToHsl(value));
      setIsOpen(false);
    };

    const handleHexChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      let val = e.target.value;
      if (!val.startsWith("#")) {
        val = "#" + val;
      }
      val = val.slice(0, 7);
      if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
        setTempColor(val);
        setTempHsl(hexToHsl(val));
      }
    };

    const handlePresetClick = (color: string) => {
      setTempColor(color);
      setTempHsl(hexToHsl(color));
    };

    const handleRgbInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const hex = e.target.value;
      if (/^#[0-9A-Fa-f]{6}$/.test(hex)) {
        setTempColor(hex);
        setTempHsl(hexToHsl(hex));
      }
    };

    const handleGradientClick = (e: React.MouseEvent<HTMLDivElement>) => {
      if (!gradientRef.current) return;

      const rect = gradientRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      // Calculate saturation and lightness from position
      const saturation = (x / rect.width) * 100;
      const lightness = 100 - (y / rect.height) * 100;

      const newHsl: [number, number, number] = [tempHsl[0], saturation, lightness];
      setTempHsl(newHsl);

      const hex = hslToHex(newHsl[0], newHsl[1], newHsl[2]);
      setTempColor(hex);
    };

    const handleHueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newHue = parseFloat(e.target.value);
      const newHsl: [number, number, number] = [newHue, tempHsl[1], tempHsl[2]];
      setTempHsl(newHsl);

      const hex = hslToHex(newHsl[0], newHsl[1], newHsl[2]);
      setTempColor(hex);
    };

    const hueColor = hslToHex(tempHsl[0], 100, 50);

    return (
      <>
        <div ref={ref} className={cn("w-full", className)}>
          <Button
            onClick={() => setIsOpen(true)}
            variant="outline"
            disabled={disabled}
            className={cn(
              "w-full h-10 px-3 py-2 justify-start text-left font-normal",
              !value && "text-muted-foreground",
              disabled && "opacity-50 cursor-not-allowed"
            )}
          >
            <div className="flex items-center gap-3 w-full">
              <div
                className="w-6 h-6 rounded border border-input shadow-sm transition-all"
                style={{ backgroundColor: value || "#3B82F6" }}
              />
              <span className="flex-1 font-mono text-sm">{inputValue.toUpperCase()}</span>
              <Pipette className="h-4 w-4 text-muted-foreground" />
            </div>
          </Button>
        </div>

        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
          <DialogContent className="sm:max-w-sm w-full p-3 sm:p-4 [&_button[type='button']:first-child]:hidden">
            <div className="space-y-2">
              {/* Color Preview */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">
                  {label || "Cor"}
                </label>
                <div className="flex gap-2">
                  <div
                    className="w-10 h-10 rounded-lg border-2 border-input shadow-sm transition-all"
                    style={{ backgroundColor: tempColor || "#3B82F6" }}
                  />
                  <div className="flex-1 space-y-0.5">
                    <p className="text-xs text-muted-foreground">HEX</p>
                    <Input
                      type="text"
                      value={tempColor.toUpperCase()}
                      onChange={handleRgbInputChange}
                      placeholder="#3B82F6"
                      className="h-7 font-mono text-xs"
                      maxLength={7}
                    />
                  </div>
                </div>
              </div>

              {/* Gradient Picker */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">
                  Seletor de Cor
                </label>
                <div
                  ref={gradientRef}
                  onClick={handleGradientClick}
                  className="relative w-full h-32 rounded-lg cursor-crosshair border border-input shadow-sm overflow-hidden"
                  style={{
                    background: `linear-gradient(to right, white, ${hueColor}), linear-gradient(to top, black, transparent)`,
                    backgroundBlendMode: "multiply, normal",
                  }}
                >
                  {/* Selection Indicator */}
                  <div
                    className="absolute w-3 h-3 rounded-full border-2 border-white shadow-lg pointer-events-none"
                    style={{
                      left: `${tempHsl[1]}%`,
                      top: `${100 - tempHsl[2]}%`,
                      transform: "translate(-50%, -50%)",
                    }}
                  />
                </div>
              </div>

              {/* Hue Slider */}
              <div className="space-y-1">
                <label htmlFor="hue-slider" className="text-xs font-semibold text-foreground">
                  Tom (Hue)
                </label>
                <input
                  id="hue-slider"
                  type="range"
                  min="0"
                  max="360"
                  value={tempHsl[0]}
                  onChange={handleHueChange}
                  className="w-full h-6 rounded-lg appearance-none cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, 
                      hsl(0, 100%, 50%), 
                      hsl(60, 100%, 50%), 
                      hsl(120, 100%, 50%), 
                      hsl(180, 100%, 50%), 
                      hsl(240, 100%, 50%), 
                      hsl(300, 100%, 50%), 
                      hsl(360, 100%, 50%))`,
                  }}
                />
              </div>
              {/* Preset Colors */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">
                  Cores Sugeridas
                </label>
                <div className="grid grid-cols-6 gap-1.5">
                  {PRESET_COLORS.map((color) => (
                    <button
                      key={color}
                      onClick={() => handlePresetClick(color)}
                      className={cn(
                        "w-7 h-7 rounded-lg border-2 transition-all hover:scale-110 active:scale-95",
                        value === color
                          ? "border-primary shadow-lg ring-2 ring-primary ring-offset-1"
                          : "border-input hover:border-primary"
                      )}
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCancel}
                  className="flex-1 text-xs h-7"
                >
                  Cancelar
                </Button>
                <Button
                  size="sm"
                  onClick={handleConfirm}
                  className="flex-1 text-xs h-7"
                >
                  OK
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </>
    );
  }
);

ColorPicker.displayName = "ColorPicker";

export { type ColorPickerProps };
