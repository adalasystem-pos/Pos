import React from 'react';
import { WifiOff } from 'lucide-react';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';

export const NetworkBanner: React.FC = () => {
  const { isOnline } = useNetworkStatus();

  if (isOnline) return null;

  return (
    <div
      id="offline-banner"
      className="bg-red-700 text-white text-xs sm:text-sm px-4 py-2 flex items-center justify-center gap-2 shadow-inner font-medium text-center"
    >
      <WifiOff className="w-4 h-4 shrink-0 animate-pulse" />
      <span>پەیوەندی ئینتەرنێت پچڕاوە. هەتا پەیوەندی نەبەسترێتەوە پاراستنی دارایی ئەنجام نادرێت.</span>
    </div>
  );
};
