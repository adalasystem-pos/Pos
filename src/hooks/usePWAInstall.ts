import { useState, useEffect, useCallback } from 'react';
import { PWAInstallState } from '../types/pwa';

const PWA_DISMISSED_KEY = 'adala_pos_pwa_install_dismissed';

export function usePWAInstall(): PWAInstallState {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const isIOSStandalone = (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    return isStandalone || isIOSStandalone;
  });

  const [isPromptDismissed, setIsPromptDismissed] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem(PWA_DISMISSED_KEY) === 'true';
  });

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: BeforeInstallPromptEvent) => {
      // Prevent default mini-infobar so custom prompt is handled cleanly
      e.preventDefault();
      setDeferredPrompt(e);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      localStorage.removeItem(PWA_DISMISSED_KEY);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const promptInstall = useCallback(async (): Promise<boolean> => {
    if (!deferredPrompt) return false;

    try {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setIsInstalled(true);
        setDeferredPrompt(null);
        return true;
      } else {
        return false;
      }
    } catch (err) {
      console.error('Error triggering PWA install prompt:', err);
      return false;
    }
  }, [deferredPrompt]);

  const dismissPrompt = useCallback(() => {
    setIsPromptDismissed(true);
    try {
      localStorage.setItem(PWA_DISMISSED_KEY, 'true');
    } catch {
      // Ignore localStorage errors in private modes
    }
  }, []);

  return {
    isInstallable: !!deferredPrompt && !isInstalled && !isPromptDismissed,
    isInstalled,
    isPromptDismissed,
    promptInstall,
    dismissPrompt,
  };
}
