import React, { useState } from 'react';
import { usePWAUpdate } from '../../hooks/usePWAUpdate';
import { RefreshCw, Sparkles, X } from 'lucide-react';

export const PWAUpdateNotification: React.FC = () => {
  const { needRefresh, updateServiceWorker, dismissUpdate } = usePWAUpdate();
  const [isUpdating, setIsUpdating] = useState<boolean>(false);

  if (!needRefresh) return null;

  const handleUpdate = async () => {
    setIsUpdating(true);
    await updateServiceWorker(true);
  };

  return (
    <div
      id="pwa-update-notification"
      className="fixed bottom-20 md:bottom-6 left-4 md:left-6 z-50 max-w-md bg-gray-900 text-white p-4 rounded-2xl shadow-2xl border border-orange-500/40 space-y-3 animate-in slide-in-from-bottom-5 duration-300 select-none text-right"
      dir="rtl"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-orange-500/20 text-orange-400 border border-orange-500/30">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-black text-white">
              وەشانێکی نوێی سیستەم بەردەستە
            </h4>
            <p className="text-[11px] text-gray-300 font-medium">
              نوێکاری و خێرایی زیاتر ئامادەیە بۆ جێبەجێکردن
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={dismissUpdate}
          className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
          title="دواتر"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex items-center justify-end gap-2 pt-1 border-t border-gray-800">
        <button
          type="button"
          onClick={dismissUpdate}
          className="text-xs text-gray-400 hover:text-white px-3 py-1.5 rounded-xl font-bold transition-colors cursor-pointer"
        >
          دواتر
        </button>
        <button
          id="btn-pwa-apply-update"
          type="button"
          onClick={handleUpdate}
          disabled={isUpdating}
          className="flex items-center gap-1.5 bg-orange-500 hover:bg-orange-600 active:scale-95 text-white px-3.5 py-1.5 rounded-xl text-xs font-black shadow-xs transition-all cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isUpdating ? 'animate-spin' : ''}`} />
          <span>{isUpdating ? 'نوێدەکرێتەوە...' : 'نوێکردنەوەی ئێستا'}</span>
        </button>
      </div>
    </div>
  );
};
