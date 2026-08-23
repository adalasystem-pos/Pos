import React from 'react';
import { ShoppingBag, UtensilsCrossed, Receipt, BarChart3, Flame, Shield } from 'lucide-react';
import { NavTab } from './BottomNavigation';
import { APP_CONFIG } from '../../config/appConfig';

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
      label: 'خاڵی فرۆشتن (POS)',
      icon: ShoppingBag,
      badge: cartCount > 0 ? cartCount : undefined,
    },
    {
      id: 'products' as NavTab,
      label: 'بەڕێوەبردنی ئایتمەکان',
      icon: UtensilsCrossed,
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
      className="hidden md:flex flex-col w-64 bg-white text-gray-800 shrink-0 border-l border-orange-100 shadow-sm select-none"
    >
      {/* Restaurant Brand Header */}
      <div className="p-5 border-b border-orange-100 flex items-center gap-3 bg-white">
        <div className="w-11 h-11 bg-orange-500 text-white rounded-2xl flex items-center justify-center font-bold text-xl shadow-xs shrink-0">
          <Flame className="w-6 h-6" />
        </div>
        <div className="overflow-hidden">
          <h1 className="font-black text-base text-gray-900 tracking-tight leading-tight truncate">
            {APP_CONFIG.restaurantName}
          </h1>
          <p className="text-xs text-orange-600 font-bold leading-tight">
            {APP_CONFIG.systemName}
          </p>
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

      {/* Provider Attribution Box */}
      <div className="p-4 border-t border-orange-100 bg-orange-50/40">
        <div className="space-y-1 text-center">
          <div className="flex items-center justify-center gap-1 text-[11px] font-bold text-orange-950/80">
            <Shield className="w-3 h-3 text-orange-500" />
            <span>{APP_CONFIG.providerAttributionKurdish}</span>
          </div>
          <p className="text-[9px] text-gray-400 font-medium tracking-wide">
            {APP_CONFIG.providerAttribution}
          </p>
        </div>
      </div>
    </aside>
  );
};
