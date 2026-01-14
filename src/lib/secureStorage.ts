/**
 * Secure Storage - SEC-004
 * 
 * Provides validated access to localStorage to prevent
 * manipulation of values by malicious scripts.
 * 
 * Usage:
 *   import { getSecureStorageItem, setSecureStorageItem } from '@/lib/secureStorage';
 *   const familyId = getSecureStorageItem('current-family-id');
 *   setSecureStorageItem('current-family-id', newFamilyId);
 */

/**
 * Validation patterns for known localStorage keys
 * Each pattern ensures the value matches expected format
 */
const PATTERNS: Record<string, RegExp> = {
  // UUID with optional 'offline:' prefix
  'current-family-id': /^(offline:)?[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i,
  // Theme keys
  'budget-app-theme': /^(dark|light|nord|dracula|solarized|gruvbox|catppuccin|solarizedLight)$/,
  // Language codes
  'budget-app-language': /^(pt|en)$/,
};

/**
 * Get item from localStorage with validation
 * Returns null if value is invalid or malicious
 */
export const getSecureStorageItem = (key: string): string | null => {
  try {
    const value = localStorage.getItem(key);
    if (!value) return null;

    const pattern = PATTERNS[key];
    if (pattern && !pattern.test(value)) {
      // Value doesn't match expected pattern - potentially malicious
      // Remove the invalid value and return null
      localStorage.removeItem(key);
      return null;
    }
    return value;
  } catch {
    // localStorage may throw in private browsing mode
    return null;
  }
};

/**
 * Set item in localStorage with validation
 * Returns false if value doesn't match expected pattern
 */
export const setSecureStorageItem = (key: string, value: string): boolean => {
  try {
    const pattern = PATTERNS[key];
    if (pattern && !pattern.test(value)) {
      // Don't store invalid/malicious values
      return false;
    }
    localStorage.setItem(key, value);
    return true;
  } catch {
    // localStorage may throw in private browsing mode or quota exceeded
    return false;
  }
};

/**
 * Remove item from localStorage safely
 */
export const removeSecureStorageItem = (key: string): void => {
  try {
    localStorage.removeItem(key);
  } catch {
    // Ignore errors in private browsing mode
  }
};

/**
 * Check if a value is valid for a given key
 * Useful for validation before setting
 */
export const isValidStorageValue = (key: string, value: string): boolean => {
  const pattern = PATTERNS[key];
  if (!pattern) return true; // No pattern = no validation required
  return pattern.test(value);
};
