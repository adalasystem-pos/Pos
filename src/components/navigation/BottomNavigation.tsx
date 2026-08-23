import React from 'react';
import { ShoppingBag, Receipt, BarChart3 } from 'lucide-react';

export type NavTab = 'pos' | 'expenses' | 'reports';

interface BottomNavigationProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  cartCount?: number;
}

export const BottomNavigation: React.FC<BottomNavigationProps> = ({
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
      label: 'خەرجییەکان',
      icon: Receipt,
    },
    {
      id: 'reports' as NavTab,
      label: 'ڕاپۆرت و سندوق',
      icon: BarChart3,
    },
  ];

  return (
    <nav
      id="bottom-navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-orange-100 shadow-xl px-2 py-0.5 safe-area-pb"
    >
      <div className="flex items-center justify-around h-16">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              id={`nav-tab-${tab.id}`}
              type="button"
              onClick={() => onSelectTab(tab.id)}
              className={`relative flex flex-col items-center justify-center h-full px-4 min-w-[76px] transition-all cursor-pointer ${
                isActive
                  ? 'text-orange-600 font-bold border-t-3 border-orange-500 bg-orange-50/40'
                  : 'text-gray-400 hover:text-gray-700 active:scale-95'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
                {tab.badge !== undefined && (
                  <span className="absolute -top-1.5 -left-2.5 bg-orange-500 text-white text-[10px] font-black px-1.5 py-0.2 rounded-full min-w-[16px] text-center border-2 border-white shadow-2xs">
                    {tab.badge}
                  </span>
                )}
              </div>
              <span className="text-[11px] mt-1 tracking-tight font-bold">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
