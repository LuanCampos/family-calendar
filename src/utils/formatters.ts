export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

export const formatPercentage = (value: number): string => {
  return `${value.toFixed(2)}%`;
};

export const parseCurrencyInput = (value: string): number => {
  return parseFloat(value.replace(',', '.')) || 0;
};

export const formatCurrencyInput = (value: number): string => {
  return value > 0 ? value.toFixed(2).replace('.', ',') : '';
};

export const sanitizeCurrencyInput = (value: string): string => {
  return value.replace(/[^\d,]/g, '');
};

// Formats time strings to HH:MM, stripping seconds if present.
// Accepts inputs like "H:MM", "HH:MM", "HH:MM:SS" and normalizes to "HH:MM".
export const formatTimeHHMM = (time?: string | null): string => {
  if (!time) return '';
  const match = String(time).match(/^(\d{1,2}):(\d{2})/);
  if (!match) return '';
  let h = parseInt(match[1], 10);
  const m = match[2];
  if (isNaN(h)) return '';
  if (h < 0) h = 0;
  if (h > 23) h = 23;
  const hh = String(h).padStart(2, '0');
  return `${hh}:${m}`;
};
