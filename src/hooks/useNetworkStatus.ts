import { useState, useEffect, useCallback } from 'react';
import { NetworkConnectionStatus, NetworkState } from '../types/pwa';

export function useNetworkStatus(): NetworkState {
  const [status, setStatus] = useState<NetworkConnectionStatus>(() => {
    if (typeof navigator === 'undefined') return 'online';
    return navigator.onLine ? 'online' : 'offline';
  });

  const [lastOnlineAt, setLastOnlineAt] = useState<Date | null>(() =>
    typeof navigator !== 'undefined' && navigator.onLine ? new Date() : null
  );

  const checkConnectivity = useCallback(async () => {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      setStatus('offline');
      return;
    }

    setStatus('reconnecting');

    // Fast lightweight verification probe
    try {
      const response = await fetch('/favicon.svg?t=' + Date.now(), {
        method: 'HEAD',
        cache: 'no-store',
      });
      if (response.ok || response.status === 304 || response.type === 'opaque') {
        setStatus('online');
        setLastOnlineAt(new Date());
      } else {
        setStatus('offline');
      }
    } catch {
      // If probe failed but navigator is online, try one more time or set online if offline mode cached
      if (navigator.onLine) {
        setStatus('online');
        setLastOnlineAt(new Date());
      } else {
        setStatus('offline');
      }
    }
  }, []);

  useEffect(() => {
    const handleOnline = () => {
      checkConnectivity();
    };

    const handleOffline = () => {
      setStatus('offline');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [checkConnectivity]);

  const isOnline = status === 'online';
  const isOffline = status === 'offline';
  const isReconnecting = status === 'reconnecting';

  return {
    status,
    isOnline,
    isOffline,
    isReconnecting,
    lastOnlineAt,
  };
}
