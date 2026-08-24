import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { APP_CONFIG } from '../../config/appConfig';
import { Flame, LogOut, User as UserIcon, Clock, Download, Smartphone } from 'lucide-react';
import { getBaghdadDateString, formatBaghdadTime } from '../../utils/dates';

export const Header: React.FC = () => {
  const { displayName, role, logout } = useAuth();
  const { isInstallable, isInstalled, promptInstall } = usePWAInstall();
  const [currentTime, setCurrentTime] = React.useState(formatBaghdadTime(new Date()));
  const baghdadDate = getBaghdadDateString();

  React.useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(formatBaghdadTime(new Date()));
    }, 15000);
    return () => clearInterval(timer);
  }, []);

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
