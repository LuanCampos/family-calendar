import { useState, useEffect, useCallback } from 'react';
import { logger } from '@/lib/logger';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent;
  }
  interface Window {
    deferredPWAPrompt?: BeforeInstallPromptEvent;
  }
}

interface UsePWAInstallReturn {
  /** Whether the app can be installed (prompt is available) */
  canInstall: boolean;
  /** Whether the app is already installed as PWA */
  isInstalled: boolean;
  /** Whether we're on a supported platform */
  isSupported: boolean;
  /** Trigger the install prompt */
  installApp: () => Promise<boolean>;
}

// Capture the event globally before React mounts
if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    window.deferredPWAPrompt = e as BeforeInstallPromptEvent;
  }, { once: true });
}

export const usePWAInstall = (): UsePWAInstallReturn => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(
    () => (typeof window !== 'undefined' ? window.deferredPWAPrompt : null) || null
  );
  const [isInstalled, setIsInstalled] = useState(false);

  // Check if running as installed PWA
  useEffect(() => {
    const checkInstalled = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      const isIOSStandalone = ('standalone' in navigator) && 
        (navigator as unknown as { standalone: boolean }).standalone;
      setIsInstalled(isStandalone || isIOSStandalone);
    };

    checkInstalled();

    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    const handleChange = () => checkInstalled();
    mediaQuery.addEventListener('change', handleChange);

    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Capture the beforeinstallprompt event
  useEffect(() => {
    if (window.deferredPWAPrompt && !deferredPrompt) {
      setDeferredPrompt(window.deferredPWAPrompt);
    }

    const handleBeforeInstallPrompt = (e: BeforeInstallPromptEvent) => {
      e.preventDefault();
      setDeferredPrompt(e);
      window.deferredPWAPrompt = e;
      logger.debug('pwa.beforeinstallprompt.captured');
    };

    const handleAppInstalled = () => {
      setDeferredPrompt(null);
      window.deferredPWAPrompt = undefined;
      setIsInstalled(true);
      logger.info('pwa.installed');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [deferredPrompt]);

  const isSupported = typeof window !== 'undefined' && (
    'BeforeInstallPromptEvent' in window || 
    ('serviceWorker' in navigator && 'PushManager' in window)
  );

  const installApp = useCallback(async (): Promise<boolean> => {
    if (!deferredPrompt) {
      logger.warn('pwa.install.noPrompt');
      return false;
    }

    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      logger.info('pwa.install.choice', { outcome });
      
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
        return true;
      }
      return false;
    } catch (err) {
      logger.error('pwa.install.error', { error: err });
      return false;
    }
  }, [deferredPrompt]);

  return {
    canInstall: !!deferredPrompt && !isInstalled,
    isInstalled,
    isSupported,
    installApp,
  };
};
