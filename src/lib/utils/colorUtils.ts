/**
 * Convert hex color to RGB values
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

/**
 * Calculate relative luminance of a color
 * Uses the WCAG formula: (R * 0.299 + G * 0.587 + B * 0.114)
 */
export function getColorLuminance(hex: string): number {
  const rgb = hexToRgb(hex);
  if (!rgb) return 128; // default to medium luminance if conversion fails

  // Standard luminance formula
  return rgb.r * 0.299 + rgb.g * 0.587 + rgb.b * 0.114;
}

/**
 * Get appropriate text color (white or dark) based on background color luminance
 * Returns 'white' for dark backgrounds and a dark text color for light backgrounds
 */
export function getContrastColor(backgroundColor: string): string {
  const luminance = getColorLuminance(backgroundColor);
  // Threshold of ~186 provides good contrast for most colors
  return luminance > 186 ? '#1a1a1a' : 'white';
}
