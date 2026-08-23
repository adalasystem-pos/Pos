import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Flame, LogOut, User as UserIcon, Clock } from 'lucide-react';
import { getBaghdadDateString, formatBaghdadTime } from '../../utils/dates';

export const Header: React.FC = () => {
  const { user, displayName, logout } = useAuth();
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
      className="bg-white border-b border-orange-100 px-4 sm:px-6 py-3.5 flex items-center justify-between shadow-xs z-30 sticky top-0 shrink-0"
    >
      {/* Brand */}
      <div className="flex items-center gap-3">
        <div className="bg-orange-500 w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold shadow-xs">
          <Flame className="w-5 h-5" />
        </div>
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-lg sm:text-xl font-black text-gray-800 leading-tight">
              سیستەمی فرۆشتنی برژاو
            </h1>
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-orange-700 bg-orange-50 border border-orange-100 px-2.5 py-1 rounded-xl">
              <Clock className="w-3.5 h-3.5 text-orange-500" />
              <span dir="ltr">{currentTime}</span>
              <span className="text-orange-200">|</span>
              <span dir="ltr">{baghdadDate}</span>
              <span className="text-[10px] text-orange-600 font-medium">(بەغدا)</span>
            </div>
          </div>
        </div>
      </div>

      {/* User profile & actions */}
      <div className="flex items-center gap-4 sm:gap-6">
        <div className="flex items-center gap-3">
          <div className="text-left hidden sm:block">
            <p className="text-xs text-gray-400 font-medium">بەکارهێنەر</p>
            <p className="text-sm font-bold text-gray-700 leading-tight">{displayName}</p>
          </div>
          <div className="h-10 w-10 rounded-full bg-orange-100 border-2 border-orange-200 flex items-center justify-center text-orange-600 font-bold shadow-2xs">
            <UserIcon className="w-5 h-5" />
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
