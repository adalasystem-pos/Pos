import { useState, useEffect, useCallback, useRef } from 'react';
import { PWAUpdateState } from '../types/pwa';
import { registerSW } from 'virtual:pwa-register';

export function usePWAUpdate(): PWAUpdateState {
  const [needRefresh, setNeedRefresh] = useState<boolean>(false);
  const [offlineReady, setOfflineReady] = useState<boolean>(false);
  const updateSWRef = useRef<((reloadPage?: boolean) => Promise<void>) | null>(null);

  useEffect(() => {
    try {
      updateSWRef.current = registerSW({
        onNeedRefresh() {
          setNeedRefresh(true);
        },
        onOfflineReady() {
          setOfflineReady(true);
        },
        onRegisterError(error) {
          console.warn('PWA service worker registration error (handled):', error);
        },
      });
    } catch (err) {
      console.warn('PWA registerSW initialization error (handled):', err);
    }
  }, []);

  const updateServiceWorker = useCallback(
    async (reloadPage: boolean = true): Promise<void> => {
      if (updateSWRef.current) {
        await updateSWRef.current(reloadPage);
      } else {
        window.location.reload();
      }
    },
    []
  );

  const dismissUpdate = useCallback(() => {
    setNeedRefresh(false);
  }, []);

  return {
    needRefresh,
    offlineReady,
    updateServiceWorker,
    dismissUpdate,
  };
}
