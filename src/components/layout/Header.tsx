import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { usePOSRealtime } from '../../contexts/POSRealtimeContext';
import { APP_CONFIG } from '../../config/appConfig';
import { Flame, LogOut, User as UserIcon, Clock, Download, Smartphone, Printer } from 'lucide-react';
import { getBaghdadDateString, formatBaghdadTime } from '../../utils/dates';

export const Header: React.FC = () => {
  const { displayName, role, logout } = useAuth();
  const { isInstallable, isInstalled, promptInstall } = usePWAInstall();
  const { printerStatus, printerCapability, refreshPrinterStatus } = usePOSRealtime();
  const [currentTime, setCurrentTime] = React.useState(formatBaghdadTime(new Date()));
  const baghdadDate = getBaghdadDateString();

  React.useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(formatBaghdadTime(new Date()));
    }, 15000);
    return () => clearInterval(timer);
  }, []);

  const isCaptain = role === 'captain';
  const isHardwareVerified = printerCapability === 'verified' || printerCapability === 'available';

  return (
    <header
      id="main-header"
      className="bg-white border-b border-orange-100 px-4 sm:px-6 py-3.5 flex items-center justify-between shadow-xs z-30 sticky top-0 shrink-0 select-none"
    >
      {/* Brand */}
      <div className="flex items-center gap-3">
        <div className="bg-orange-500 w-10 h-10 rounded-2xl flex items-center justify-center text-white font-bold shadow-xs">
          <Flame className="w-5 h-5" />
        </div>
        <div>
          <div className="flex items-center gap-2.5">
            <h1
              className="font-black text-gray-900 leading-tight"
              style={{
                fontSize: '20px',
                borderWidth: '0px',
                borderStyle: 'double',
                borderRadius: '0px',
              }}
            >
              {APP_CONFIG.restaurantName}
            </h1>
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-orange-700 bg-orange-50 border border-orange-100 px-2.5 py-1 rounded-xl font-bold">
              <Clock className="w-3.5 h-3.5 text-orange-500" />
              <span dir="ltr">{currentTime}</span>
              <span className="text-orange-200">|</span>
              <span dir="ltr">{baghdadDate}</span>
              <span className="text-[10px] text-orange-600 font-medium">(عێراق)</span>
            </div>
          </div>
          <p className="text-[11px] text-gray-500 font-semibold md:hidden">
            {APP_CONFIG.systemName}
          </p>
        </div>
      </div>

      {/* User profile & actions */}
      <div className="flex items-center gap-2.5 sm:gap-4">
        {/* Minimal Hardware Printer Status (for POS/Cashier/Admin staff) */}
        {!isCaptain && (
          <>
            {isHardwareVerified ? (
              printerStatus === 'ready' ? (
                <button
                  id="header-printer-status-ready"
                  type="button"
                  onClick={() => refreshPrinterStatus()}
                  title="چاپکەری iMin پەیوەستە و ئامادەیە (کرتە بکە بۆ پشکنینەوە)"
                  className="hidden md:flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2.5 py-1.5 rounded-xl font-bold transition-all cursor-pointer shadow-2xs"
                >
                  <Printer className="w-3.5 h-3.5 text-emerald-600" />
                  <span>چاپکەر ئامادەیە</span>
                </button>
              ) : printerStatus === 'paper-missing' ? (
                <button
                  id="header-printer-status-paper"
                  type="button"
                  onClick={() => refreshPrinterStatus()}
                  title="کاغەزی چاپکەر نییە (کرتە بکە بۆ پشکنینەوە)"
                  className="flex items-center gap-1.5 text-xs text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-2.5 py-1.5 rounded-xl font-bold transition-all cursor-pointer shadow-2xs animate-pulse"
                >
                  <Printer className="w-3.5 h-3.5 text-amber-600" />
                  <span>کاغەزی چاپکەر نییە</span>
                </button>
              ) : (
                <button
                  id="header-printer-status-error"
                  type="button"
                  onClick={() => refreshPrinterStatus()}
                  title="هەڵە لە چاپکەردا هەیە (کرتە بکە بۆ پشکنینەوە)"
                  className="flex items-center gap-1.5 text-xs text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 px-2.5 py-1.5 rounded-xl font-bold transition-all cursor-pointer shadow-2xs"
                >
                  <Printer className="w-3.5 h-3.5 text-red-600" />
                  <span>هەڵەی چاپکەر</span>
                </button>
              )
            ) : (
              <div
                id="header-printer-status-unavailable"
                title="چاپکەری iMin لەم ئامێرەدا نەدۆزرایەوە (پێویستی بە ئامێری iMin هەیە)"
                className="hidden xl:flex items-center gap-1 text-[11px] text-gray-500 bg-gray-50 border border-gray-200 px-2 py-1 rounded-xl font-semibold"
              >
                <Printer className="w-3 h-3 text-gray-400" />
                <span>چاپکەر بەردەست نییە</span>
              </div>
            )}
          </>
        )}

        {/* PWA Install Button if available */}
        {isInstallable && (
          <button
            id="header-pwa-install-btn"
            type="button"
            onClick={() => promptInstall()}
            title="دامەزراندنی سیستەم وەک ئەپ"
            className="flex items-center gap-1.5 text-xs text-orange-700 bg-orange-50 hover:bg-orange-100 border border-orange-200 px-2.5 py-1.5 rounded-xl font-bold transition-all cursor-pointer shadow-2xs active:scale-95"
          >
            <Download className="w-3.5 h-3.5 text-orange-600" />
            <span className="hidden md:inline">دامەزراندنی ئەپ</span>
          </button>
        )}

        {isInstalled && (
          <div
            title="ئەپەکە لە دۆخی سەربەخۆ دامەزراوە (Standalone PWA)"
            className="hidden lg:flex items-center gap-1 text-[11px] text-green-700 bg-green-50 border border-green-200 px-2 py-1 rounded-xl font-bold"
          >
            <Smartphone className="w-3 h-3 text-green-600" />
            <span>PWA ئەپ</span>
          </div>
        )}

        <div className="flex items-center gap-2.5">
          <div className="text-left hidden sm:block">
            <div className="flex items-center gap-1 justify-end">
              <span className="text-[10px] px-1.5 py-0.2 bg-orange-100 text-orange-700 rounded-md font-black uppercase">
                {role}
              </span>
              <p className="text-xs text-gray-400 font-medium">بەکارهێنەر</p>
            </div>
            <p className="text-xs font-bold text-gray-800 leading-tight">{displayName}</p>
          </div>
          <div className="h-9 w-9 rounded-full bg-orange-100 border-2 border-orange-200 flex items-center justify-center text-orange-600 font-bold shadow-2xs">
            <UserIcon className="w-4 h-4" />
          </div>
        </div>

        <button
          id="logout-button"
          type="button"
          onClick={() => logout()}
          title="دەرچوون لە هەژمار"
          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer border border-transparent hover:border-red-200"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
