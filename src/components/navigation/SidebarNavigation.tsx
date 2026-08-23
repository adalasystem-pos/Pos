import React from 'react';
import { ShoppingBag, Receipt, BarChart3, Flame } from 'lucide-react';
import { NavTab } from './BottomNavigation';

interface SidebarNavigationProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  cartCount?: number;
}

export const SidebarNavigation: React.FC<SidebarNavigationProps> = ({
  activeTab,
  onSelectTab,
  cartCount = 0,
}) => {
  const tabs = [
    {
      id: 'pos' as NavTab,
      label: 'فرۆشتن (POS)',
      icon: ShoppingBag,
      badge: cartCount > 0 ? cartCount : undefined,
    },
    {
      id: 'expenses' as NavTab,
      label: 'تۆماری خەرجییەکان',
      icon: Receipt,
    },
    {
      id: 'reports' as NavTab,
      label: 'ڕاپۆرت و داخستنی سندوق',
      icon: BarChart3,
    },
  ];

  return (
    <aside
      id="sidebar-navigation"
      className="hidden md:flex flex-col w-64 bg-white text-gray-800 shrink-0 border-l border-orange-100 shadow-sm"
    >
      {/* Brand */}
      <div className="p-5 border-b border-orange-100 flex items-center gap-3">
        <div className="w-10 h-10 bg-orange-500 text-white rounded-xl flex items-center justify-center font-bold text-xl shadow-xs">
          <Flame className="w-5 h-5" />
        </div>
        <div>
          <h1 className="font-black text-base text-gray-800 tracking-tight">سیستەمی فرۆشتن</h1>
          <p className="text-xs text-orange-600/80 font-bold">چێشتخانەی برژاو</p>
        </div>
      </div>

      {/* Navigation links */}
      <div className="p-4 space-y-2 flex-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              id={`sidebar-tab-${tab.id}`}
              type="button"
              onClick={() => onSelectTab(tab.id)}
              className={`w-full flex items-center justify-between p-3.5 rounded-2xl transition-all cursor-pointer text-sm ${
                isActive
                  ? 'bg-orange-500 text-white shadow-sm font-bold'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-orange-50/70 font-semibold'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
                <span>{tab.label}</span>
              </div>
              {tab.badge !== undefined && (
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-black ${
                    isActive ? 'bg-white text-orange-600' : 'bg-orange-500 text-white'
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </aside>
  );
};
