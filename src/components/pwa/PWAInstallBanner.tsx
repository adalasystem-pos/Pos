import React, { useState } from 'react';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { Download, X, Smartphone, Check } from 'lucide-react';

export const PWAInstallBanner: React.FC = () => {
  const { isInstallable, promptInstall, dismissPrompt } = usePWAInstall();
  const [isInstalling, setIsInstalling] = useState<boolean>(false);
  const [installedSuccess, setInstalledSuccess] = useState<boolean>(false);

  if (!isInstallable && !installedSuccess) return null;

  const handleInstallClick = async () => {
    setIsInstalling(true);
    const success = await promptInstall();
    setIsInstalling(false);
    if (success) {
      setInstalledSuccess(true);
      setTimeout(() => setInstalledSuccess(false), 4000);
    }
  };

  return (
    <div
      id="pwa-install-banner"
      className="bg-linear-to-r from-orange-600 to-amber-600 text-white px-3 sm:px-4 py-2 sm:py-2.5 shadow-md flex items-center justify-between gap-3 text-xs sm:text-sm border-b border-orange-500/40 select-none animate-in fade-in slide-in-from-top-2 duration-300"
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="p-1.5 rounded-xl bg-white/20 text-white shrink-0 backdrop-blur-xs">
          {installedSuccess ? <Check className="w-4 h-4" /> : <Smartphone className="w-4 h-4" />}
        </div>
        <div className="min-w-0">
          <p className="font-black text-white text-xs sm:text-sm truncate">
            {installedSuccess
              ? 'سیستەم بە سەرکەوتوویی وەک ئەپ دامەزرا'
              : 'دامەزراندنی سیستەمی Adala POS'}
          </p>
          <p className="text-[11px] text-orange-100 font-medium hidden sm:block truncate">
            {installedSuccess
              ? 'دەتوانیت ڕاستەوخۆ لەسەر شاشەی سەرەکی یان دێسکتۆپ بیکەیتەوە'
              : 'ئەپەکە دابمەزرێنە بۆ دەستگەیشتنی خێرا، شاشەی تەواو و بەکارهێنانی متمانەپێکراو'}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {!installedSuccess && (
          <>
            <button
              id="pwa-install-btn"
              type="button"
              onClick={handleInstallClick}
              disabled={isInstalling}
              className="flex items-center gap-1.5 bg-white hover:bg-orange-50 text-orange-700 active:scale-95 px-3 py-1.5 rounded-xl font-black text-xs shadow-xs transition-all cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isInstalling ? 'دادەمەزرێت...' : 'دامەزراندن'}</span>
            </button>
            <button
              id="pwa-dismiss-btn"
              type="button"
              onClick={dismissPrompt}
              className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
              title="دواتر"
            >
              <X className="w-4 h-4" />
            </button>
          </>
        )}
      </div>
    </div>
  );
};
