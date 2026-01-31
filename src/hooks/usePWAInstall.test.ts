import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePWAInstall } from './usePWAInstall';

// Mock logger
vi.mock('@/lib/logger', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

describe('usePWAInstall', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.deferredPWAPrompt = undefined;
    
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: query === '(display-mode: standalone)' ? false : false,
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
    });
  });

  it('should return initial state when not installable', () => {
    const { result } = renderHook(() => usePWAInstall());
    
    expect(result.current.canInstall).toBe(false);
    expect(result.current.isInstalled).toBe(false);
    expect(typeof result.current.installApp).toBe('function');
  });

  it('should detect standalone mode as installed', () => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: query === '(display-mode: standalone)',
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
    });

    const { result } = renderHook(() => usePWAInstall());
    expect(result.current.isInstalled).toBe(true);
    expect(result.current.canInstall).toBe(false);
  });

  it('should capture beforeinstallprompt event', async () => {
    const { result } = renderHook(() => usePWAInstall());

    const mockEvent = {
      preventDefault: vi.fn(),
      platforms: ['web', 'android'],
      prompt: vi.fn().mockResolvedValue(undefined),
      userChoice: Promise.resolve({ outcome: 'accepted', platform: 'android' }),
    };

    await act(async () => {
      window.dispatchEvent(Object.assign(new Event('beforeinstallprompt'), mockEvent));
    });

    expect(result.current.canInstall).toBe(true);
  });

  it('should call prompt when installApp is called', async () => {
    const { result } = renderHook(() => usePWAInstall());

    const mockPrompt = vi.fn().mockResolvedValue(undefined);
    const mockEvent = {
      preventDefault: vi.fn(),
      platforms: ['web'],
      prompt: mockPrompt,
      userChoice: Promise.resolve({ outcome: 'accepted', platform: 'web' }),
    };

    await act(async () => {
      window.dispatchEvent(Object.assign(new Event('beforeinstallprompt'), mockEvent));
    });

    await act(async () => {
      const accepted = await result.current.installApp();
      expect(accepted).toBe(true);
    });

    expect(mockPrompt).toHaveBeenCalled();
  });

  it('should return false when installApp is called without prompt', async () => {
    const { result } = renderHook(() => usePWAInstall());

    const accepted = await result.current.installApp();
    expect(accepted).toBe(false);
  });

  it('should handle dismissed installation', async () => {
    const { result } = renderHook(() => usePWAInstall());

    const mockEvent = {
      preventDefault: vi.fn(),
      platforms: ['web'],
      prompt: vi.fn().mockResolvedValue(undefined),
      userChoice: Promise.resolve({ outcome: 'dismissed', platform: 'web' }),
    };

    await act(async () => {
      window.dispatchEvent(Object.assign(new Event('beforeinstallprompt'), mockEvent));
    });

    await act(async () => {
      const accepted = await result.current.installApp();
      expect(accepted).toBe(false);
    });
  });

  it('should handle appinstalled event', async () => {
    const { result } = renderHook(() => usePWAInstall());

    const mockEvent = {
      preventDefault: vi.fn(),
      platforms: ['web'],
      prompt: vi.fn().mockResolvedValue(undefined),
      userChoice: Promise.resolve({ outcome: 'accepted', platform: 'web' }),
    };

    await act(async () => {
      window.dispatchEvent(Object.assign(new Event('beforeinstallprompt'), mockEvent));
    });

    expect(result.current.canInstall).toBe(true);

    await act(async () => {
      window.dispatchEvent(new Event('appinstalled'));
    });

    expect(result.current.isInstalled).toBe(true);
    expect(result.current.canInstall).toBe(false);
  });
});
