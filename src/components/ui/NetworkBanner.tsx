import React from 'react';
import { WifiOff, RefreshCw } from 'lucide-react';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';

export const NetworkBanner: React.FC = () => {
  const { isOnline, isReconnecting, isOffline } = useNetworkStatus();

  if (isOnline) return null;

  if (isReconnecting) {
    return (
      <div
        id="reconnecting-banner"
        className="bg-amber-600 text-white text-xs sm:text-sm px-4 py-2 flex items-center justify-center gap-2 shadow-inner font-medium text-center animate-pulse select-none"
      >
        <RefreshCw className="w-4 h-4 shrink-0 animate-spin" />
        <span>دووبارە پەیوەستبوونەوە بە سیستەم و هێڵی ئینتەرنێت...</span>
      </div>
    );
  }

  if (isOffline) {
    return (
      <div
        id="offline-banner"
        className="bg-red-700 text-white text-xs sm:text-sm px-4 py-2 flex items-center justify-center gap-2 shadow-inner font-medium text-center select-none"
      >
        <WifiOff className="w-4 h-4 shrink-0 animate-pulse" />
        <span>پەیوەندی ئینتەرنێت بەردەست نییە. هەتا پەیوەندی نەبەسترێتەوە پاراستنی دارایی ئەنجام نادرێت.</span>
      </div>
    );
  }

  return null;
};
