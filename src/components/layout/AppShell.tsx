import React from 'react';
import { BottomNavigation, NavTab } from '../navigation/BottomNavigation';
import { SidebarNavigation } from '../navigation/SidebarNavigation';
import { Header } from './Header';
import { NetworkBanner } from '../ui/NetworkBanner';
import { ToastContainer } from '../ui/Toast';
import { useCart } from '../../hooks/useCart';

interface AppShellProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({ activeTab, onSelectTab, children }) => {
  const { itemCount } = useCart();

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-orange-50/75 text-gray-800 overflow-x-hidden font-sans">
      {/* Desktop Sidebar */}
      <SidebarNavigation
        activeTab={activeTab}
        onSelectTab={onSelectTab}
        cartCount={itemCount}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen pb-24 md:pb-6">
        <NetworkBanner />
        <Header />

        <main className="flex-1 p-3 sm:p-5 lg:p-6 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <BottomNavigation
        activeTab={activeTab}
        onSelectTab={onSelectTab}
        cartCount={itemCount}
      />

      {/* Toast Notifications */}
      <ToastContainer />
    </div>
  );
};
